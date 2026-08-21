export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type TrackedJob = {
  id: string;
  title: string;
  company?: string;
  location?: string;
  matchScore?: number;
  url?: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  savedAt: number;
};

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

export type CandidateProfile = {
  resumeFileName: string | null;
  resumeText: string | null;
  resumeAnalysis: string | null;
  analysisTimestamp: number | null;
  // derived / convenience (populated from normalizer or direct counts)
  skills: string[];
  atsScore?: number;
};
