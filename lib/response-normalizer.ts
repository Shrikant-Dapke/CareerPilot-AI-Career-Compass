/**
 * Lyzr -> NormalizedData
 * Isolated parser. UI never imports regex directly.
 * If Lyzr adds structured JSON later, prefer it over fallback parsing.
 */

export type NormalizedJob = {
  id: string;
  title: string;
  company?: string;
  location?: string;
  type?: string;
  matchScore?: number;
  matchingSkills?: string[];
  missingSkills?: string[];
  experience?: string;
  source?: string;
  url?: string;
  rawBlock: string;
};

export type ATSReport = {
  score?: number;
  keywordCoverage?: number;
  formatting?: string;
  sectionCompleteness?: string;
  parsability?: string;
  missingKeywords?: string[];
  suggestions?: string[];
};

export type NormalizedData = {
  message: string;
  jobs: NormalizedJob[];
  ats?: ATSReport;
  raw: string;
};

function extractJobs(raw: string): NormalizedJob[] {
  const jobs: NormalizedJob[] = [];
  const blocks = raw.split(/(?=^#{1,3}\s+.*(?:Developer|Engineer|Manager|Analyst|Designer|Scientist)|^\s*\d+\.\s+\*\*.*\*\*)/m);
  const useBlocks = blocks.length > 1 ? blocks : [raw];

  for (let i = 0; i < useBlocks.length; i++) {
    const block = useBlocks[i].trim();
    if (block.length < 80) continue;

    const isJobLike =
      /match\s*score/i.test(block) ||
      /matching\s*skills/i.test(block) ||
      /company/i.test(block) ||
      /location/i.test(block) ||
      /apply|view job/i.test(block);

    if (!isJobLike) continue;

    const titleMatch = block.match(/(?:^#{1,3}\s+)?(?:\d+\.\s+)?(?:\*\*)?([^*\n]{4,80}?)(?:\*\*)?(?:\s+at\s+([^\n|]+))?/);
    const companyMatch = block.match(/(?:Company|Employer)\s*[:\-]\s*([^\n]+)/i);
    const locationMatch = block.match(/Location\s*[:\-]\s*([^\n]+)/i);
    const matchScoreMatch = block.match(/Match\s*Score\s*[:\-]?\s*(\d{1,3})\s*%?/i);
    const typeMatch = block.match(/(?:Job Type|Type|Employment)\s*[:\-]\s*([^\n]+)/i);
    const sourceMatch = block.match(/Source\s*[:\-]\s*([^\n]+)/i);
    const urlMatch = block.match(/https?:\/\/[^\s)]+/);
    const matchingSkillsMatch = block.match(/Matching Skills\s*[:\-]\s*([^\n]+)/i);
    const missingSkillsMatch = block.match(/Missing Skills\s*[:\-]\s*([^\n]+)/i);

    const title = titleMatch?.[1]?.trim().replace(/^[\d.\-\s#*]+/, "").slice(0, 120);
    if (!title || title.length < 3) continue;

    jobs.push({
      id: `job-${i}-${title.toLowerCase().replace(/\W+/g, "-").slice(0, 40)}`,
      title,
      company: companyMatch?.[1]?.trim() || titleMatch?.[2]?.trim() || undefined,
      location: locationMatch?.[1]?.trim(),
      type: typeMatch?.[1]?.trim(),
      matchScore: matchScoreMatch ? Math.min(100, parseInt(matchScoreMatch[1], 10)) : undefined,
      matchingSkills: matchingSkillsMatch?.[1]?.split(/[,;|]/).map((s) => s.trim()).filter(Boolean),
      missingSkills: missingSkillsMatch?.[1]?.split(/[,;|]/).map((s) => s.trim()).filter(Boolean),
      source: sourceMatch?.[1]?.trim(),
      url: urlMatch?.[0],
      rawBlock: block.slice(0, 2000),
    });
    if (jobs.length >= 12) break;
  }
  return jobs;
}

function extractATS(raw: string): ATSReport | undefined {
  const hasATS = /ATS\s*Score|Keyword\s*Coverage|ATS\s*Compatibility/i.test(raw);
  if (!hasATS) return undefined;
  const scoreM = raw.match(/ATS\s*Score\s*[:\-]?\s*(\d{1,3})/i);
  const kwM = raw.match(/Keyword\s*Coverage\s*[:\-]?\s*(\d{1,3})\s*%?/i);
  const missingM = raw.match(/Missing Keywords\s*[:\-]\s*([^\n]+)/i);
  const suggestionsM = raw.match(/Suggestions?\s*[:\-]\s*([\s\S]{0,800})/i);
  return {
    score: scoreM ? parseInt(scoreM[1], 10) : undefined,
    keywordCoverage: kwM ? parseInt(kwM[1], 10) : undefined,
    missingKeywords: missingM?.[1]?.split(/[,;|]/).map((s) => s.trim()).filter(Boolean),
    suggestions: suggestionsM?.[1]
      ?.split(/\n/)
      .map((l) => l.replace(/^[-•\d.\s]+/, "").trim())
      .filter((l) => l.length > 8)
      .slice(0, 6),
  };
}

export function normalizeLyzrResponse(raw: string): NormalizedData {
  const trimmed = raw?.trim() ?? "";
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.message === "string") {
      const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : extractJobs(parsed.message);
      return { message: parsed.message, jobs, ats: parsed.ats ?? extractATS(parsed.message), raw: trimmed };
    }
  } catch {}
  return {
    message: trimmed,
    jobs: extractJobs(trimmed),
    ats: extractATS(trimmed),
    raw: trimmed,
  };
}
