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
// If Lyzr uses different field casing we isolate the mapping here.
export async function chatWithDirector(req: LyzrChatRequest): Promise<LyzrChatResponse> {
  const env = getEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
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

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) {
        throw new LyzrError("LYZR_AUTH", "CareerPilot is misconfigured. Contact support.", res.status, text);
      }
      if (res.status === 429) {
        throw new LyzrError("LYZR_RATE_LIMIT", "Too many requests. Please try again shortly.", res.status, text);
      }
      throw new LyzrError("LYZR_API", `Lyzr API error (${res.status})`, res.status, text);
    }

    const data = (await res.json().catch(async () => ({ response: await res.text() }))) as Record<string, unknown>;

    // Normalize possible field names: response | message | output | data
    const response =
      (data.response as string | undefined) ??
      (data.message as string | undefined) ??
      (data.output as string | undefined) ??
      (data.data as string | undefined) ??
      (typeof data === "string" ? (data as unknown as string) : "");

    if (!response || typeof response !== "string") {
      // Some Lyzr variants wrap in data.response or choices
      const maybeChoices = (data as { choices?: Array<{ message?: { content?: string } }> }).choices;
      if (maybeChoices?.[0]?.message?.content) {
        return { response: maybeChoices[0].message.content, session_id: req.session_id };
      }
      if (!response) throw new LyzrError("LYZR_EMPTY", "No response received. Try rephrasing.", 502, JSON.stringify(data).slice(0, 2000));
    }

    return { response: response as string, session_id: (data.session_id as string) ?? req.session_id };
  } catch (err) {
    if (err instanceof LyzrError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new LyzrError("LYZR_TIMEOUT", "Career Compass is taking too long. Please retry.", 504, "");
    }
    const msg = err instanceof Error ? err.message : String(err);
    // Avoid leaking internal details
    if (msg.includes("Missing/invalid env")) throw err;
    throw new LyzrError("LYZR_NETWORK", "Cannot reach CareerPilot. Check connection.", 502, msg.slice(0, 1000));
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
 * Strategy A: send raw text extraction as a chat message with [RESUME] prefix.
 * Strategy B (future): if Lyzr exposes POST /v3/files/upload or multipart /chat,
 * extend this function to try that first and fall back to text extraction.
 * UI calls only this function.
 */
export async function sendResumeToDirector(params: SendResumeParams): Promise<LyzrChatResponse> {
  const text = await extractTextFromBuffer(params.fileBuffer, params.mimeType, params.fileName);
  if (!text || text.trim().length < 20) {
    throw new LyzrError("RESUME_EMPTY", "Could not read resume text. Try a different PDF/DOCX export.", 400, "");
  }
  const message = `[RESUME UPLOAD: ${params.fileName}]\n\n${text.slice(0, 15000)}\n\nPlease analyze this resume and provide a structured assessment (skills, experience, education, projects, strengths, gaps, and overall summary).`;
  return chatWithDirector({ message, session_id: params.session_id, user_id: params.user_id });
}

async function extractTextFromBuffer(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
    const mod = (await import("pdf-parse")) as unknown as { default?: (b: Buffer) => Promise<{ text: string }> } & ((b: Buffer) => Promise<{ text: string }>);
    const pdfParse = (mod.default ?? mod) as (b: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text ?? "";
  }
  if (lower.endsWith(".docx") || mimeType.includes("officedocument.wordprocessingml")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  }
  // Fallback: try pdf then docx
  try {
    const mod = (await import("pdf-parse")) as unknown as { default?: (b: Buffer) => Promise<{ text: string }> } & ((b: Buffer) => Promise<{ text: string }>);
    const pdfParse = (mod.default ?? mod) as (b: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    if (data.text?.trim()) return data.text;
  } catch {}
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    if (result.value?.trim()) return result.value;
  } catch {}
  return "";
}
