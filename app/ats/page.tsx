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

export default function ATSPage() {
  const { candidate, selectedJob, tailoredResume, atsReport, setAtsReport, setTailoredResume } = useCareerPilotStore();
  const { sessionId, userId } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCandidate = !!candidate.resumeAnalysis;

  const score = atsReport?.score;
  const kw = atsReport?.keywordCoverage;

  const checkATS = async (useTailored: boolean) => {
    if (!hasCandidate || !sessionId || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const resumeToCheck = useTailored && tailoredResume ? tailoredResume.slice(0, 6000) : (candidate.resumeText ?? candidate.resumeAnalysis ?? "").slice(0, 6000);
      const jobCtx = selectedJob ? `Job: ${selectedJob.title} at ${selectedJob.company ?? "—"}\n${selectedJob.rawBlock.slice(0, 1500)}` : "No specific job selected — check general ATS readiness.";
      const prompt = `Perform ATS optimization analysis for the resume below${useTailored ? " (tailored version)" : ""} against the job if provided. Report: ATS score (0-100), keyword coverage %, missing keywords, formatting issues, section completeness, parsability, and actionable recommendations. Do not invent scores — base on resume/job content.

RESUME:
${resumeToCheck}

${jobCtx}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, session_id: sessionId, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ATS check failed");
      const norm = normalizeLyzrResponse(data.response as string);
      if (norm.ats) setAtsReport(norm.ats);
      // If tailored was requested, also store optimized resume if returned
      if (useTailored && /optimized resume|tailored resume/i.test(data.response as string)) setTailoredResume(data.response as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!hasCandidate) {
    return (
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">ATS Optimizer</h1>
        <Card className="mt-6"><CardHeader><div className="text-sm font-medium">No resume analyzed</div></CardHeader><CardContent><Link href="/resume"><Button>Analyze Resume First</Button></Link></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">ATS Optimizer</h1>
      <p className="mt-1 text-sm text-zinc-400">Analysis by Lyzr ATS Resume Aligner — using <b className="text-zinc-200">{candidate.resumeFileName}</b> {selectedJob ? `vs ${selectedJob.title}` : "(general)"} {tailoredResume ? "• tailored available" : ""}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card><CardHeader><div className="text-xs text-zinc-400">ATS Score</div></CardHeader><CardContent><div className="text-2xl font-semibold">{typeof score === "number" ? `${score}/100` : "--"}</div><div className="text-xs text-zinc-500">{typeof score === "number" ? "From Lyzr ATS Aligner" : "Run a check"}</div></CardContent></Card>
        <Card><CardHeader><div className="text-xs text-zinc-400">Keyword Coverage</div></CardHeader><CardContent><div className="text-2xl font-semibold">{typeof kw === "number" ? `${kw}%` : "--"}</div></CardContent></Card>
        <Card><CardHeader><div className="text-xs text-zinc-400">Formatting</div></CardHeader><CardContent><div className="text-sm">{atsReport?.formatting ?? "--"}</div></CardContent></Card>
        <Card><CardHeader><div className="text-xs text-zinc-400">Section Completeness</div></CardHeader><CardContent><div className="text-sm">{atsReport?.sectionCompleteness ?? atsReport?.parsability ?? "--"}</div></CardContent></Card>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => checkATS(false)} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{loading ? "Checking ATS compatibility..." : "Check ATS"}</Button>
        <Button variant="outline" onClick={() => checkATS(true)} disabled={loading || !tailoredResume}>Generate Optimized Resume</Button>
        {!selectedJob && <Link href="/jobs"><Button variant="ghost">Select a Job for Job-Specific Check</Button></Link>}
      </div>
      {error && <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"><AlertTriangle className="h-4 w-4" />{error}</div>}
      {loading && <div className="mt-2 text-xs text-zinc-400">Checking ATS compatibility… analyzing keywords and sections…</div>}

      <Card className="mt-6"><CardHeader><div className="text-sm font-medium">Missing Keywords & Suggestions</div></CardHeader><CardContent>
        {atsReport?.missingKeywords?.length ? <div className="flex flex-wrap gap-1.5">{atsReport.missingKeywords.map((k) => <span key={k} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">{k}</span>)}</div> : <div className="text-sm text-zinc-400">No missing keywords yet — run a check.</div>}
        {atsReport?.suggestions?.length ? <ul className="mt-4 list-disc pl-5 text-sm text-zinc-300 space-y-1">{atsReport.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul> : null}
        {atsReport && <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-400">Raw ATS details are from Lyzr — no fake scores. Refresh to keep session.</div>}
      </CardContent></Card>

      {tailoredResume && <Card className="mt-6"><CardHeader><div className="text-sm font-medium">Optimized Resume Preview</div></CardHeader><CardContent><div className="max-h-[60vh] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm"><MarkdownRenderer content={tailoredResume.slice(0, 6000)} /></div></CardContent></Card>}
    </div>
  );
}
