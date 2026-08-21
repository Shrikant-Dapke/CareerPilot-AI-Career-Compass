import "server-only";
import { getEnv } from "./env";

export type LyzrChatRequest = {
  message: string;
  session_id: string;
  user_id: string;
};

export type LyzrChatResponse = {
  response: string;
  session_id: string;
};

// Shape confirmed from Lyzr Studio docs: POST /v3/inference/chat with x-api-key
// Body: { agent_id, session_id, user_id, message }
export async function chatWithDirector(req: LyzrChatRequest): Promise<LyzrChatResponse> {
  const start = Date.now();
  console.log("[LYZR] request start", {
    hasEnv: !!process.env.LYZR_API_KEY,
    agentIdPrefix: (process.env.LYZR_AGENT_ID || "").slice(0, 6),
    session_id: req.session_id.slice(0, 8),
    messageLen: req.message.length,
  });
  const env = getEnv();
  const controller = new AbortController();
  const timeoutMs = 90_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log("[LYZR] fetch ->", env.LYZR_API_URL);
    const res = await fetch(env.LYZR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.LYZR_API_KEY,
      },
      body: JSON.stringify({
        user_id: req.user_id,
        agent_id: env.LYZR_AGENT_ID,
        session_id: req.session_id,
        message: req.message,
      }),
      signal: controller.signal,
    });

    const latency = Date.now() - start;
    console.log("[LYZR] response", { status: res.status, statusText: res.statusText, latencyMs: latency });
    const rawBody = await res.text();
    if (rawBody.length < 2000) console.log("[LYZR] body", rawBody.slice(0, 800));
    else console.log("[LYZR] body snippet", rawBody.slice(0, 800), `... total ${rawBody.length}`);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new LyzrError("LYZR_AUTH", "CareerPilot is misconfigured. Contact support.", res.status, rawBody.slice(0, 1000));
      }
      if (res.status === 429) {
        throw new LyzrError("LYZR_RATE_LIMIT", "Too many requests. Please try again shortly.", res.status, rawBody.slice(0, 1000));
      }
      throw new LyzrError("LYZR_API", `Lyzr API error (${res.status})`, res.status, rawBody.slice(0, 1000));
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      data = { response: rawBody } as Record<string, unknown>;
    }

    // Normalize possible field names: response | message | output | data
    const response =
      (data.response as string | undefined) ??
      (data.message as string | undefined) ??
      (data.output as string | undefined) ??
      (data.data as string | undefined) ??
      (typeof data === "string" ? (data as unknown as string) : "");

    if (!response || typeof response !== "string") {
      const maybeChoices = (data as { choices?: Array<{ message?: { content?: string } }> }).choices;
      if (maybeChoices?.[0]?.message?.content) {
        console.log("[LYZR] using choices fallback");
        return { response: maybeChoices[0].message.content, session_id: req.session_id };
      }
      console.error("[LYZR] empty response", JSON.stringify(data).slice(0, 2000));
      if (!response) throw new LyzrError("LYZR_EMPTY", "No response received from Career Compass. Try rephrasing.", 502, JSON.stringify(data).slice(0, 2000));
    }

    console.log("[LYZR] success", { responseLen: (response as string).length, latencyMs: Date.now() - start });
    return { response: response as string, session_id: (data.session_id as string) ?? req.session_id };
  } catch (err) {
    if (err instanceof LyzrError) {
      console.error("[LYZR] LyzrError", err.code, err.status, err.message, err.details.slice(0, 500));
      throw err;
    }
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[LYZR] timeout after", timeoutMs, "ms");
      throw new LyzrError("LYZR_TIMEOUT", "Career Compass is taking longer than expected (90s). Please retry — your session is still active.", 504, "");
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[LYZR] network/error", msg.slice(0, 800));
    if (msg.includes("Missing/invalid env")) throw err;
    throw new LyzrError("LYZR_NETWORK", "Cannot reach Career Compass. Check connection and retry.", 502, msg.slice(0, 1000));
  } finally {
    clearTimeout(timeout);
  }
}

export class LyzrError extends Error {
  code: string;
  status: number;
  details: string;
  constructor(code: string, message: string, status: number, details: string) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Resume handling — isolated so UI never changes when Lyzr file spec changes.
export type SendResumeParams = {
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  session_id: string;
  user_id: string;
};

/**
 * Strategy: extract text then send as chat message with [RESUME] prefix.
 * Future: if Lyzr exposes POST /v3/files/upload or multipart /chat,
 * extend this function to try that first and fall back to text extraction.
 * UI calls only this function.
 */
export type ResumeAnalysisResult = LyzrChatResponse & { resumeText: string };

export async function sendResumeToDirector(params: SendResumeParams): Promise<ResumeAnalysisResult> {
  console.log("[LYZR] sendResume start", {
    fileName: params.fileName,
    mimeType: params.mimeType,
    bufferLen: params.fileBuffer.length,
    session_id: params.session_id.slice(0, 8),
  });
  let text: string;
  try {
    text = await extractTextFromBuffer(params.fileBuffer, params.mimeType, params.fileName);
    console.log("[LYZR] extracted textLen", text.length);
  } catch (e) {
    console.error("[LYZR] extraction threw", e instanceof Error ? e.message : String(e));
    throw new LyzrError("RESUME_PARSE_ERROR", `Resume extraction failed: ${e instanceof Error ? e.message : String(e)}`, 500, "");
  }
  if (!text || text.trim().length < 20) {
    console.error("[LYZR] extracted too short", text.length);
    throw new LyzrError("RESUME_EMPTY", "Could not read resume text. Try a different PDF/DOCX export.", 400, `extractedLen=${text.length}`);
  }
  const message = `[RESUME UPLOAD: ${params.fileName}]\n\n${text.slice(0, 15000)}\n\nPlease analyze this resume and provide a structured assessment (skills, experience, education, projects, strengths, gaps, and overall summary).`;
  console.log("[LYZR] sendResume -> chat messageLen", message.length);
  const chatRes = await chatWithDirector({ message, session_id: params.session_id, user_id: params.user_id });
  return { ...chatRes, resumeText: text.slice(0, 15000) };
}

async function extractTextFromBuffer(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  console.log("[LYZR] extract entry", { lower, mimeType, bufLen: buffer.length });
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const dataBytes = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer;
      const parser = new PDFParse({ data: dataBytes as Uint8Array });
      await (parser as unknown as { load: () => Promise<void> }).load();
      const result = await parser.getText();
      const text = (result as { text: string }).text ?? "";
      await parser.destroy().catch(() => {});
      console.log("[LYZR] pdf textLen", text.length);
      return text;
    } catch (e) {
      console.error("[LYZR] pdf-parse failed", e instanceof Error ? e.message : String(e));
      throw e;
    }
  }
  if (lower.endsWith(".docx") || mimeType.includes("officedocument.wordprocessingml")) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value ?? "";
      console.log("[LYZR] docx textLen", text.length);
      return text;
    } catch (e) {
      console.error("[LYZR] mammoth failed", e instanceof Error ? e.message : String(e));
      throw e;
    }
  }
  // Fallback: try pdf then docx
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    await (parser as unknown as { load: () => Promise<void> }).load();
    const result = await parser.getText();
    const text = (result as { text: string }).text ?? "";
    await parser.destroy().catch(() => {});
    if (text.trim()) return text;
  } catch {}
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    if (result.value?.trim()) return result.value;
  } catch {}
  return "";
}
