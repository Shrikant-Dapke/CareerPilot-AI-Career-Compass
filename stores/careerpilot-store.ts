"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, TrackedJob, NormalizedJob, ATSReport } from "@/types";

type CandidateProfile = {
  resumeFileName: string | null;
  resumeText: string | null;
  resumeAnalysis: string | null;
  analysisTimestamp: number | null;
};

type State = {
  sessionId: string | null;
  userId: string | null;
  messages: ChatMessage[];
  tracker: TrackedJob[];

  // Central source of truth (requirement 2)
  candidate: CandidateProfile;
  jobMatches: NormalizedJob[];
  selectedJob: NormalizedJob | null;
  tailoredResume: string | null;
  atsReport: ATSReport | null;

  setSession: (s: { sessionId: string; userId: string }) => void;
  addMessage: (m: ChatMessage) => void;
  setMessages: (m: ChatMessage[]) => void;
  clearChat: () => void;

  setCandidateAnalysis: (p: { fileName: string; resumeText: string; analysis: string }) => void;
  clearCandidate: () => void;

  setJobMatches: (jobs: NormalizedJob[]) => void;
  setSelectedJob: (job: NormalizedJob | null) => void;

  setTailoredResume: (text: string | null) => void;
  setAtsReport: (r: ATSReport | null) => void;

  upsertTracked: (job: TrackedJob) => void;
  removeTracked: (id: string) => void;
  updateTrackedStatus: (id: string, status: TrackedJob["status"]) => void;
};

export const useCareerPilotStore = create<State>()(
  persist(
    (set) => ({
      sessionId: null,
      userId: null,
      messages: [],
      tracker: [],

      candidate: {
        resumeFileName: null,
        resumeText: null,
        resumeAnalysis: null,
        analysisTimestamp: null,
      },
      jobMatches: [],
      selectedJob: null,
      tailoredResume: null,
      atsReport: null,

      setSession: ({ sessionId, userId }) => set({ sessionId, userId }),
      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      setMessages: (messages) => set({ messages }),
      clearChat: () => set({ messages: [] }),

      setCandidateAnalysis: ({ fileName, resumeText, analysis }) =>
        set({
          candidate: {
            resumeFileName: fileName,
            resumeText,
            resumeAnalysis: analysis,
            analysisTimestamp: Date.now(),
          },
          // Invalidate downstream (requirement 5): new resume -> stale jobs/tailored/ATS
          jobMatches: [],
          selectedJob: null,
          tailoredResume: null,
          atsReport: null,
        }),
      clearCandidate: () =>
        set({
          candidate: { resumeFileName: null, resumeText: null, resumeAnalysis: null, analysisTimestamp: null },
          jobMatches: [],
          selectedJob: null,
          tailoredResume: null,
          atsReport: null,
        }),

      setJobMatches: (jobs) => set({ jobMatches: jobs }),
      setSelectedJob: (job) => set({ selectedJob: job }),
      setTailoredResume: (text) => set({ tailoredResume: text }),
      setAtsReport: (r) => set({ atsReport: r }),

      upsertTracked: (job) =>
        set((s) => {
          const exists = s.tracker.find((t) => t.id === job.id);
          if (exists) return { tracker: s.tracker.map((t) => (t.id === job.id ? { ...t, ...job } : t)) };
          return { tracker: [job, ...s.tracker] };
        }),
      removeTracked: (id) => set((s) => ({ tracker: s.tracker.filter((t) => t.id !== id) })),
      updateTrackedStatus: (id, status) => set((s) => ({ tracker: s.tracker.map((t) => (t.id === id ? { ...t, status } : t)) })),
    }),
    {
      name: "careerpilot-store",
      version: 2,
      migrate: (persisted, version) => {
        // migrate v1 (tracker only) to v2
        const p = persisted as Partial<State>;
        if (!p.candidate) {
          (p as State).candidate = { resumeFileName: null, resumeText: null, resumeAnalysis: null, analysisTimestamp: null };
          (p as State).jobMatches = [];
          (p as State).selectedJob = null;
          (p as State).tailoredResume = null;
          (p as State).atsReport = null;
        }
        if (!p.messages) (p as State).messages = [];
        if (!p.sessionId) (p as State).sessionId = null;
        if (!p.userId) (p as State).userId = null;
        void version;
        return persisted as State;
      },
      // Persist everything except transient loading flags — never persist keys
      partialize: (s) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        messages: s.messages,
        tracker: s.tracker,
        candidate: s.candidate,
        jobMatches: s.jobMatches,
        selectedJob: s.selectedJob,
        tailoredResume: s.tailoredResume,
        atsReport: s.atsReport,
      }),
    }
  )
);
