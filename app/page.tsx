import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AgentWorkflow } from "@/components/dashboard/AgentWorkflow";
import { ArrowRight, FileText, Briefcase, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-8 lg:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-zinc-300">Premium AI career platform • Powered by Lyzr</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight lg:text-5xl">Your AI Career Copilot</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-400">From resume analysis to your next opportunity. CareerPilot coordinates 5 specialized agents via Career Compass Director.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/resume"><Button size="lg">Upload Resume <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/jobs"><Button variant="ghost" size="lg"><Briefcase className="mr-2 h-4 w-4" />Find Jobs</Button></Link>
            <Link href="/chat"><Button variant="outline" size="lg"><MessageSquare className="mr-2 h-4 w-4" />Ask CareerPilot</Button></Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Resume Score", value: "--", hint: "After analysis" },
          { label: "ATS Score", value: "--", hint: "After optimization" },
          { label: "Jobs Matched", value: "--", hint: "After discovery" },
          { label: "Top Match", value: "--", hint: "Highest fit" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader><div className="text-xs text-zinc-400">{s.label}</div></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{s.value}</div><div className="text-xs text-zinc-500">{s.hint}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><div className="text-sm font-medium">Recent activity</div><div className="text-xs text-zinc-400">Real activity appears after you upload, chat, and match.</div></CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-300">No resume analyzed yet.</span>
                  <Link href="/resume" className="ml-auto text-xs text-cyan-300 hover:underline">Upload</Link>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <Briefcase className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-300">No jobs discovered yet.</span>
                  <Link href="/chat" className="ml-auto text-xs text-cyan-300 hover:underline">Ask to find jobs</Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <AgentWorkflow />
      </div>
    </div>
  );
}
