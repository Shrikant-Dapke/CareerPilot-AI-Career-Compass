"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { JobCard } from "@/components/jobs/JobCard";
import { normalizeLyzrResponse } from "@/lib/response-normalizer";
import { useSession } from "@/hooks/useSession";
import { useCareerPilotStore } from "@/stores/careerpilot-store";
import { Send, Sparkles, Loader2 } from "lucide-react";

const prompts = [
  "Analyze my resume",
  "Find Full Stack Developer jobs for me",
  "What jobs am I most qualified for?",
  "What are my biggest skill gaps?",
  "Which job should I apply to?",
  "Tailor my resume for this job",
  "Improve my ATS score",
];

function buildContextualMessage(
  userText: string,
  candidate: { resumeText: string | null; resumeFileName: string | null; resumeAnalysis: string | null },
  selectedJob: { title: string; company?: string } | null
): string {
  const lower = userText.toLowerCase();
  const needsResume = /resume|skill|gap|qualified|match|suit|tailor|ats/i.test(lower) || lower.includes("my");
  const needsJob = /tailor|ats|job|first job|this job|selected/i.test(lower);
  let ctx = "";
  if (needsResume && candidate.resumeText) {
    ctx += `[CANDIDATE CONTEXT — already analyzed resume: ${candidate.resumeFileName ?? "resume"}]\n${candidate.resumeText.slice(0, 3000)}\n\n`;
    if (candidate.resumeAnalysis) ctx += `[PRIOR ANALYSIS SUMMARY]\n${candidate.resumeAnalysis.slice(0, 2000)}\n\n`;
  }
  if (needsJob && selectedJob) {
    ctx += `[SELECTED JOB CONTEXT]\nTitle: ${selectedJob.title}\nCompany: ${selectedJob.company ?? "—"}\n\n`;
  }
  if (!ctx) return userText;
  return `${ctx}USER QUESTION: ${userText}\n\nPlease answer using the candidate context above. Do not ask for the resume again.`;
}

export default function ChatPage() {
  const { sessionId, userId } = useSession();
  const { messages, addMessage, candidate, selectedJob, setJobMatches, setAtsReport, setTailoredResume } = useCareerPilotStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || !sessionId || !userId) return;
    setError(null);
    // display original user text, send contextualized to Lyzr
    const displayText = text;
    const lyzrMessage = buildContextualMessage(text, candidate, selectedJob);
    // eslint-disable-next-line react-hooks/purity
    const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: displayText, createdAt: Date.now() };
    addMessage(userMsg);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lyzrMessage, session_id: sessionId, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");
      const responseText = data.response as string;
      // Sync Lyzr results into central store (requirement 4/8) — never invent, only persist what Lyzr returned
      const norm = normalizeLyzrResponse(responseText);
      if (norm.jobs.length) setJobMatches(norm.jobs);
      if (norm.ats) setAtsReport(norm.ats);
      // Heuristic: if user asked to tailor and response looks like a resume, store as tailored
      const isTailorIntent = /tailor/i.test(text);
      const looksLikeResume = /tailored resume|optimized resume|revised resume/i.test(responseText) && responseText.length > 800;
      if (isTailorIntent && looksLikeResume) setTailoredResume(responseText);
      // eslint-disable-next-line react-hooks/purity
      addMessage({ id: crypto.randomUUID(), role: "assistant", content: responseText, createdAt: Date.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-0px)] max-w-5xl flex-col lg:h-screen">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black"><Sparkles className="h-4 w-4" /></div>
          <div><div className="text-sm font-semibold">Career Compass Director</div><div className="text-xs text-zinc-400">Your central manager across 5 agents {candidate.resumeAnalysis ? `• Active: ${candidate.resumeFileName}` : ""}</div></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-sm font-medium">Ask CareerPilot anything</div>
            {candidate.resumeAnalysis && <div className="mt-1 text-xs text-emerald-300">✓ Using your analyzed resume ({candidate.resumeFileName}) — no need to re-upload.</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              {prompts.map((p) => (
                <button key={p} onClick={() => send(p)} className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs text-zinc-200 hover:bg-white/[0.10]">{p}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const normalized = m.role === "assistant" ? normalizeLyzrResponse(m.content) : null;
          return (
            <div key={m.id} className={m.role === "user" ? "ml-auto max-w-[80%] rounded-2xl bg-white px-4 py-3 text-sm text-black" : "max-w-[92%] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"}>
              {m.role === "user" ? (
                m.content
              ) : (
                <>
                  <MarkdownRenderer content={m.content} />
                  {normalized?.jobs.length ? (
                    <div className="mt-4 grid gap-3">
                      {normalized.jobs.slice(0, 6).map((j) => (
                        <JobCard key={j.id} job={j} onAnalyze={() => send(`Why is "${j.title}" at ${j.company ?? "this company"} my best match?`)} onTailor={() => send(`Tailor my resume for ${j.title} at ${j.company ?? ""}`.trim())} onSave={() => {}} />
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-300"><Loader2 className="h-3.5 w-3.5 animate-spin" /> CareerPilot is thinking…</div>
            <div className="text-xs text-zinc-500">Waiting for Career Compass Director (up to 90s) — session stays active.</div>
          </div>
        )}
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error} <button onClick={() => setError(null)} className="ml-2 text-xs underline">Dismiss</button></div>}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={candidate.resumeAnalysis ? "Ask using your analyzed resume… (e.g., Find jobs that suit my resume)" : "Ask CareerPilot… (e.g., Find 5 Full Stack jobs for me)"}
            className="flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
          <Button onClick={() => send(input)} disabled={loading || !input.trim()} className="h-[46px] rounded-full"><Send className="h-4 w-4" /></Button>
        </div>
        <div className="mt-2 text-center text-[11px] text-zinc-500">CareerPilot does not invent skills or jobs. Responses come from Lyzr Career Compass Director.</div>
      </div>
    </div>
  );
}
