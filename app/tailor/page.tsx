"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCareerPilotStore } from "@/stores/careerpilot-store";
import { useSession } from "@/hooks/useSession";
import { normalizeLyzrResponse } from "@/lib/response-normalizer";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import Link from "next/link";
import { Loader2, AlertTriangle } from "lucide-react";

export default function TailorPage() {
  const { candidate, selectedJob, tailoredResume, setTailoredResume, setAtsReport } = useCareerPilotStore();
  const { sessionId, userId } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCandidate = !!candidate.resumeAnalysis;
  const hasJob = !!selectedJob;

  const generate = async () => {
    if (!hasCandidate || !hasJob || !sessionId || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const prompt = `Tailor my resume for the selected job below. Use ONLY facts from my original resume — do not invent skills, employers, dates, degrees, or projects. Reorder, rephrase, and emphasize relevant existing experience. Flag missing skills instead of fabricating.

ORIGINAL RESUME TEXT:
${candidate.resumeText?.slice(0, 6000) ?? candidate.resumeAnalysis?.slice(0, 6000)}

SELECTED JOB:
Title: ${selectedJob.title}
Company: ${selectedJob.company ?? "—"}
Location: ${selectedJob.location ?? "—"}
Raw: ${selectedJob.rawBlock.slice(0, 2000)}

Provide: 1) Tailored Resume (full), 2) What changed (bullets), 3) Missing skills flagged.`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, session_id: sessionId, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tailoring failed");
      const norm = normalizeLyzrResponse(data.response as string);
      if (norm.ats) setAtsReport(norm.ats);
      setTailoredResume(data.response as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!hasCandidate) {
    return (
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Resume Tailor</h1>
        <Card className="mt-6"><CardHeader><div className="text-sm font-medium">No resume analyzed</div><div className="text-xs text-zinc-400">Analyze a resume first — it becomes the source for tailoring.</div></CardHeader><CardContent><Link href="/resume"><Button>Go to Resume</Button></Link></CardContent></Card>
      </div>
    );
  }

  if (!hasJob) {
    return (
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Resume Tailor</h1>
        <p className="mt-1 text-sm text-zinc-400">Select a job to tailor your resume. Only existing facts will be used.</p>
        <Card className="mt-6"><CardHeader><div className="text-sm font-medium">No job selected</div><div className="text-xs text-zinc-400">Go to Job Matches and choose Tailor Resume on a card.</div></CardHeader><CardContent><Link href="/jobs"><Button>Go to Job Matches</Button></Link></CardContent></Card>
        <Card className="mt-4"><CardHeader><div className="text-sm font-medium">Original Resume</div></CardHeader><CardContent><div className="max-h-[50vh] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm"><MarkdownRenderer content={candidate.resumeAnalysis ?? candidate.resumeText ?? ""} /></div></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Resume Tailor</h1>
      <p className="mt-1 text-sm text-zinc-400">Tailoring <b className="text-zinc-200">{candidate.resumeFileName}</b> for <b className="text-zinc-200">{selectedJob.title}</b> at {selectedJob.company ?? "—"} — Lyzr Resume Precision Tailor, no invented facts.</p>
      <div className="mt-4 flex gap-2">
        <Button onClick={generate} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{loading ? "Tailoring your resume for this role..." : "Generate Tailored Resume"}</Button>
        <Link href="/jobs"><Button variant="ghost">Change Job</Button></Link>
      </div>
      {error && <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"><AlertTriangle className="h-4 w-4" />{error}</div>}
      {loading && <div className="mt-3 text-xs text-zinc-400">Reordering and emphasizing relevant experience… checking keyword alignment…</div>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><div className="text-sm font-medium">Original Resume</div><div className="text-xs text-zinc-400">{candidate.resumeFileName} • {selectedJob ? `for ${selectedJob.title}` : ""}</div></CardHeader><CardContent><div className="max-h-[70vh] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm"><MarkdownRenderer content={candidate.resumeAnalysis ?? candidate.resumeText ?? "—"} /></div></CardContent></Card>
        <Card><CardHeader><div className="text-sm font-medium">Tailored Resume</div><div className="text-xs text-zinc-400">{tailoredResume ? "From Lyzr — no invented skills/dates" : "Click Generate to create"}</div></CardHeader><CardContent>{tailoredResume ? <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm"><MarkdownRenderer content={tailoredResume} /></div> : <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">Tailored content appears after generation. Ask in Chat: “Tailor my resume for this job” also works.</div>}</CardContent></Card>
      </div>
      <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">Safety: tailored resume never invents skills, employers, titles, dates, projects, certs, or education. Missing skills are flagged, not fabricated.</div>
    </div>
  );
}
