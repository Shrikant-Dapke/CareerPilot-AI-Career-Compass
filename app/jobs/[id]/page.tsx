"use client";
import { use } from "react";
import { normalizeLyzrResponse } from "@/lib/response-normalizer";
import { useCareerPilotStore } from "@/stores/careerpilot-store";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { messages } = useCareerPilotStore();
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const normalized = lastAssistant ? normalizeLyzrResponse(lastAssistant.content) : null;
  const job = normalized?.jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <Card><CardHeader><div className="text-sm font-medium">Job not found</div><div className="text-xs text-zinc-400">Return to Jobs and run a search via AI Chat.</div></CardHeader></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">{job.title}</h1>
      {job.company && <div className="text-sm text-zinc-400">{job.company} {job.location ? `• ${job.location}` : ""}</div>}
      {typeof job.matchScore === "number" && <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">{job.matchScore}% match</div>}
      <Card className="mt-6"><CardContent className="pt-6"><MarkdownRenderer content={job.rawBlock} /></CardContent></Card>
    </div>
  );
}
