"use client";
import { useEffect } from "react";
import { getOrCreateSessionClient, newSessionClient } from "@/lib/session";
import { useCareerPilotStore } from "@/stores/careerpilot-store";

export function useSession() {
  const { sessionId, userId, setSession, clearChat } = useCareerPilotStore();

  useEffect(() => {
    if (!sessionId || !userId) {
      const raw = getOrCreateSessionClient();
      const ids = { sessionId: raw.session_id, userId: raw.user_id };
      setSession(ids);
      // ensure server cookie exists
      fetch("/api/session", { method: "POST", body: JSON.stringify(raw), headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  }, [sessionId, userId, setSession]);

  const newSession = () => {
    const raw = newSessionClient();
    const ids = { sessionId: raw.session_id, userId: raw.user_id };
    setSession(ids);
    clearChat();
    fetch("/api/session", { method: "POST", body: JSON.stringify(raw), headers: { "Content-Type": "application/json" } }).catch(() => {});
    return ids;
  };

  return { sessionId, userId, newSession };
}
