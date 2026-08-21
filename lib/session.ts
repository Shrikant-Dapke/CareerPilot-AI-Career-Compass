import { v4 as uuidv4 } from "uuid";

export const SESSION_COOKIE = "cp_session";
export const USER_COOKIE = "cp_user";
export const LS_SESSION = "careerpilot_session_id";
export const LS_USER = "careerpilot_user_id";

// Server helper: derive from cookies or generate
export function getOrCreateIdsFromCookies(cookies: Map<string, string>): { session_id: string; user_id: string } {
  const session_id = cookies.get(SESSION_COOKIE) || uuidv4();
  const user_id = cookies.get(USER_COOKIE) || uuidv4();
  return { session_id, user_id };
}

// Client helper: localStorage + cookie fallback
export function getOrCreateSessionClient(): { session_id: string; user_id: string } {
  if (typeof window === "undefined") return { session_id: uuidv4(), user_id: uuidv4() };
  let session_id = localStorage.getItem(LS_SESSION);
  let user_id = localStorage.getItem(LS_USER);
  let mutated = false;
  if (!session_id) {
    session_id = uuidv4();
    localStorage.setItem(LS_SESSION, session_id);
    mutated = true;
  }
  if (!user_id) {
    user_id = uuidv4();
    localStorage.setItem(LS_USER, user_id);
    mutated = true;
  }
  if (mutated) {
    // Also set non-HttpOnly cookie so server can read fallback
    document.cookie = `${SESSION_COOKIE}=${session_id}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `${USER_COOKIE}=${user_id}; path=/; max-age=31536000; SameSite=Lax`;
  }
  return { session_id, user_id };
}

export function newSessionClient(): { session_id: string; user_id: string } {
  const session_id = uuidv4();
  // keep user_id stable across sessions
  let user_id = typeof window !== "undefined" ? localStorage.getItem(LS_USER) : null;
  if (!user_id) user_id = uuidv4();
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_SESSION, session_id);
    localStorage.setItem(LS_USER, user_id);
    document.cookie = `${SESSION_COOKIE}=${session_id}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `${USER_COOKIE}=${user_id}; path=/; max-age=31536000; SameSite=Lax`;
  }
  return { session_id, user_id };
}
