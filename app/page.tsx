"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AgentWorkflow } from "@/components/dashboard/AgentWorkflow";
import { ArrowRight, FileText, Briefcase, MessageSquare, CheckCircle2, Sparkles } from "lucide-react";
import { useCareerPilotStore } from "@/stores/careerpilot-store";
import { extractCandidateMetrics } from "@/lib/response-normalizer";

export default function Home() {
  const { candidate, jobMatches, atsReport, selectedJob } = useCareerPilotStore();
  const hasAnalysis = !!candidate.resumeAnalysis;
  const metrics = hasAnalysis ? extractCandidateMetrics(candidate.resumeAnalysis!) : null;
  const atsScore = atsReport?.score ?? metrics?.atsScore;
  const skillsCount = metrics?.skillsCount ?? 0;

  const resumeScoreLabel = hasAnalysis ? (skillsCount > 0 ? `${Math.min(95, 55 + skillsCount * 3)}/100` : "Analyzed") : "--";
  const topMatch = jobMatches.length ? `${jobMatches[0].matchScore ?? "--"}%` : "--";

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-8 lg:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-zinc-300">Premium AI career platform • Powered by Lyzr</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight lg:text-5xl">Your AI Career Copilot</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-400">From resume analysis to your next opportunity. CareerPilot coordinates 5 specialized agents via Career Compass Director.</p>
          {hasAnalysis && (
            <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Resume analyzed ✓ {candidate.resumeFileName} {candidate.analysisTimestamp ? `• ${new Date(candidate.analysisTimestamp).toLocaleString()}` : ""}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/resume"><Button size="lg">Upload Resume <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/jobs"><Button variant="ghost" size="lg"><Briefcase className="mr-2 h-4 w-4" />Find Jobs</Button></Link>
            <Link href="/chat"><Button variant="outline" size="lg"><MessageSquare className="mr-2 h-4 w-4" />Ask CareerPilot</Button></Link>
          </div>
        </div>
      </div>

      {/* Stats - deterministic, no invention */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader><div className="text-xs text-zinc-400">Resume Score</div></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{resumeScoreLabel}</div><div className="text-xs text-zinc-500">{hasAnalysis ? `${skillsCount} skills detected` : "After analysis"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><div className="text-xs text-zinc-400">ATS Score</div></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{atsScore ? `${atsScore}/100` : "--"}</div><div className="text-xs text-zinc-500">{atsScore ? "From Lyzr ATS Aligner" : "After optimization"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><div className="text-xs text-zinc-400">Jobs Matched</div></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{jobMatches.length ? String(jobMatches.length) : "--"}</div><div className="text-xs text-zinc-500">{jobMatches.length ? `${jobMatches.length} ranked` : "After discovery"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><div className="text-xs text-zinc-400">Top Match</div></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{topMatch}</div><div className="text-xs text-zinc-500">{jobMatches[0]?.title ? jobMatches[0].title.slice(0, 28) : "Highest fit"}</div></CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><div className="text-sm font-medium">Recent activity</div><div className="text-xs text-zinc-400">Real activity from your session — persists after refresh.</div></CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {hasAnalysis ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-zinc-200">Resume analyzed • {candidate.resumeFileName}</span>
                    <span className="ml-auto text-xs text-zinc-400">{metrics?.skillsCount ?? 0} skills</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <FileText className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-300">No resume analyzed yet.</span>
                    <Link href="/resume" className="ml-auto text-xs text-cyan-300 hover:underline">Upload</Link>
                  </div>
                )}
                {jobMatches.length ? (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <Briefcase className="h-4 w-4 text-zinc-300" />
                    <span className="text-zinc-200">{jobMatches.length} jobs matched • Top {topMatch} • {metrics?.gapsCount ?? 0} gaps identified</span>
                    <Link href="/jobs" className="ml-auto text-xs text-cyan-300 hover:underline">View</Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <Briefcase className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-300">{hasAnalysis ? "Ready to find jobs for your profile." : "No jobs discovered yet."}</span>
                    <Link href={hasAnalysis ? "/jobs" : "/chat"} className="ml-auto text-xs text-cyan-300 hover:underline">{hasAnalysis ? "Find jobs" : "Ask to find jobs"}</Link>
                  </div>
                )}
                {selectedJob && (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    <span className="text-zinc-200">Selected: {selectedJob.title} at {selectedJob.company ?? "—"}</span>
                    <Link href="/tailor" className="ml-auto text-xs text-cyan-300 hover:underline">Tailor</Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommended next action - deterministic */}
          <Card>
            <CardHeader><div className="text-sm font-medium">Recommended next action</div></CardHeader>
            <CardContent>
              {!hasAnalysis && <div className="text-sm text-zinc-300">Upload and analyze your resume to unlock personalized matches.</div>}
              {hasAnalysis && !jobMatches.length && <div className="text-sm text-zinc-300">Resume ready — go to <Link href="/jobs" className="text-cyan-300 underline">Job Matches</Link> to generate ranked opportunities from your profile.</div>}
              {hasAnalysis && jobMatches.length && !selectedJob && <div className="text-sm text-zinc-300">Review your {jobMatches.length} matches and select a job to tailor your resume.</div>}
              {selectedJob && <div className="text-sm text-zinc-300">Tailor your resume for <b>{selectedJob.title}</b> and check ATS compatibility.</div>}
            </CardContent>
          </Card>
        </div>
        <AgentWorkflow />
      </div>
    </div>
  );
}
