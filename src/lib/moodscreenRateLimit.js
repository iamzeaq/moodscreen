/**
 * Lightweight client-side save rate limit (localStorage).
 * Max 5 successful saves per rolling minute.
 *
 * It counts *server* writes and only server writes. The thing being spaced out
 * is the Supabase round-trip, so a guest's localStorage save neither waits on
 * this nor spends a slot in it — see the persist effect in MoodscreenContext.
 *
 * It is still a politeness guard rather than security, since anything in
 * localStorage belongs to the page: CLAUDE.md §11 wants this enforced
 * server-side as well.
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

/**
 * How long until another save is allowed. 0 when one is allowed now.
 *
 * This replaces the old `canAttemptSave`, which answered yes or no. A boolean
 * is the wrong shape for this guard: the caller's only options are to write or
 * to drop the write, and CLAUDE.md §11 is explicit that a delay is fine and a
 * drop never is. The cooldown had exactly this bug and was fixed by computing
 * the wait up front; the limiter is the same fix in the same place.
 *
 * The wait is until the oldest save inside the window ages out of it, which is
 * the moment a slot frees.
 */
export function saveRateLimitWaitMs() {
  const now = Date.now();
  const recent = readTimestamps()
    .filter((t) => now - t < WINDOW_MS)
    .sort((a, b) => a - b);
  if (recent.length < MAX_SAVES_PER_WINDOW) return 0;
  /* The save that has to expire before there is room: counting back
   * MAX_SAVES_PER_WINDOW from the newest, not simply the oldest, so a stored
   * list longer than the limit still yields the right moment. */
  const blocking = recent[recent.length - MAX_SAVES_PER_WINDOW];
  return Math.max(0, WINDOW_MS - (now - blocking));
}

/** Call only after a successful write to the server. */
export function recordSuccessfulSave() {
  const now = Date.now();
  const recent = readTimestamps().filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  writeTimestamps(recent);
}
