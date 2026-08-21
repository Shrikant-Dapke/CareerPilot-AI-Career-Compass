"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { JobCard } from "@/components/jobs/JobCard";
import { normalizeLyzrResponse } from "@/lib/response-normalizer";
import { useCareerPilotStore } from "@/stores/careerpilot-store";
import { useSession } from "@/hooks/useSession";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";

export default function JobsPage() {
  const { candidate, jobMatches, setJobMatches, setSelectedJob, upsertTracked } = useCareerPilotStore();
  const { sessionId, userId } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAnalysis = !!candidate.resumeAnalysis;

  // Auto-generate job matches from candidate profile (requirement 4/5)
  useEffect(() => {
    if (!hasAnalysis) return;
    if (jobMatches.length > 0) return;
    if (!sessionId || !userId) return;
    if (loading) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build context-aware prompt — Lyzr remains AI brain, we just supply context (requirement 6)
        const skillsSnippet = candidate.resumeText ? candidate.resumeText.slice(0, 2000) : candidate.resumeAnalysis!.slice(0, 2000);
        const prompt = `Based on my analyzed resume below, find and rank the most relevant job opportunities for me. Prioritize jobs matching my skills. For each job, provide title, company, location, match percentage, matching skills, missing skills, and why it matches.

CANDIDATE RESUME:
${skillsSnippet}

Please return 5-8 ranked jobs with structured details.`;
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt, session_id: sessionId, user_id: userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Job search failed");
        const norm = normalizeLyzrResponse(data.response as string);
        if (!cancelled) {
          // Only store if Lyzr actually returned jobs — never invent (requirement 13)
          if (norm.jobs.length) setJobMatches(norm.jobs);
          else setError("Lyzr returned no structured jobs. Try asking in AI Chat: 'Find jobs that suit my resume'.");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnalysis, sessionId, userId]);

  const handleSelect = (job: (typeof jobMatches)[number]) => {
    setSelectedJob(job);
    router.push("/tailor");
  };

  const handleSave = (job: (typeof jobMatches)[number]) => {
    upsertTracked({ id: job.id, title: job.title, company: job.company, location: job.location, matchScore: job.matchScore, url: job.url, status: "saved", savedAt: Date.now() });
  };

  const handleTailor = (job: (typeof jobMatches)[number]) => {
    setSelectedJob(job);
    router.push("/tailor");
  };

  if (!hasAnalysis) {
    return (
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Job Matches</h1>
        <p className="mt-1 text-sm text-zinc-400">Jobs are matched against your analyzed resume — never invented.</p>
        <Card className="mt-6">
          <CardHeader><div className="text-sm font-medium">No resume analyzed yet</div><div className="text-xs text-zinc-400">Upload and analyze your resume to generate real matches based on your skills.</div></CardHeader>
          <CardContent><Link href="/resume"><Button>Upload Resume</Button></Link></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Matches</h1>
          <p className="mt-1 text-sm text-zinc-400">Ranked against <b className="text-zinc-200">{candidate.resumeFileName}</b> • {jobMatches.length} matches • Never invented.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setJobMatches([]); }} disabled={loading}>Regenerate</Button>
      </div>

      {loading && (
        <Card className="mt-6">
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <div className="text-sm text-zinc-300">Finding jobs that match your profile…</div>
            <div className="text-xs text-zinc-500">Career Compass is ranking opportunities — this can take up to 60s.</div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mt-6 border-red-500/20 bg-red-500/10">
          <CardContent className="p-4 flex items-start gap-2 text-sm text-red-200"><AlertTriangle className="h-4 w-4 mt-0.5" /> <span>{error}</span> <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setJobMatches([])}>Retry</Button></CardContent>
        </Card>
      )}

      {!loading && !error && jobMatches.length === 0 && (
        <Card className="mt-6">
          <CardHeader><div className="text-sm font-medium">No matches yet</div><div className="text-xs text-zinc-400">If auto-generation failed, ask in AI Chat: “Find jobs that suit my resume”.</div></CardHeader>
          <CardContent><Link href="/chat"><Button><Sparkles className="mr-2 h-4 w-4" />Ask CareerPilot</Button></Link></CardContent>
        </Card>
      )}

      {!loading && jobMatches.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {jobMatches.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              onSave={() => handleSave(j)}
              onAnalyze={() => { setSelectedJob(j); }}
              onTailor={() => handleTailor(j)}
            />
          ))}
        </div>
      )}

      {/* Action hint for selected job */}
      {jobMatches.length > 0 && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
          Select a job card’s <b>Tailor Resume</b> to send it to Resume Tailor, or <b>Save</b> to track an application.
        </div>
      )}
    </div>
  );
}
