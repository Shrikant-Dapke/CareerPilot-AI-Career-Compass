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
