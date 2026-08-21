import { NextRequest, NextResponse } from "next/server";
import { LyzrError, sendResumeToDirector } from "@/lib/lyzr";
import { hasDemoMode } from "@/lib/env";
import { demoChatResponse } from "@/lib/demo";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  void req.headers.get("x-forwarded-for");
  // Reuse simple check from chat route (duplicated intentionally to keep routes isolated)
  // No global rate limiter import to avoid coupling.

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload. Use multipart form-data with file." }, { status: 400 });
  }

  const file = form.get("file");
  const session_id = form.get("session_id");
  const user_id = form.get("user_id");

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
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await sendResumeToDirector({
      fileName: name,
      fileBuffer: buffer,
      mimeType: mime,
      session_id,
      user_id,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof LyzrError) {
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Missing/invalid env")) {
      return NextResponse.json({ error: "Server is misconfigured. Missing LYZR_API_KEY or LYZR_AGENT_ID." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to process resume. Try a different export." }, { status: 500 });
  }
}
