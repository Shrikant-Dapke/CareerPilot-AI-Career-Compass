"use client";
import { use } from "react";
import { useCareerPilotStore } from "@/stores/careerpilot-store";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { jobMatches, selectedJob, setSelectedJob } = useCareerPilotStore();
  const job = jobMatches.find((j) => j.id === id) || (selectedJob?.id === id ? selectedJob : null);

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <Card><CardHeader><div className="text-sm font-medium">Job not found</div><div className="text-xs text-zinc-400">Return to Job Matches — matches are tied to your current resume.</div></CardHeader><CardContent><Link href="/jobs"><Button>Back to Job Matches</Button></Link></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">{job.title}</h1>
      {job.company && <div className="text-sm text-zinc-400">{job.company} {job.location ? `• ${job.location}` : ""} {job.type ? `• ${job.type}` : ""}</div>}
      {typeof job.matchScore === "number" && <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">{job.matchScore}% match</div>}
      {(job.matchingSkills?.length || job.missingSkills?.length) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.matchingSkills?.map((s) => <span key={s} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">{s}</span>)}
          {job.missingSkills?.map((s) => <span key={s} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">Missing: {s}</span>)}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Button onClick={() => setSelectedJob(job)}>Select for Tailoring</Button>
        {job.url && <a href={job.url} target="_blank" rel="noreferrer"><Button variant="outline">View Job</Button></a>}
        <Link href="/jobs"><Button variant="ghost">Back</Button></Link>
      </div>
      <Card className="mt-6"><CardContent className="pt-6"><MarkdownRenderer content={job.rawBlock} /></CardContent></Card>
    </div>
  );
}
