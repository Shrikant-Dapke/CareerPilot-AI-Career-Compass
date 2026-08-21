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

// Simple in-memory rate limiter (per instance)
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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
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

  // Demo mode: return mock without calling Lyzr
  if (hasDemoMode()) {
    return NextResponse.json({ response: demoChatResponse, session_id: parsed.data.session_id });
  }

  try {
    const result = await chatWithDirector({
      message: parsed.data.message,
      session_id: parsed.data.session_id,
      user_id: parsed.data.user_id,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof LyzrError) {
      // Never leak details or keys
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Missing/invalid env")) {
      return NextResponse.json({ error: "Server is misconfigured. Missing LYZR_API_KEY or LYZR_AGENT_ID." }, { status: 500 });
    }
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
