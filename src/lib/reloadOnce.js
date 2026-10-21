/**
 * Recovering from a page file that failed to download.
 *
 * Every route is a lazily loaded chunk, so a dropped request on a flaky phone
 * connection — or a tab opened on the previous deploy, whose hashed chunks no
 * longer exist — leaves the app with nothing to render. A reload fetches the
 * current index.html and its current chunks, which is almost always the fix.
 *
 * Once, though. If the reload fails the same way, reloading again is a loop
 * the user cannot get out of, so a second failure inside the window is left
 * to the error boundary's own fallback instead.
 */
const KEY = "moodscreen:chunk-reload-at";
const WINDOW_MS = 10_000;

/** Whether this error is a chunk that failed to load, by every browser's wording. */
export function isChunkLoadError(error) {
  const msg = String(error?.message ?? error ?? "");
  return (
    error?.name === "ChunkLoadError" ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /Unable to preload CSS/i.test(msg)
  );
}

/**
 * Reload, unless this tab already reloaded for the same reason a moment ago.
 * Returns whether it reloaded.
 */
export function reloadOnce() {
  try {
    const last = Number(window.sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < WINDOW_MS) return false;
    window.sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* No sessionStorage (private mode, blocked): without the guard a reload
     * could loop, so leave it to the fallback. */
    return false;
  }
  window.location.reload();
  return true;
}
