"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";

export default function SettingsPage() {
  const { newSession, sessionId, userId } = useSession();
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card className="mt-6">
        <CardHeader><div className="text-sm font-medium">Session</div><div className="text-xs text-zinc-400">Anonymous session used for Lyzr context. Start a new conversation to reset.</div></CardHeader>
        <CardContent>
          <div className="space-y-1 text-xs text-zinc-400"><div>session_id: <span className="text-zinc-200">{sessionId ?? "—"}</span></div><div>user_id: <span className="text-zinc-200">{userId ?? "—"}</span></div><div>Agent: Career Compass Director • {process.env.NEXT_PUBLIC_DEMO_MODE ? "demo" : "live"}</div></div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => newSession()}>Start new conversation</Button>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader><div className="text-sm font-medium">Demo mode</div><div className="text-xs text-zinc-400">{demo ? "Enabled — mock responses used, no Lyzr calls." : "Disabled — real Lyzr API is used. Set NEXT_PUBLIC_DEMO_MODE=true to enable mocks."}</div></CardHeader>
      </Card>
    </div>
  );
}
