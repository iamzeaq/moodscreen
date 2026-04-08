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
import {
  fetchMoodscreenForUser,
  readGuestMoodscreen,
  serializeMoodscreenState,
  upsertMoodscreenForUser,
  writeGuestMoodscreen,
} from "../services/moodscreenDataService.js";
import {
  DEFAULT_MOOD_ENTRIES,
  moodRowsFromEntries,
  normalizeMoodEntries,
} from "../lib/moodCategories.js";
import { normalizeStoredMoodscreen } from "../lib/moodscreenPayload.js";
import {
  canAttemptSave,
  recordSuccessfulSave,
} from "../lib/moodscreenRateLimit.js";
import { sanitizeMoodEntries } from "../lib/moodscreenValidation.js";
import { captureMoodscreenCardToPngBlob } from "../lib/captureMoodscreenCard.js";

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

function shareFormSnapshot(fv) {
  if (!fv || typeof fv !== "object") return "";
  return JSON.stringify({
    link: fv.link,
    name: fv.name,
    location: fv.location,
    moodEntries: fv.moodEntries,
    cardDarkMode: fv.cardDarkMode,
    avatarUrl: fv.avatarUrl,
  });
}

/** Web Share must run in the same synchronous turn as a tap — call only from second Share click */
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
  cardDarkMode: true,
  avatarUrl: null,
};

const MoodscreenContext = createContext(null);

export function MoodscreenProvider({ children }) {
  const { user, sessionReady, authVersion } = useAuth();

  const [name, setName] = useState(DEFAULT_FORM.name);
  const [location, setLocation] = useState(DEFAULT_FORM.location);
  const [moodEntries, setMoodEntries] = useState(DEFAULT_MOOD_ENTRIES);
  const [link, setLink] = useState(DEFAULT_FORM.link);
  const [cardDarkMode, setCardDarkMode] = useState(DEFAULT_FORM.cardDarkMode);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_FORM.avatarUrl);

  const [hydrated, setHydrated] = useState(false);
  const hydrateGen = useRef(0);
  const prevUserIdRef = useRef(undefined);
  const persistMetaRef = useRef({ created_at: null });
  const lastSuccessfulSaveAtRef = useRef(0);
  const formValueRef = useRef(null);
  const sharePreparedRef = useRef(null);
  const shareSnapshotRef = useRef("");
  const [storageNotice, setStorageNotice] = useState(null);
  const storageNoticeTimerRef = useRef(null);
  const [sharePrimed, setSharePrimed] = useState(false);
  const [shareHint, setShareHint] = useState(null);

  const applyFromObject = useCallback((obj) => {
    if (!obj || typeof obj !== "object") return;
    const n = normalizeStoredMoodscreen(obj);
    setName(n.name !== undefined ? n.name : DEFAULT_FORM.name);
    setLocation(n.location !== undefined ? n.location : DEFAULT_FORM.location);
    setLink(n.link !== undefined ? n.link : DEFAULT_FORM.link);
    setCardDarkMode(n.cardDarkMode !== false);
    setAvatarUrl(n.avatarUrl ?? null);
    setMoodEntries(normalizeMoodEntries(n.moodEntries));
    if (n.created_at) persistMetaRef.current.created_at = n.created_at;
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

  const formValue = useMemo(
    () => ({
      name,
      location,
      moodEntries,
      link,
      cardDarkMode,
      avatarUrl,
    }),
    [name, location, moodEntries, link, cardDarkMode, avatarUrl],
  );

  formValueRef.current = formValue;

  useEffect(() => {
    sharePreparedRef.current = null;
    shareSnapshotRef.current = "";
    setSharePrimed(false);
    setShareHint(null);
  }, [formValue]);

  const handleFormChange = useCallback((patch) => {
    if (!patch) return;
    if (Object.prototype.hasOwnProperty.call(patch, "name")) setName(patch.name);
    if (Object.prototype.hasOwnProperty.call(patch, "location"))
      setLocation(patch.location);
    if (Object.prototype.hasOwnProperty.call(patch, "moodEntries") && Array.isArray(patch.moodEntries))
      setMoodEntries(sanitizeMoodEntries(patch.moodEntries));
    if (Object.prototype.hasOwnProperty.call(patch, "link")) setLink(patch.link);
    if (Object.prototype.hasOwnProperty.call(patch, "cardDarkMode"))
      setCardDarkMode(!!patch.cardDarkMode);
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

  /** On sign-out, keep the current card in guest storage immediately */
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

  const moodRows = useMemo(() => moodRowsFromEntries(moodEntries), [moodEntries]);

  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const downloadPng = useCallback(async () => {
    if (isExporting) return;
    if (typeof document === "undefined" || !document.getElementById("moodscreen-card")) {
      setDownloadError("Card preview is not ready — open the studio and try again.");
      return;
    }
    setIsExporting(true);
    setDownloadError(null);
    /* iOS Safari blocks window.open after await unless we open a tab synchronously with the click. */
    let iosBlankTab = null;
    if (isLikelyIOS()) {
      try {
        iosBlankTab = window.open("about:blank", "_blank", "noopener,noreferrer");
      } catch {
        iosBlankTab = null;
      }
    }
    try {
      if (typeof document !== "undefined" && document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          /* ignore */
        }
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const blob = await captureMoodscreenCardToPngBlob();

      if (!blob || blob.size === 0) {
        setDownloadError("Could not capture the card (empty image).");
        return;
      }

      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `moodscreen-${ts}.png`;

      if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
        navigator.msSaveOrOpenBlob(blob, filename);
        if (iosBlankTab && !iosBlankTab.closed) iosBlankTab.close();
        return;
      }

      /* iOS Safari often ignores <a download>; show the image in the tab we opened on click. */
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
      const short =
        msg.length > 0 && msg.length < 200
          ? msg
          : "Unknown error during export.";
      setDownloadError(
        short.includes("timed out")
          ? "Export took too long. Try again, or clear the profile photo and retry."
          : `Export failed: ${short}`,
      );
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  /**
   * Two-step share: (1) capture PNG async — user gesture consumed by await.
   * (2) Second tap calls navigator.share synchronously — satisfies “user gesture” on all browsers.
   * Payload includes image + text + link (Open Graph previews apply when others share your URL, not the PNG).
   */
  const sharePng = useCallback(() => {
    if (isExporting) return;
    if (typeof document === "undefined" || !document.getElementById("moodscreen-card")) {
      setDownloadError("Card preview is not ready — open the studio and try again.");
      return;
    }

    const fv = formValueRef.current;
    const snapshot = shareFormSnapshot(fv);
    const pageUrl = normalizeShareUrl(fv?.link);

    if (sharePreparedRef.current && shareSnapshotRef.current === snapshot) {
      setDownloadError(null);
      setShareHint(null);
      const prep = sharePreparedRef.current;
      void invokeNavigatorShare(prep)
        .catch((e) => {
          if (e && e.name === "AbortError") return;
          console.warn("moodscreen share:", e);
          const msg = e && typeof e.message === "string" ? e.message : String(e);
          setDownloadError(
            msg.includes("gesture") || msg.includes("user activation")
              ? "Tap Share again after the image is ready."
              : `Share failed: ${msg.length < 160 ? msg : "Unknown error"}`,
          );
        })
        .finally(() => {
          sharePreparedRef.current = null;
          shareSnapshotRef.current = "";
          setSharePrimed(false);
        });
      return;
    }

    setIsExporting(true);
    setDownloadError(null);
    setShareHint(null);
    void (async () => {
      try {
        if (typeof document !== "undefined" && document.fonts?.ready) {
          try {
            await document.fonts.ready;
          } catch {
            /* ignore */
          }
        }
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const blob = await captureMoodscreenCardToPngBlob();
        if (!blob || blob.size === 0) {
          setDownloadError("Could not capture the card (empty image).");
          return;
        }

        const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const filename = `moodscreen-${ts}.png`;
        const file = new File([blob], filename, { type: "image/png" });
        const text = `moodscreen — ${pageUrl}`;

        sharePreparedRef.current = { file, text, url: pageUrl };
        shareSnapshotRef.current = snapshot;
        setSharePrimed(true);
        setShareHint(
          "Image ready — tap Share again to open Instagram, Messages, WhatsApp, etc.",
        );
      } catch (e) {
        console.warn("moodscreen PNG share prepare failed:", e);
        const msg = e && typeof e.message === "string" ? e.message : String(e);
        setDownloadError(
          msg.includes("timed out")
            ? "Export took too long. Try again, or clear the profile photo and retry."
            : `Could not prepare share: ${msg.length < 160 ? msg : "Unknown error"}`,
        );
        sharePreparedRef.current = null;
        shareSnapshotRef.current = "";
        setSharePrimed(false);
      } finally {
        setIsExporting(false);
      }
    })();
  }, [isExporting]);

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

  const cardProps = useMemo(
    () => ({
      name: (name || "Name").trim() || "Name",
      initials: initials || null,
      avatar: avatarUrl,
      location: (location || "").trim(),
      moodRows,
      footerText: "",
      activeWithin48h: true,
      darkMode: cardDarkMode !== false,
    }),
    [name, initials, avatarUrl, location, moodRows, cardDarkMode],
  );

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
      shareHint,
      sharePrimed,
      cardProps,
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
      shareHint,
      sharePrimed,
      cardProps,
      hydrated,
      storageNotice,
    ],
  );

  return (
    <MoodscreenContext.Provider value={value}>{children}</MoodscreenContext.Provider>
  );
}

export function useMoodscreen() {
  const ctx = useContext(MoodscreenContext);
  if (!ctx) {
    throw new Error("useMoodscreen must be used within MoodscreenProvider");
  }
  return ctx;
}
