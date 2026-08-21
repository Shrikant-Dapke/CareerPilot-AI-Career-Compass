import { Check, Circle } from "lucide-react";

const steps = [
  { label: "Resume Analyzer", done: true },
  { label: "Job Finder", done: true },
  { label: "Talent Match Evaluator", done: true },
  { label: "Resume Precision Tailor", done: false },
  { label: "ATS Resume Aligner", done: false },
];

export function AgentWorkflow() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-sm font-medium">CareerPilot workflow</div>
      <div className="mt-1 text-xs text-zinc-400">Overall workflow coordinated by Career Compass Director. Not per-turn execution telemetry.</div>
      <div className="mt-4 space-y-2.5">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 text-sm">
            {s.done ? <Check className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-zinc-600" />}
            <span className={s.done ? "text-zinc-200" : "text-zinc-500"}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
