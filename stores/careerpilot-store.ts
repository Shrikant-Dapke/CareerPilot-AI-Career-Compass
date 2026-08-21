"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, TrackedJob } from "@/types";

type State = {
  sessionId: string | null;
  userId: string | null;
  messages: ChatMessage[];
  tracker: TrackedJob[];
  setSession: (s: { sessionId: string; userId: string }) => void;
  addMessage: (m: ChatMessage) => void;
  setMessages: (m: ChatMessage[]) => void;
  clearChat: () => void;
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
      setSession: ({ sessionId, userId }) => set({ sessionId, userId }),
      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      setMessages: (messages) => set({ messages }),
      clearChat: () => set({ messages: [] }),
      upsertTracked: (job) => set((s) => {
        const exists = s.tracker.find((t) => t.id === job.id);
        if (exists) return { tracker: s.tracker.map((t) => (t.id === job.id ? { ...t, ...job } : t)) };
        return { tracker: [job, ...s.tracker] };
      }),
      removeTracked: (id) => set((s) => ({ tracker: s.tracker.filter((t) => t.id !== id) })),
      updateTrackedStatus: (id, status) => set((s) => ({ tracker: s.tracker.map((t) => (t.id === id ? { ...t, status } : t)) })),
    }),
    { name: "careerpilot-store", partialize: (s) => ({ tracker: s.tracker }) }
  )
);
