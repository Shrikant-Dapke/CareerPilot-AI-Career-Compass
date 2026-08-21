import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatWithDirector, LyzrError } from "@/lib/lyzr";
import { hasDemoMode } from "@/lib/env";
import { demoChatResponse } from "@/lib/demo";

export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().min(1).max(15000),
  session_id: z.string().min(1),
  user_id: z.string().min(1),
});

const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 20;
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    console.warn("[API/chat] rate-limited", ip);
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request. Provide message, session_id, user_id." }, { status: 400 });
  }

  if (hasDemoMode()) {
    return NextResponse.json({ response: demoChatResponse, session_id: parsed.data.session_id });
  }

  try {
    console.log("[API/chat] -> Lyzr", { session: parsed.data.session_id.slice(0, 8), msgLen: parsed.data.message.length });
    const result = await chatWithDirector({
      message: parsed.data.message,
      session_id: parsed.data.session_id,
      user_id: parsed.data.user_id,
    });
    console.log("[API/chat] <- Lyzr success", { latencyMs: Date.now() - start, respLen: result.response.length });
    return NextResponse.json(result);
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (err instanceof LyzrError) {
      console.error("[API/chat] LyzrError", err.code, err.status, `latency ${latencyMs}ms`, err.details.slice(0, 400));
      // Map timeout to 504 with retryable message, auth to 502 without leaking details
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[API/chat] unexpected", msg.slice(0, 500), `latency ${latencyMs}ms`);
    if (msg.includes("Missing/invalid env")) {
      return NextResponse.json({ error: "Server is misconfigured. Missing LYZR_API_KEY or LYZR_AGENT_ID." }, { status: 500 });
    }
    return NextResponse.json({ error: "Career Compass encountered an unexpected issue. Please retry.", code: "UNKNOWN" }, { status: 500 });
  }
}
