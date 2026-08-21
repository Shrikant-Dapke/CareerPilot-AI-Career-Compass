import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NormalizedJob } from "@/types";
import { ExternalLink, MapPin, Building2 } from "lucide-react";

export function JobCard({ job, onAnalyze, onTailor, onSave }: { job: NormalizedJob; onAnalyze?: () => void; onTailor?: () => void; onSave?: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">{job.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            {job.company && <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {job.company}</span>}
            {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>}
            {job.type && <Badge>{job.type}</Badge>}
          </div>
        </div>
        {typeof job.matchScore === "number" && (
          <div className="shrink-0 rounded-full bg-white text-black px-3 py-1 text-xs font-semibold">{job.matchScore}% match</div>
        )}
      </div>

      {(job.matchingSkills?.length || job.missingSkills?.length) ? (
        <div className="mt-4 space-y-2">
          {job.matchingSkills?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {job.matchingSkills.map((s) => <Badge key={s} className="bg-emerald-500/10 border-emerald-500/20 text-emerald-200">{s}</Badge>)}
            </div>
          ) : null}
          {job.missingSkills?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {job.missingSkills.map((s) => <Badge key={s} className="bg-amber-500/10 border-amber-500/20 text-amber-200">Missing: {s}</Badge>)}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {job.url && <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white text-black px-3.5 py-1.5 text-xs font-medium">View Job <ExternalLink className="h-3 w-3" /></a>}
        {onAnalyze && <Button variant="ghost" size="sm" onClick={onAnalyze}>Analyze Match</Button>}
        {onTailor && <Button variant="outline" size="sm" onClick={onTailor}>Tailor Resume</Button>}
        {onSave && <Button variant="ghost" size="sm" onClick={onSave}>Save</Button>}
      </div>
    </div>
  );
}
