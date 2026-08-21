import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  session_id: z.string().min(1),
  user_id: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("cp_session", parsed.data.session_id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  res.cookies.set("cp_user", parsed.data.user_id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export async function GET(req: NextRequest) {
  const session_id = req.cookies.get("cp_session")?.value;
  const user_id = req.cookies.get("cp_user")?.value;
  return NextResponse.json({ session_id: session_id ?? null, user_id: user_id ?? null });
}
