/**
 * Lightweight client-side save rate limit (localStorage).
 * Max 5 successful saves per rolling minute.
 */

const STORAGE_KEY = "moodscreen_save_timestamps";
const WINDOW_MS = 60_000;
export const MAX_SAVES_PER_WINDOW = 5;

function readTimestamps() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeTimestamps(ts) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ts));
  } catch {
    /* quota */
  }
}

export function canAttemptSave() {
  const now = Date.now();
  const recent = readTimestamps().filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_SAVES_PER_WINDOW) {
    return { ok: false, message: "slow down a bit" };
  }
  return { ok: true };
}

/** Call only after a successful persist */
export function recordSuccessfulSave() {
  const now = Date.now();
  const recent = readTimestamps().filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  writeTimestamps(recent);
}
