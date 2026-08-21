"use client";
import { useCareerPilotStore } from "@/stores/careerpilot-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const columns = ["saved", "applied", "interview", "offer", "rejected"] as const;

export default function ApplicationsPage() {
  const { tracker, updateTrackedStatus, removeTracked } = useCareerPilotStore();

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Application Tracker</h1>
      <p className="mt-1 text-sm text-zinc-400">v1 persists in localStorage. No database required.</p>

      {tracker.length === 0 ? (
        <Card className="mt-6"><CardContent className="p-8 text-center text-sm text-zinc-400">No saved jobs yet. Save from Job Matches.</CardContent></Card>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {columns.map((col) => (
            <div key={col} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-3 flex items-center justify-between"><span className="text-xs font-medium uppercase tracking-wide text-zinc-300">{col}</span><Badge>{tracker.filter((t) => t.status === col).length}</Badge></div>
              <div className="space-y-2">
                {tracker.filter((t) => t.status === col).map((t) => (
                  <Card key={t.id}>
                    <CardHeader><div className="text-sm font-medium">{t.title}</div><div className="text-xs text-zinc-400">{t.company ?? "—"} {t.location ? `• ${t.location}` : ""}</div></CardHeader>
                    <CardContent>
                      <select value={t.status} onChange={(e) => updateTrackedStatus(t.id, e.target.value as typeof t.status)} className="w-full rounded-lg border border-white/10 bg-black px-2 py-1.5 text-xs">
                        {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => removeTracked(t.id)}>Remove</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
