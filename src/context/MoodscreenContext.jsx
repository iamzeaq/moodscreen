import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import MoodscreenExportSurface, {
  EXPORT_NODE_ID,
} from "../components/MoodscreenExportSurface.jsx";
import {
  fetchMoodscreenForUser,
  readGuestMoodscreen,
  serializeMoodscreenState,
  upsertMoodscreenForUser,
  writeGuestMoodscreen,
} from "../services/moodscreenDataService.js";
import { normalizeStoredMoodscreen } from "../lib/moodscreenPayload.js";
import {
  canAttemptSave,
  recordSuccessfulSave,
} from "../lib/moodscreenRateLimit.js";
import { accentForMood, isMoodId } from "../lib/moods.js";
import { applyAccent } from "../lib/color.js";
import { clampStatement } from "../lib/statementFit.js";
import {
  captureMoodscreenBlob,
  ensureMoodscreenFontsReady,
  exportFilename,
} from "../lib/exportMoodscreen.js";
import { DEFAULT_THEME_ID, getTheme, isThemeId } from "../themes/index.js";
import { DEFAULT_SURFACE, isSurfaceId } from "../themes/surface.js";

/** How long after the last edit to re-render the export blob. */
const PRERENDER_DEBOUNCE_MS = 400;

/** How long after the last edit to write to storage. */
const PERSIST_DEBOUNCE_MS = 700;

/**
 * The shortest gap between two successful writes. A politeness guard against
 * a burst of keystrokes turning into a burst of round-trips — not security,
 * and not a reason to lose an edit: see the persist effect.
 */
const PERSIST_COOLDOWN_MS = 2000;

/** Touch / mobile browsers need longer before revoke or the save dialog never receives the blob. */
function downloadRevokeDelayMs() {
  if (typeof navigator === "undefined") return 2500;
  if (navigator.maxTouchPoints > 0) return 8000;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return 8000;
  return 2500;
}

/** Blob download — revoke URL after a delay so the browser can start the save (immediate revoke often cancels). */
function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  a.download = filename;
  a.rel = "noopener";
  a.style.position = "fixed";
  a.style.left = "-9999px";
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, downloadRevokeDelayMs());
}

/** Last resort: open image in a new tab so the user can save manually (common on iOS Safari). */
function openImageInNewTab(blob) {
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (w) {
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } else {
    URL.revokeObjectURL(url);
  }
}

function isLikelyIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function getInitials(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase();
}

/** Public URL for link field + OG; add https:// if missing */
function normalizeShareUrl(link) {
  if (typeof window === "undefined") {
    return "https://moodscreen.live/";
  }
  const envSite = typeof import.meta !== "undefined" ? import.meta.env?.VITE_PUBLIC_SITE_URL : "";
  const fallback =
    typeof envSite === "string" && envSite.trim()
      ? envSite.trim().replace(/\/?$/, "/")
      : `${window.location.origin}/`;
  const t = (link || "").trim();
  if (!t) return fallback.replace(/\/?$/, "/");
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

/**
 * Whether this browser can put a PNG into a share sheet at all.
 *
 * Desktop is the case that matters. Windows Chrome often has no
 * `navigator.share`, and where it does it frequently refuses `files` — so the
 * share path used to end at "Share failed: Web Share is not available", which
 * is a dead end dressed as an error. Checked up front so the caller can take
 * the download instead, which on a desktop is what sharing means anyway.
 */
function canShareFiles(file) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return true;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/** Web Share must run in the same synchronous turn as a tap. */
function invokeNavigatorShare({ file, text, url }) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return Promise.reject(new Error("Web Share is not available"));
  }
  const title = "moodscreen";
  const tries = [
    { files: [file], title, text, url },
    { files: [file], title, text },
    { files: [file], title },
    { text, url, title },
  ];
  let lastErr;
  for (const data of tries) {
    try {
      if (typeof navigator.canShare === "function" && !navigator.canShare(data)) {
        continue;
      }
      return navigator.share(data);
    } catch (e) {
      lastErr = e;
    }
  }
  return Promise.reject(lastErr ?? new Error("This browser cannot share this content"));
}

const DEFAULT_FORM = {
  name: "",
  location: "",
  link: "",
  themeId: DEFAULT_THEME_ID,
  /**
   * §7.2 — the user's two choices, and nothing between them.
   *
   * `thinking` because §3's accent default before any mood is chosen is its
   * violet, and the accent follows the mood. Starting anywhere else would mean
   * the site's first paint disagreed with its own token file.
   */
  mood: "thinking",
  surface: DEFAULT_SURFACE,
  /**
   * Empty, deliberately. §9.1 has the visitor type and the Moodscreen build in
   * real time, so a seeded statement would mean their first keystroke deletes
   * someone else's sentence. The hero hands the preview a placeholder instead,
   * which is not the same thing: it is never saved and never exported.
   */
  statement: "",
  avatarUrl: null,
};

/**
 * What the card reads before anyone has typed a statement.
 *
 * It lives here rather than in the hero, and that is the whole point. When the
 * hero owned it, the preview showed this sentence while the off-screen export
 * node showed an empty card — the two disagreed, so exporting handed someone a
 * different image from the one on screen. The fix for that was a disabled
 * button, which turned "click download" into a silent no-op for anyone who had
 * not written anything yet.
 *
 * Putting it in the props both surfaces read makes them agree by construction,
 * which is §7's rule, and the export control can then simply always work.
 *
 * Still never persisted: `statement` in state stays empty until the visitor
 * writes one, so their first keystroke starts a sentence rather than deleting
 * someone else's.
 */
export const PLACEHOLDER_STATEMENT = "shipping the thing I promised";

const MoodscreenContext = createContext(null);

export function MoodscreenProvider({ children }) {
  const { user, sessionReady, authVersion, profile } = useAuth();

  const [name, setName] = useState(DEFAULT_FORM.name);
  const [location, setLocation] = useState(DEFAULT_FORM.location);
  const [mood, setMood] = useState(DEFAULT_FORM.mood);
  const [statement, setStatement] = useState(DEFAULT_FORM.statement);
  const [link, setLink] = useState(DEFAULT_FORM.link);
  const [themeId, setThemeId] = useState(DEFAULT_FORM.themeId);
  const [surface, setSurface] = useState(DEFAULT_FORM.surface);

  /**
   * The hour the Moodscreen is *of* — §7.4's input, and the timestamp §7.5
   * prints. Loaded from storage rather than read off the clock, so reopening a
   * 3am card at noon still shows a 3am card; restamped only when the statement
   * itself changes, because that is when it becomes a different moment.
   */
  const [postedAt, setPostedAt] = useState(() => new Date().toISOString());
  const keepStampRef = useRef(true);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_FORM.avatarUrl);

  /**
   * The handle being typed into the claim field, before it is claimed.
   *
   * It lives in the context rather than inside <ClaimField> because the card
   * has to show it. §9.1's argument for putting the claim after the editor is
   * that the work is already done by the time it is asked for — and a field
   * that writes `moodscreen.live/yourname` on the Moodscreen as you type is
   * what makes that true rather than merely stated.
   *
   * Not persisted here: nothing has been claimed yet. `rememberClaim` stashes
   * it on submit so it survives the sign-in redirect.
   */
  const [draftUsername, setDraftUsername] = useState("");

  const [hydrated, setHydrated] = useState(false);
  const hydrateGen = useRef(0);
  const prevUserIdRef = useRef(undefined);
  const persistMetaRef = useRef({ created_at: null });
  const lastSuccessfulSaveAtRef = useRef(0);
  const formValueRef = useRef(null);
  const [storageNotice, setStorageNotice] = useState(null);
  const storageNoticeTimerRef = useRef(null);

  const applyFromObject = useCallback((obj) => {
    if (!obj || typeof obj !== "object") return;
    const n = normalizeStoredMoodscreen(obj);
    setName(n.name !== undefined ? n.name : DEFAULT_FORM.name);
    setLocation(n.location !== undefined ? n.location : DEFAULT_FORM.location);
    setLink(n.link !== undefined ? n.link : DEFAULT_FORM.link);
    setThemeId(isThemeId(n.themeId) ? n.themeId : DEFAULT_FORM.themeId);
    setSurface(isSurfaceId(n.surface) ? n.surface : DEFAULT_FORM.surface);
    setAvatarUrl(n.avatarUrl ?? null);
    setMood(isMoodId(n.mood) ? n.mood : DEFAULT_FORM.mood);
    setStatement(clampStatement(n.statement ?? ""));
    if (n.created_at) persistMetaRef.current.created_at = n.created_at;

    /* Hydration is not a new moment, so the stamp that arrives with the data
     * survives the state change that follows it. */
    keepStampRef.current = true;
    setPostedAt(n.updated_at || n.created_at || new Date().toISOString());
  }, []);

  /** Load guest / remote when auth or storage epoch changes */
  useEffect(() => {
    if (!sessionReady) return;

    const gen = ++hydrateGen.current;
    let cancelled = false;

    (async () => {
      if (user?.id) {
        const { data } = await fetchMoodscreenForUser(user.id);
        if (cancelled || hydrateGen.current !== gen) return;
        if (data && typeof data === "object") {
          applyFromObject(data);
        } else {
          const guest = readGuestMoodscreen();
          if (guest && typeof guest === "object") {
            applyFromObject(guest);
          } else {
            applyFromObject({});
          }
        }
      } else {
        const guest = readGuestMoodscreen();
        if (cancelled || hydrateGen.current !== gen) return;
        if (guest && typeof guest === "object") {
          applyFromObject(guest);
        } else {
          applyFromObject({});
        }
      }
      if (!cancelled && hydrateGen.current === gen) setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionReady, user?.id, authVersion, applyFromObject]);

  /**
   * A changed statement is a new moment; everything else on the form is not.
   *
   * The mood deliberately does not restamp either. Changing violet to red is
   * changing how the same thought is coloured, and §7.4's tint belongs to the
   * hour the thought was had — restamping on a mood tap would mean scrubbing
   * the strip at midnight quietly relit a card written that afternoon.
   */
  useEffect(() => {
    if (!hydrated) return;
    if (keepStampRef.current) {
      keepStampRef.current = false;
      return;
    }
    setPostedAt(new Date().toISOString());
  }, [statement, hydrated]);

  const formValue = useMemo(
    () => ({
      name,
      location,
      mood,
      statement,
      link,
      themeId,
      surface,
      avatarUrl,
      /* Carried on the form so a save that did not change the statement writes
       * the stamp back rather than replacing it with now. */
      updated_at: postedAt,
    }),
    [name, location, mood, statement, link, themeId, surface, avatarUrl, postedAt],
  );

  formValueRef.current = formValue;

  const handleFormChange = useCallback((patch) => {
    if (!patch) return;
    if (Object.prototype.hasOwnProperty.call(patch, "name")) setName(patch.name);
    if (Object.prototype.hasOwnProperty.call(patch, "location"))
      setLocation(patch.location);
    if (Object.prototype.hasOwnProperty.call(patch, "mood") && isMoodId(patch.mood))
      setMood(patch.mood);
    if (Object.prototype.hasOwnProperty.call(patch, "statement"))
      setStatement(clampStatement(patch.statement));
    if (Object.prototype.hasOwnProperty.call(patch, "link")) setLink(patch.link);
    if (Object.prototype.hasOwnProperty.call(patch, "themeId") && isThemeId(patch.themeId))
      setThemeId(patch.themeId);
    if (Object.prototype.hasOwnProperty.call(patch, "surface") && isSurfaceId(patch.surface))
      setSurface(patch.surface);
    if (Object.prototype.hasOwnProperty.call(patch, "avatarUrl"))
      setAvatarUrl(patch.avatarUrl);
  }, []);

  /**
   * Debounced persist — guest: localStorage, signed-in: Supabase (+ rate
   * limit, cooldown, fallback).
   *
   * The cooldown **delays** the write; it must never drop it. It used to
   * return early when the last successful save was under two seconds ago, and
   * because this effect only runs again when the form changes, that made the
   * *final* edit of any burst unrecoverable — nothing was left to trigger a
   * retry. It showed up as an avatar that would not stick, since choosing a
   * picture tends to be the last thing done and lands a second or so after the
   * statement that triggered the previous save. It applied to every field.
   *
   * So the wait is computed up front instead: the debounce, or whatever is
   * left of the cooldown, whichever is longer.
   */
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const sinceSave = Date.now() - lastSuccessfulSaveAtRef.current;
    const wait = Math.max(PERSIST_DEBOUNCE_MS, PERSIST_COOLDOWN_MS - sinceSave);
    const t = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        const fv = formValueRef.current;
        if (!fv) return;
        const rl = canAttemptSave();
        if (!rl.ok) {
          setStorageNotice(rl.message);
          return;
        }
        const meta = { createdAt: persistMetaRef.current.created_at };
        const snapshot = serializeMoodscreenState(fv, meta);
        persistMetaRef.current.created_at = snapshot.created_at;
        const saveMeta = {
          createdAt: persistMetaRef.current.created_at,
          updatedAt: fv.updated_at,
        };
        try {
          if (user?.id) {
            const { error } = await upsertMoodscreenForUser(user.id, fv, saveMeta);
            if (error) throw error;
          } else {
            writeGuestMoodscreen(fv, saveMeta);
          }
          recordSuccessfulSave();
          lastSuccessfulSaveAtRef.current = Date.now();
          setStorageNotice(null);
        } catch (e) {
          console.warn("moodscreen persist failed:", e);
          try {
            writeGuestMoodscreen(fv, saveMeta);
            setStorageNotice("Saved locally — sync failed");
          } catch {
            setStorageNotice("Could not save — try again");
          }
        }
      })();
    }, wait);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [formValue, user?.id, hydrated]);

  useEffect(() => {
    if (!storageNotice) return undefined;
    window.clearTimeout(storageNoticeTimerRef.current);
    storageNoticeTimerRef.current = window.setTimeout(() => setStorageNotice(null), 5000);
    return () => window.clearTimeout(storageNoticeTimerRef.current);
  }, [storageNotice]);

  /** On sign-out, keep the current Moodscreen in guest storage immediately */
  useEffect(() => {
    const was = prevUserIdRef.current;
    if (was && !user?.id && hydrated) {
      writeGuestMoodscreen(formValue, {
        createdAt: persistMetaRef.current.created_at,
        updatedAt: formValue.updated_at,
      });
    }
    prevUserIdRef.current = user?.id;
  }, [user?.id, hydrated, formValue]);

  const initials = useMemo(() => getInitials(name), [name]);

  const username = useMemo(
    () =>
      typeof profile?.username === "string" && profile.username.trim()
        ? profile.username.trim().toLowerCase()
        : "",
    [profile?.username],
  );

  /**
   * Everything <Moodscreen> needs, and nothing else.
   *
   * Every surface reads this — the hero preview, the studio preview and the
   * two off-screen export nodes — so the placeholder and the draft handle are
   * applied here and nowhere else. A caller that substituted its own would put
   * the preview and the exported PNG out of step, which is exactly what §7's
   * one-component rule exists to make impossible.
   */
  const moodscreenProps = useMemo(
    () => ({
      mood,
      statement: statement || PLACEHOLDER_STATEMENT,
      name: (name || "").trim(),
      /* A claimed handle wins; until there is one, the card wears whatever is
       * being typed into the claim field. Neither is faked: with both empty
       * the lockup reads `moodscreen.live`, which is true. */
      username: username || draftUsername,
      avatarUrl: avatarUrl ?? "",
      themeId,
      surface,
      /**
       * §7.4 — the night tint is derived from the timestamp already being
       * stored, not from a toggle and not from the clock. A card written at
       * 3am keeps looking like 3am when it is opened at noon, which is the
       * whole point of the card being *of a moment*.
       */
      at: postedAt,
    }),
    [mood, statement, name, username, draftUsername, avatarUrl, themeId, surface, postedAt],
  );

  /**
   * §3 — the accent is the mood currently in focus, not a fixed brand colour.
   *
   * It lives here rather than in the hero because every surface that shows a
   * Moodscreen shows it: the logo fill, the primary button, focus rings and
   * the caret all follow whatever is being edited, and a hero-local effect
   * would leave /create wearing the default violet while its card was orange.
   */
  useEffect(() => {
    if (typeof document === "undefined") return;
    applyAccent(document.documentElement, accentForMood(mood));
  }, [mood]);

  /* ------------------------------------------------------ export + share */

  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [shareReady, setShareReady] = useState(false);

  /** { key, blob, file, filename } for the current Moodscreen, or null. */
  const preparedRef = useRef(null);

  const exportKey = useMemo(() => JSON.stringify(moodscreenProps), [moodscreenProps]);
  const exportKeyRef = useRef(exportKey);
  exportKeyRef.current = exportKey;

  /**
   * Pre-render the blob whenever the Moodscreen changes.
   *
   * This is what fixes the two-tap share: Web Share has to be called in the
   * same synchronous turn as the tap, and awaiting a capture spends the
   * gesture. Doing the work ahead of time means the tap has a File already.
   */
  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return undefined;

    let cancelled = false;
    setShareReady(false);
    preparedRef.current = null;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const node = document.getElementById(EXPORT_NODE_ID);
          if (!node || cancelled) return;

          const theme = getTheme(themeId);
          await ensureMoodscreenFontsReady(theme);
          if (cancelled) return;

          const blob = await captureMoodscreenBlob(node, { theme });
          if (cancelled) return;

          const filename = exportFilename(moodscreenProps.username, name);
          preparedRef.current = {
            key: exportKey,
            blob,
            filename,
            file: new File([blob], filename, { type: "image/png" }),
          };
          setShareReady(true);
        } catch (e) {
          /* Not user-facing: the on-demand path below will retry and report. */
          console.warn("moodscreen pre-render failed:", e);
        }
      })();
    }, PRERENDER_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [exportKey, hydrated, themeId, moodscreenProps.username, name]);

  /** The blob for right now — the pre-rendered one if it is still current. */
  const currentPrepared = useCallback(() => {
    const prep = preparedRef.current;
    return prep && prep.key === exportKeyRef.current ? prep : null;
  }, []);

  const captureNow = useCallback(async () => {
    const node = document.getElementById(EXPORT_NODE_ID);
    if (!node) throw new Error("The Moodscreen is not ready yet.");
    const theme = getTheme(formValueRef.current?.themeId);
    await ensureMoodscreenFontsReady(theme);
    const blob = await captureMoodscreenBlob(node, { theme });
    /* The handle the card is wearing, not only a claimed one — a guest who has
     * typed a name into the claim field gets `moodscreen-isaac.png` rather than
     * a file named after nobody. */
    const filename = exportFilename(moodscreenProps.username, formValueRef.current?.name);
    return { blob, filename };
  }, [moodscreenProps.username]);

  const downloadPng = useCallback(async () => {
    if (isExporting) return;
    setDownloadError(null);

    /* Best case: nothing to await, so even iOS gets a real user gesture. */
    const prep = currentPrepared();
    if (prep) {
      if (isLikelyIOS()) openImageInNewTab(prep.blob);
      else triggerBrowserDownload(prep.blob, prep.filename);
      return;
    }

    setIsExporting(true);
    let iosBlankTab = null;
    if (isLikelyIOS()) {
      try {
        iosBlankTab = window.open("about:blank", "_blank", "noopener,noreferrer");
      } catch {
        iosBlankTab = null;
      }
    }
    try {
      const { blob, filename } = await captureNow();
      if (isLikelyIOS()) {
        const url = URL.createObjectURL(blob);
        if (iosBlankTab && !iosBlankTab.closed) {
          iosBlankTab.location.href = url;
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } else {
          openImageInNewTab(blob);
        }
        return;
      }
      if (iosBlankTab && !iosBlankTab.closed) iosBlankTab.close();
      triggerBrowserDownload(blob, filename);
    } catch (e) {
      console.warn("moodscreen PNG export failed:", e);
      if (iosBlankTab && !iosBlankTab.closed) {
        try {
          iosBlankTab.close();
        } catch {
          /* ignore */
        }
      }
      const msg = e && typeof e.message === "string" ? e.message : String(e);
      setDownloadError(
        msg.includes("timed out")
          ? "That took too long. Try again."
          : `Export failed: ${msg.length < 160 ? msg : "Unknown error"}`,
      );
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, currentPrepared, captureNow]);

  /**
   * One tap. If the pre-rendered file is current — which it is within half a
   * second of the last edit — navigator.share runs synchronously off the tap
   * and the sheet opens immediately.
   *
   * Where there is no share sheet to open, this saves the file instead of
   * reporting that there is no share sheet. §1 makes getting the image out the
   * product; a desktop browser without Web Share is not an error condition,
   * it is a desktop browser, and "Share failed: Web Share is not available" is
   * a dead end with an apology attached.
   */
  const sharePng = useCallback(() => {
    setDownloadError(null);
    const pageUrl = normalizeShareUrl(formValueRef.current?.link);
    const text = `moodscreen — ${pageUrl}`;

    const prep = currentPrepared();
    if (prep) {
      if (!canShareFiles(prep.file)) {
        void downloadPng();
        return;
      }
      void invokeNavigatorShare({ file: prep.file, text, url: pageUrl }).catch((e) => {
        if (e && e.name === "AbortError") return;
        console.warn("moodscreen share:", e);
        const msg = e && typeof e.message === "string" ? e.message : String(e);
        setDownloadError(`Share failed: ${msg.length < 160 ? msg : "Unknown error"}`);
      });
      return;
    }

    /* The pre-render has not landed yet — capture, then open the sheet. Some
     * browsers will refuse this one for want of a gesture; the next tap has
     * the file and always works. */
    if (isExporting) return;
    setIsExporting(true);
    void (async () => {
      try {
        const { blob, filename } = await captureNow();
        const file = new File([blob], filename, { type: "image/png" });
        preparedRef.current = { key: exportKeyRef.current, blob, file, filename };
        setShareReady(true);
        if (!canShareFiles(file)) {
          if (isLikelyIOS()) openImageInNewTab(blob);
          else triggerBrowserDownload(blob, filename);
          return;
        }
        await invokeNavigatorShare({ file, text, url: pageUrl });
      } catch (e) {
        if (e && e.name === "AbortError") return;
        console.warn("moodscreen share prepare failed:", e);
        const msg = e && typeof e.message === "string" ? e.message : String(e);
        setDownloadError(
          msg.includes("gesture") || msg.includes("user activation")
            ? "Almost ready — tap it once more."
            : `Could not export: ${msg.length < 160 ? msg : "Unknown error"}`,
        );
      } finally {
        setIsExporting(false);
      }
    })();
  }, [isExporting, currentPrepared, captureNow, downloadPng]);

  const copyLink = useCallback(async () => {
    setCopied(false);
    const toCopy = (link || "").trim();
    if (!toCopy) return;
    try {
      await navigator.clipboard.writeText(toCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard may be blocked
    }
  }, [link]);

  const value = useMemo(
    () => ({
      formValue,
      handleFormChange,
      downloadPng,
      sharePng,
      copyLink,
      isExporting,
      copied,
      downloadError,
      shareReady,
      moodscreenProps,
      initials,
      storageHydrated: hydrated,
      storageNotice,
      draftUsername,
      setDraftUsername,
    }),
    [
      formValue,
      handleFormChange,
      downloadPng,
      sharePng,
      copyLink,
      isExporting,
      copied,
      downloadError,
      shareReady,
      moodscreenProps,
      initials,
      hydrated,
      storageNotice,
      draftUsername,
    ],
  );

  return (
    <MoodscreenContext.Provider value={value}>
      {children}
      {/* The node every capture photographs. Always mounted, never seen. */}
      <MoodscreenExportSurface {...moodscreenProps} />
    </MoodscreenContext.Provider>
  );
}

export function useMoodscreen() {
  const ctx = useContext(MoodscreenContext);
  if (!ctx) {
    throw new Error("useMoodscreen must be used within MoodscreenProvider");
  }
  return ctx;
}
