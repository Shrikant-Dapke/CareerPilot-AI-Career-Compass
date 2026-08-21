"use client";
import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { JobCard } from "@/components/jobs/JobCard";
import { normalizeLyzrResponse } from "@/lib/response-normalizer";
import { useCareerPilotStore } from "@/stores/careerpilot-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function JobsPage() {
  const { messages } = useCareerPilotStore();
  const jobs = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return [];
    return normalizeLyzrResponse(lastAssistant.content).jobs;
  }, [messages]);

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Job Matches</h1>
      <p className="mt-1 text-sm text-zinc-400">Jobs are returned by Career Compass Director. Only information from Lyzr is shown.</p>

      {jobs.length === 0 ? (
        <Card className="mt-6">
          <CardHeader><div className="text-sm font-medium">No jobs yet</div><div className="text-xs text-zinc-400">Go to AI Chat and ask to find jobs.</div></CardHeader>
          <CardContent><Link href="/chat"><Button>Open AI Chat</Button></Link></CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} onAnalyze={() => {}} onTailor={() => {}} onSave={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}
