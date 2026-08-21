import { NextRequest, NextResponse } from "next/server";
import { LyzrError, sendResumeToDirector } from "@/lib/lyzr";
import { hasDemoMode } from "@/lib/env";
import { demoChatResponse } from "@/lib/demo";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  void req.headers.get("x-forwarded-for");
  console.log("[DIAG] /api/resume: hit", { hasDemo: hasDemoMode() });

  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    console.error("[DIAG] /api/resume: formData parse failed", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Invalid upload. Use multipart form-data with file." }, { status: 400 });
  }

  const file = form.get("file");
  const session_id = form.get("session_id");
  const user_id = form.get("user_id");
  console.log("[DIAG] /api/resume: fields", {
    fileType: file instanceof File ? (file as File).type : typeof file,
    fileName: file instanceof File ? (file as File).name : String(file).slice(0, 50),
    fileSize: file instanceof File ? (file as File).size : 0,
    session_id: typeof session_id === "string" ? (session_id as string).slice(0, 8) : String(session_id).slice(0, 20),
    user_id: typeof user_id === "string" ? (user_id as string).slice(0, 8) : String(user_id).slice(0, 20),
  });

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file. Attach PDF or DOCX as 'file'." }, { status: 400 });
  }
  if (typeof session_id !== "string" || !session_id) {
    return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
  }
  if (typeof user_id !== "string" || !user_id) {
    return NextResponse.json({ error: "Missing user_id." }, { status: 400 });
  }

  const mime = file.type || "";
  const name = file.name || "resume";
  const lower = name.toLowerCase();
  const isPdf = lower.endsWith(".pdf") || mime === "application/pdf";
  const isDocx = lower.endsWith(".docx") || mime.includes("officedocument.wordprocessingml");
  if (!isPdf && !isDocx) {
    return NextResponse.json({ error: "Unsupported file type. Use PDF or DOCX." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. Max 10 MB." }, { status: 400 });
  }

  if (hasDemoMode()) {
    return NextResponse.json({ response: demoChatResponse, session_id });
  }

  try {
    console.log("[DIAG] /api/resume: reading buffer", { name, mime, size: file.size });
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("[DIAG] /api/resume: buffer len", buffer.length, "calling sendResumeToDirector");
    const result = await sendResumeToDirector({
      fileName: name,
      fileBuffer: buffer,
      mimeType: mime,
      session_id,
      user_id,
    });
    console.log("[DIAG] /api/resume: success, responseLen", result.response.length);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[DIAG] /api/resume: caught error", err instanceof Error ? err.message : String(err), err instanceof Error ? (err as unknown as { stack?: string }).stack?.slice(0, 800) : "");
    if (err instanceof LyzrError) {
      console.error("[DIAG] /api/resume: LyzrError", err.code, err.status, err.details.slice(0, 500));
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      // Include details in dev for debugging without leaking key
      return NextResponse.json({ error: err.message, code: err.code, details: err.details.slice(0, 500) }, { status });
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Missing/invalid env")) {
      console.error("[DIAG] /api/resume: missing env");
      return NextResponse.json({ error: "Server is misconfigured. Missing LYZR_API_KEY or LYZR_AGENT_ID." }, { status: 500 });
    }
    console.error("[DIAG] /api/resume: generic fallback", msg.slice(0, 500));
    return NextResponse.json({ error: `Resume processing failed: ${msg.slice(0, 200)}` }, { status: 500 });
  }
}
