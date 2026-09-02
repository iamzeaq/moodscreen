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
import {
  DEFAULT_MOOD_ENTRIES,
  normalizeMoodEntries,
} from "../lib/moodCategories.js";
import { normalizeStoredMoodscreen } from "../lib/moodscreenPayload.js";
import {
  canAttemptSave,
  recordSuccessfulSave,
} from "../lib/moodscreenRateLimit.js";
import { sanitizeMoodEntries } from "../lib/moodscreenValidation.js";
import { deriveMoodId, deriveStatement } from "../lib/moodscreenModel.js";
import {
  captureMoodscreenBlob,
  ensureMoodscreenFontsReady,
  exportFilename,
} from "../lib/exportMoodscreen.js";
import { DEFAULT_THEME_ID, getTheme, isThemeId } from "../themes/index.js";
import { DEFAULT_SURFACE, isSurfaceId } from "../themes/surface.js";

/** How long after the last edit to re-render the export blob. */
const PRERENDER_DEBOUNCE_MS = 400;

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
  name: "Isaac Twekyard",
  location: "Lagos",
  link: "",
  themeId: DEFAULT_THEME_ID,
  /** §7.2 — the user's second choice, alongside the mood. */
  surface: DEFAULT_SURFACE,
  avatarUrl: null,
};

const MoodscreenContext = createContext(null);

export function MoodscreenProvider({ children }) {
  const { user, sessionReady, authVersion, profile } = useAuth();

  const [name, setName] = useState(DEFAULT_FORM.name);
  const [location, setLocation] = useState(DEFAULT_FORM.location);
  const [moodEntries, setMoodEntries] = useState(DEFAULT_MOOD_ENTRIES);
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
    setMoodEntries(normalizeMoodEntries(n.moodEntries));
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

  /* A changed statement is a new moment; everything else on the form is not. */
  useEffect(() => {
    if (!hydrated) return;
    if (keepStampRef.current) {
      keepStampRef.current = false;
      return;
    }
    setPostedAt(new Date().toISOString());
  }, [moodEntries, hydrated]);

  const formValue = useMemo(
    () => ({
      name,
      location,
      moodEntries,
      link,
      themeId,
      surface,
      avatarUrl,
    }),
    [name, location, moodEntries, link, themeId, surface, avatarUrl],
  );

  formValueRef.current = formValue;

  const handleFormChange = useCallback((patch) => {
    if (!patch) return;
    if (Object.prototype.hasOwnProperty.call(patch, "name")) setName(patch.name);
    if (Object.prototype.hasOwnProperty.call(patch, "location"))
      setLocation(patch.location);
    if (Object.prototype.hasOwnProperty.call(patch, "moodEntries") && Array.isArray(patch.moodEntries))
      setMoodEntries(sanitizeMoodEntries(patch.moodEntries));
    if (Object.prototype.hasOwnProperty.call(patch, "link")) setLink(patch.link);
    if (Object.prototype.hasOwnProperty.call(patch, "themeId") && isThemeId(patch.themeId))
      setThemeId(patch.themeId);
    if (Object.prototype.hasOwnProperty.call(patch, "surface") && isSurfaceId(patch.surface))
      setSurface(patch.surface);
    if (Object.prototype.hasOwnProperty.call(patch, "avatarUrl"))
      setAvatarUrl(patch.avatarUrl);
  }, []);

  /** Debounced persist — guest: localStorage, signed-in: Supabase (+ rate limit, cooldown, fallback) */
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        const fv = formValueRef.current;
        if (!fv) return;
        if (Date.now() - lastSuccessfulSaveAtRef.current < 2000) return;
        const rl = canAttemptSave();
        if (!rl.ok) {
          setStorageNotice(rl.message);
          return;
        }
        const meta = { createdAt: persistMetaRef.current.created_at };
        const snapshot = serializeMoodscreenState(fv, meta);
        persistMetaRef.current.created_at = snapshot.created_at;
        const saveMeta = { createdAt: persistMetaRef.current.created_at };
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
    }, 700);
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
   * Everything <Moodscreen> needs, and nothing else. Mood and statement are
   * derived from the editor's rows rather than stored — see
   * src/lib/moodscreenModel.js.
   */
  const moodscreenProps = useMemo(
    () => ({
      mood: deriveMoodId(moodEntries),
      statement: deriveStatement(moodEntries),
      name: (name || "").trim(),
      username,
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
    [moodEntries, name, username, avatarUrl, themeId, surface, postedAt],
  );

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

          await ensureMoodscreenFontsReady(getTheme(themeId));
          if (cancelled) return;

          const blob = await captureMoodscreenBlob(node);
          if (cancelled) return;

          const filename = exportFilename(username, name);
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
  }, [exportKey, hydrated, themeId, username, name]);

  /** The blob for right now — the pre-rendered one if it is still current. */
  const currentPrepared = useCallback(() => {
    const prep = preparedRef.current;
    return prep && prep.key === exportKeyRef.current ? prep : null;
  }, []);

  const captureNow = useCallback(async () => {
    const node = document.getElementById(EXPORT_NODE_ID);
    if (!node) throw new Error("The Moodscreen is not ready yet.");
    await ensureMoodscreenFontsReady(getTheme(formValueRef.current?.themeId));
    const blob = await captureMoodscreenBlob(node);
    const filename = exportFilename(username, formValueRef.current?.name);
    return { blob, filename };
  }, [username]);

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
   */
  const sharePng = useCallback(() => {
    setDownloadError(null);
    const pageUrl = normalizeShareUrl(formValueRef.current?.link);
    const text = `moodscreen — ${pageUrl}`;

    const prep = currentPrepared();
    if (prep) {
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
        await invokeNavigatorShare({ file, text, url: pageUrl });
      } catch (e) {
        if (e && e.name === "AbortError") return;
        console.warn("moodscreen share prepare failed:", e);
        const msg = e && typeof e.message === "string" ? e.message : String(e);
        setDownloadError(
          msg.includes("gesture") || msg.includes("user activation")
            ? "Almost ready — tap Share once more."
            : `Share failed: ${msg.length < 160 ? msg : "Unknown error"}`,
        );
      } finally {
        setIsExporting(false);
      }
    })();
  }, [isExporting, currentPrepared, captureNow]);

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
