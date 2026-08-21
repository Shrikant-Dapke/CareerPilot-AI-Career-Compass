import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ATSPage() {
  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">ATS Optimizer</h1>
      <p className="mt-1 text-sm text-zinc-400">Analysis by Lyzr ATS Resume Aligner.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          { label: "ATS Score", value: "--" },
          { label: "Keyword Coverage", value: "--" },
          { label: "Formatting", value: "--" },
          { label: "Section Completeness", value: "--" },
        ].map((s) => (
          <Card key={s.label}><CardHeader><div className="text-xs text-zinc-400">{s.label}</div></CardHeader><CardContent><div className="text-2xl font-semibold">{s.value}</div></CardContent></Card>
        ))}
      </div>
      <Card className="mt-6"><CardHeader><div className="text-sm font-medium">Missing Keywords & Suggestions</div></CardHeader><CardContent><div className="text-sm text-zinc-400">Run an ATS check via AI Chat: “Improve my ATS score”.</div><Button className="mt-4">Generate Optimized Resume</Button></CardContent></Card>
    </div>
  );
}
