/**
 * Getting a Moodscreen out of the browser — the parts the app (§7.10, Share)
 * and the public page (moodscreen.live/username) have in common.
 *
 * Both hand the OS share sheet the same thing: the rendered Moodscreen as a
 * full image where the browser can carry a file, and the live page's address
 * with it. The page is the growth
 * path — it is what a story tap lands on and what now unfurls with its own
 * preview — so it is never the part that gets dropped.
 */

/**
 * The one address every shared link uses: the apex, never www.
 *
 * Fixed rather than read from `window.location`. The site is reachable on
 * www, on preview deployments and on localhost, and whichever of those the
 * sharer happened to be on used to leak into the link — www.moodscreen.live/x
 * is the same page under a second name, and a second name splits every
 * platform's preview cache in two.
 */
export const CANONICAL_ORIGIN = "https://moodscreen.live";

/** The site's own origin, with a trailing slash. */
export function siteRoot() {
  return `${CANONICAL_ORIGIN}/`;
}

/** moodscreen.live/username, or the site root when there is no handle yet. */
export function publicPageUrl(username) {
  const handle = String(username || "").trim().toLowerCase();
  return handle ? `${siteRoot()}${encodeURIComponent(handle)}` : siteRoot();
}

/**
 * Whether this browser can put a PNG into a share sheet at all.
 *
 * Desktop is the case that matters. Windows Chrome often has no
 * `navigator.share`, and where it does it frequently refuses `files` — so the
 * share path used to end at "Share failed: Web Share is not available", which
 * is a dead end dressed as an error. Checked up front so the caller can take
 * its own fallback instead.
 */
export function canShareFiles(file) {
  if (!file || typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (typeof navigator.canShare !== "function") return true;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/** Whether there is a share sheet at all, file or not. */
export function canShareLink() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/**
 * Open the share sheet with the richest payload this browser accepts.
 *
 * Web Share must run in the same synchronous turn as a tap, so this never
 * awaits before calling `navigator.share`.
 *
 * Image first: the file is the thing that lands in a story or a chat, and the
 * address rides along with it. **The address goes in exactly one field.** It
 * used to go in both `text` and `url`, and WhatsApp and iMessage paste both,
 * so every share arrived with the link twice. With a file it travels as
 * `text` — once a file is attached, Android drops `url` but keeps `text` as
 * the caption — and without one it is `url` alone.
 *
 * @param {{ file?: File | null, title: string, url: string }} payload
 */
export function shareMoodscreen({ file, title, url }) {
  if (!canShareLink()) {
    return Promise.reject(new Error("Web Share is not available"));
  }
  const tries = [
    ...(file
      ? [
          { files: [file], title, text: url },
          { files: [file], text: url },
          { files: [file] },
        ]
      : []),
    { title, url },
    { url },
  ];
  let lastErr;
  for (const data of tries) {
    try {
      if (typeof navigator.canShare === "function" && !navigator.canShare(data)) continue;
      return navigator.share(data);
    } catch (e) {
      lastErr = e;
    }
  }
  return Promise.reject(lastErr ?? new Error("This browser cannot share this content"));
}
