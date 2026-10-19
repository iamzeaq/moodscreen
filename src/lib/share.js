/**
 * Getting a Moodscreen out of the browser — the parts the app (§7.10, Share)
 * and the public page (moodscreen.live/username) have in common.
 *
 * Both hand the OS share sheet the same thing: the image where the browser can
 * carry a file, and the live page's address either way. The page is the growth
 * path — it is what a story tap lands on and what now unfurls with its own
 * preview — so it is never the part that gets dropped.
 */

/** The site's own origin, with a trailing slash. */
export function siteRoot() {
  if (typeof window === "undefined") return "https://moodscreen.live/";
  const envSite = import.meta.env?.VITE_PUBLIC_SITE_URL;
  const base =
    typeof envSite === "string" && envSite.trim() ? envSite.trim() : window.location.origin;
  return base.replace(/\/?$/, "/");
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
 * awaits before calling `navigator.share`. The address rides in `text` as well
 * as `url` because several targets keep one and drop the other once a file is
 * attached, and the address is the one thing that must arrive.
 *
 * @param {{ file?: File | null, title: string, url: string }} payload
 */
export function shareMoodscreen({ file, title, url }) {
  if (!canShareLink()) {
    return Promise.reject(new Error("Web Share is not available"));
  }
  const text = url;
  const tries = [
    ...(file
      ? [
          { files: [file], title, text, url },
          { files: [file], title, text },
          { files: [file], title },
        ]
      : []),
    { title, text, url },
    { title, url },
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
