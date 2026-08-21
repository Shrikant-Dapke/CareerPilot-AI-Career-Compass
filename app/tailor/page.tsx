import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TailorPage() {
  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Resume Tailor</h1>
      <p className="mt-1 text-sm text-zinc-400">Tailoring is performed by Lyzr Resume Precision Tailor. No facts are invented.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><div className="text-sm font-medium">Original Resume</div><div className="text-xs text-zinc-400">Upload at /resume first.</div></CardHeader><CardContent><div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">Original content appears after analysis.</div></CardContent></Card>
        <Card><CardHeader><div className="text-sm font-medium">Tailored Resume</div><div className="text-xs text-zinc-400">Ask in Chat: “Tailor my resume for [job]”.</div></CardHeader><CardContent><div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">Tailored content appears after Lyzr returns it.</div></CardContent></Card>
      </div>
      <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">Safety rule: tailored resume never invents skills, employers, titles, dates, projects, certs, or education. Only rephrasing/reordering of existing facts.</div>
    </div>
  );
}
