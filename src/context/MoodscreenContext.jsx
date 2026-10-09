import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { useAuth } from "./AuthContext.jsx";
import MoodscreenExportSurface, {
  EXPORT_NODE_ID,
  EXPORT_NODE_IDS,
} from "../components/MoodscreenExportSurface.jsx";
import {
  clearPendingUpload,
  fetchMoodscreenForUser,
  hasPendingUpload,
  markPendingUpload,
  pendingUploadOwner,
  readGuestMoodscreen,
  serializeMoodscreenState,
  uploadOgImage,
  upsertMoodscreenForUser,
  writeGuestMoodscreen,
} from "../services/moodscreenDataService.js";
import { normalizeStoredMoodscreen } from "../lib/moodscreenPayload.js";
import {
  recordSuccessfulSave,
  saveRateLimitWaitMs,
} from "../lib/moodscreenRateLimit.js";
import { accentForMood, isMoodId } from "../lib/moods.js";
import { applyAccent } from "../lib/color.js";
import { clampStatement } from "../lib/statementFit.js";
import {
  captureMoodscreenBlob,
  captureOgJpeg,
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

/**
 * How long a pending write has to be outstanding before it says so.
 *
 * Every burst of typing schedules one, so announcing them all would put
 * "Saving" under the buttons on every keystroke — noise, and the kind that
 * teaches people to stop reading the line. Past a second or so the silence is
 * the thing that needs explaining instead, which is exactly the case the rate
 * limiter's delay produces.
 */
const SAVING_VISIBLE_AFTER_MS = 1200;

/** How long "Saved" stays up. Long enough to catch, short enough to forget. */
const SAVED_VISIBLE_MS = 2400;

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

/** `hydratedFor` when the form holds this browser's guest Moodscreen. */
const GUEST_KEY = "guest";

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

  /**
   * Whose Moodscreen the form currently holds: a user id, or GUEST_KEY.
   *
   * A boolean was not enough. It stayed true across a sign-in, so in the render
   * where the user changed, the persist effect saw a new user and a "hydrated"
   * form — and wrote the guest's form to the account's row 700ms later, while
   * the account's own Moodscreen was still being fetched. Keying hydration to
   * the identity makes it false in that same render, and it only comes back
   * once the account's data has been loaded into the form.
   */
  const [hydratedFor, setHydratedFor] = useState(null);
  const currentKey = user?.id ?? GUEST_KEY;
  const hydrated = hydratedFor === currentKey;
  const hydrateGen = useRef(0);
  const prevUserIdRef = useRef(undefined);
  const persistMetaRef = useRef({ created_at: null });
  const lastSuccessfulSaveAtRef = useRef(0);
  /** True from the moment an edit is scheduled until it reaches storage. */
  const pendingWriteRef = useRef(false);
  /** Set further down, beside the export twins it photographs. */
  const refreshOgImageRef = useRef(null);
  const formValueRef = useRef(null);
  const [storageNotice, setStorageNotice] = useState(null);
  const storageNoticeTimerRef = useRef(null);

  /**
   * 'idle' | 'saving' | 'saved' — the quiet half of telling someone their edit
   * stuck. `storageNotice` is the loud half and only ever speaks on failure,
   * which left a successful save completely silent: nothing on screen ever said
   * a change had persisted, and the only signal was the absence of an error.
   */
  const [saveState, setSaveState] = useState("idle");

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

    /* Hydration is not a new moment: the stamp that arrives with the data is
     * the one the card keeps. Nothing has to defend that any more — the restamp
     * lives in handleFormChange, which hydration does not go through. */
    setPostedAt(n.updated_at || n.created_at || new Date().toISOString());
  }, []);

  /** Load guest / remote when auth or storage epoch changes */
  useEffect(() => {
    if (!sessionReady) return;

    const gen = ++hydrateGen.current;
    let cancelled = false;

    (async () => {
      if (user?.id) {
        /**
         * An edit that the last session never got to the server outranks the
         * row, and it is the only thing that does.
         *
         * Not decided by comparing timestamps: `updated_at` is the hour the
         * Moodscreen is *of* (§7.4) and does not move when the mood, the theme
         * or the photo changes, so a newer local record is routinely stamped the
         * same as the older remote one. The unload flush says outright that it
         * left one behind, and that claim is what is read here.
         *
         * The marker is cleared once the state is applied, because from that
         * point the persist effect owns it — hydrating is itself a form change,
         * so the rescued edit is on its way up within the debounce.
         */
        const wasPending = hasPendingUpload(user.id);
        const rescued = wasPending ? readGuestMoodscreen() : null;
        const { data, error } = await fetchMoodscreenForUser(user.id);
        if (cancelled || hydrateGen.current !== gen) return;
        /* Cleared on the strength of having looked, not of having found
         * something — a marker whose record has since been cleared out of
         * storage would otherwise sit there being checked forever. */
        if (wasPending) clearPendingUpload();
        if (rescued && typeof rescued === "object") {
          /* The rescued edit is this account's newest state whether or not the
           * row could be read, so a failed fetch does not stand in its way. */
          applyFromObject(rescued);
        } else if (error) {
          /* Unknown is not empty. Falling back to the guest copy here and then
           * saving it would replace a Moodscreen we simply failed to read, so
           * the form stays unhydrated for this account and nothing is written
           * until a later load succeeds. */
          console.warn("moodscreen load failed:", error);
          setStorageNotice("Couldn't load your Moodscreen. Reload to try again.");
          return;
        } else if (data && typeof data === "object") {
          applyFromObject(data);
        } else {
          /* An account with no Moodscreen takes the guest copy — unless that
           * copy is another account's unsent edit, which is theirs to keep. */
          const owner = pendingUploadOwner();
          const guest = owner && owner !== String(user.id) ? null : readGuestMoodscreen();
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
      if (!cancelled && hydrateGen.current === gen) setHydratedFor(user?.id ?? GUEST_KEY);
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionReady, user?.id, authVersion, applyFromObject]);

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
    if (Object.prototype.hasOwnProperty.call(patch, "statement")) {
      const next = clampStatement(patch.statement);
      /**
       * A changed statement is a new moment; everything else on the form is
       * not. The mood deliberately does not restamp either — changing violet to
       * red is changing how the same thought is coloured, and §7.4's tint
       * belongs to the hour the thought was had, so scrubbing the strip at
       * midnight must not quietly relight a card written that afternoon.
       *
       * The stamp is taken *here*, in the same event as the edit, and that is a
       * performance decision as much as a modelling one. It used to be an
       * effect keyed on `statement`, which meant every keystroke rendered the
       * whole tree twice: once for the letter, then again for the stamp the
       * effect set afterwards. Everything downstream paid for both — the card,
       * both export twins, the persist effect and the pre-render debounce all
       * ran two passes per character. Batched into one update they run once.
       */
      if (next !== formValueRef.current?.statement) {
        setStatement(next);
        setPostedAt(new Date().toISOString());
      }
    }
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
   * So the wait is computed up front instead: the debounce, whatever is left of
   * the cooldown, or whatever is left of the rate limit's window — whichever is
   * longest.
   *
   * The rate limiter used to be checked *inside* the timeout and return early
   * when it refused, which is the same bug the cooldown had and loses an edit in
   * the same way. It was easier to hit than the cooldown ever was: five writes a
   * minute, and since the cooldown already spaces them two seconds apart, five
   * ordinary actions — statement, mood, surface, theme, name — reach the limit
   * in half a minute of normal editing. The sixth was refused, the effect only
   * runs again on a form change, and someone who had just finished editing had
   * no further change left to trigger a retry.
   *
   * So the limiter now answers with a wait rather than a yes or no, and the
   * write is delayed into the next free slot. Nothing is dropped, and the
   * throttle still does its job — the round-trip is what it exists to space out,
   * and a deferred round-trip is spaced out.
   *
   * Which is also the reason neither guard applies to a guest. Both exist to
   * space out *round-trips*, and a guest write is `localStorage.setItem` — no
   * server, no network, nothing on the other end to be polite to. Applying them
   * anyway pushed a guest's local save out by the better part of a minute under
   * sustained editing, bought nothing, and left a long window in which closing
   * the tab lost the edit. §1 is guest-first; the guest path takes the debounce
   * and nothing else, and its writes do not spend the server's five-a-minute
   * either, since they never reach it.
   */
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const signedIn = Boolean(user?.id);
    const sinceSave = Date.now() - lastSuccessfulSaveAtRef.current;
    const wait = signedIn
      ? Math.max(
          PERSIST_DEBOUNCE_MS,
          PERSIST_COOLDOWN_MS - sinceSave,
          saveRateLimitWaitMs(),
        )
      : PERSIST_DEBOUNCE_MS;

    /* Something is now owed to storage, and stays owed until it lands. The
     * unload flush below is what collects on it. */
    pendingWriteRef.current = true;

    /* Only a wait long enough to read as nothing happening gets announced. */
    const announce = window.setTimeout(() => {
      if (!cancelled) setSaveState("saving");
    }, SAVING_VISIBLE_AFTER_MS);

    const t = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        const fv = formValueRef.current;
        if (!fv) return;
        const meta = { createdAt: persistMetaRef.current.created_at };
        const snapshot = serializeMoodscreenState(fv, meta);
        persistMetaRef.current.created_at = snapshot.created_at;
        const saveMeta = {
          createdAt: persistMetaRef.current.created_at,
          updatedAt: fv.updated_at,
        };
        try {
          if (signedIn) {
            const { error } = await upsertMoodscreenForUser(user.id, fv, saveMeta);
            if (error) throw error;
            /* Only server writes count against the window, and only they need
             * spacing from the next one. */
            recordSuccessfulSave();
            lastSuccessfulSaveAtRef.current = Date.now();
            /* The row is current again, so the local copy is no longer ahead
             * of it. */
            clearPendingUpload();
            /* The link preview follows the row. Not awaited: it is a second,
             * slower round-trip, and "Saved" is about the Moodscreen. */
            refreshOgImageRef.current?.(user.id);
          } else {
            writeGuestMoodscreen(fv, saveMeta);
          }
          pendingWriteRef.current = false;
          setStorageNotice(null);
          setSaveState("saved");
        } catch (e) {
          console.warn("moodscreen persist failed:", e);
          /* The notice carries the failure, so the quiet line stands down
           * rather than showing two messages about one write. */
          setSaveState("idle");
          try {
            writeGuestMoodscreen(fv, saveMeta);
            /* Local now holds an edit the row does not, which is the same
             * situation the unload flush leaves behind and wants the same
             * marker — otherwise the next load reads the stale row over it and
             * "Saved locally" turns out to have been a lie by morning. */
            if (signedIn) markPendingUpload(user.id);
            pendingWriteRef.current = false;
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
      window.clearTimeout(announce);
    };
  }, [formValue, user?.id, hydrated]);

  /**
   * The write that is still owed when the page goes away.
   *
   * §11 says a cooldown may delay a write and must never drop one, and that
   * held for the timer — every burst kept a pending timeout, so nothing was lost
   * to a later keystroke. It did not hold for the tab. A signed-in user's write
   * can be queued the better part of a minute behind the rate limit, and until
   * now closing the tab inside that window dropped the edit exactly as surely as
   * the early `return` this replaced.
   *
   * Two events, because neither is enough alone. `pagehide` is the one that
   * fires on a real navigation away and on going into the back/forward cache;
   * `visibilitychange` is the one that fires when a phone backgrounds the tab,
   * which is where most of these sessions actually end — often with no unload
   * event ever arriving. `beforeunload` is deliberately not here: it adds a
   * third path that fires in a subset of the same cases and, on some browsers,
   * costs the page its bfcache entry to do it.
   *
   * The rescue is a synchronous localStorage write and nothing else. An unload
   * is not a place to start a round-trip and it is not a place to await one, so
   * a signed-in user's edit lands locally and is marked as ahead of the server;
   * the loader picks it up next time and the persist effect pushes it up. Which
   * makes this the offline-first answer to a browser crash and a lost connection
   * as well, not only to a closed tab.
   */
  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return undefined;

    const flush = () => {
      if (!pendingWriteRef.current) return;
      const fv = formValueRef.current;
      if (!fv) return;
      pendingWriteRef.current = false;
      try {
        writeGuestMoodscreen(fv, {
          createdAt: persistMetaRef.current.created_at,
          updatedAt: fv.updated_at,
        });
        if (user?.id) markPendingUpload(user.id);
      } catch {
        /* Quota or private mode. There is nothing further to try from here and
         * nothing useful to say to someone who has already left the page. */
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
    };
  }, [hydrated, user?.id]);

  /**
   * "Saved" stands down on its own.
   *
   * Its own effect rather than a timer inside the persist effect, which is torn
   * down and rebuilt on every edit — the confirmation would be cancelled by the
   * next keystroke and never clear.
   */
  useEffect(() => {
    if (saveState !== "saved") return undefined;
    const t = window.setTimeout(() => setSaveState("idle"), SAVED_VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, [saveState]);

  useEffect(() => {
    if (!storageNotice) return undefined;
    window.clearTimeout(storageNoticeTimerRef.current);
    storageNoticeTimerRef.current = window.setTimeout(() => setStorageNotice(null), 5000);
    return () => window.clearTimeout(storageNoticeTimerRef.current);
  }, [storageNotice]);

  /**
   * On sign-out, keep the current Moodscreen in guest storage immediately.
   *
   * Checked against the account that just left rather than `hydrated`, which in
   * this render already describes the guest and is false until guest storage
   * has been read.
   */
  useEffect(() => {
    const was = prevUserIdRef.current;
    if (was && !user?.id && hydratedFor === was) {
      writeGuestMoodscreen(formValue, {
        createdAt: persistMetaRef.current.created_at,
        updatedAt: formValue.updated_at,
      });
    }
    prevUserIdRef.current = user?.id;
  }, [user?.id, hydratedFor, formValue]);

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

  /* Read by the debounce below, so it hands the twins the latest props rather
   * than the ones captured when its timer was scheduled. */
  const moodscreenPropsRef = useRef(moodscreenProps);
  moodscreenPropsRef.current = moodscreenProps;

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

  /**
   * True while `captureNow` is photographing on demand.
   *
   * It flushes the twins to the live card first, and that flush is itself a
   * change to `exportProps` — which would otherwise wake the pre-render effect
   * and run a second 1620x1620 capture alongside the one the user is waiting
   * for, at the one moment there is least to spare.
   */
  const capturingRef = useRef(false);

  const exportKey = useMemo(() => JSON.stringify(moodscreenProps), [moodscreenProps]);
  const exportKeyRef = useRef(exportKey);
  exportKeyRef.current = exportKey;

  /**
   * What the off-screen twins are currently drawn as — the live Moodscreen, but
   * only once the typing has stopped.
   *
   * The twins exist to be photographed, and the photograph is taken on the
   * PRERENDER_DEBOUNCE_MS pause. Following every keystroke to get there was
   * work nobody could see: two more full 540px cards reconciled per character,
   * with their clip paths, gradients, textures and three SVG marks each, so the
   * app was rendering the product three times over to produce one visible
   * update. They now change on the same beat the capture runs on, which is the
   * only beat at which their contents ever mattered.
   *
   * It also removes a race the old shape had to hope its way out of. The
   * capture used to fire on a timer and read whatever the DOM happened to hold;
   * now the render that changes the node is the thing that schedules the
   * capture, so the node is current by construction.
   */
  const [exportProps, setExportProps] = useState(null);
  const exportPrimedRef = useRef(false);
  const exportPropsRef = useRef(exportProps);
  exportPropsRef.current = exportProps;

  /**
   * What the twins are drawn as before the first debounce has run: the live
   * props, so the node exists and is correct from the first paint. `captureNow`
   * depends on it being there.
   */
  const drawnExportProps = exportProps ?? moodscreenProps;

  /**
   * A pre-rendered blob is only good for the Moodscreen it was taken of, so the
   * moment the live one moves the prepared file is stale — said here, on the
   * keystroke, rather than after the debounce, because `sharePng` may be tapped
   * in between and must not hand over a picture of the previous statement.
   */
  useEffect(() => {
    if (!hydrated) return undefined;
    preparedRef.current = null;
    setShareReady(false);

    /* The card arriving from storage is not a pause in typing, it is the first
     * time there is anything to photograph — so the twins take it at once and
     * the debounce starts counting from there. Waiting the full 400ms here
     * would only mean capturing the defaults first and the real card second. */
    if (!exportPrimedRef.current) {
      exportPrimedRef.current = true;
      setExportProps(moodscreenPropsRef.current);
      return undefined;
    }

    const timer = window.setTimeout(
      () => setExportProps(moodscreenPropsRef.current),
      PRERENDER_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [exportKey, hydrated]);

  /**
   * Pre-render the blob once the twins are showing the current Moodscreen.
   *
   * This is what fixes the two-tap share: Web Share has to be called in the
   * same synchronous turn as the tap, and awaiting a capture spends the
   * gesture. Doing the work ahead of time means the tap has a File already.
   */
  useEffect(() => {
    if (!hydrated || !exportProps || typeof document === "undefined") return undefined;
    if (capturingRef.current) return undefined;

    let cancelled = false;

    void (async () => {
      try {
        const node = document.getElementById(EXPORT_NODE_ID);
        if (!node || cancelled) return;

        const theme = getTheme(exportProps.themeId);
        await ensureMoodscreenFontsReady(theme);
        if (cancelled) return;

        const blob = await captureMoodscreenBlob(node, { theme });
        if (cancelled) return;

        const filename = exportFilename(exportProps.username, exportProps.name);
        preparedRef.current = {
          /* Keyed by what was photographed, not by what is on screen now, so
           * `currentPrepared` can tell the two apart. */
          key: JSON.stringify(exportProps),
          blob,
          filename,
          file: new File([blob], filename, { type: "image/png" }),
        };
        if (!cancelled) setShareReady(true);
      } catch (e) {
        /* Not user-facing: the on-demand path below will retry and report. */
        console.warn("moodscreen pre-render failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exportProps, hydrated]);

  /** The blob for right now — the pre-rendered one if it is still current. */
  const currentPrepared = useCallback(() => {
    const prep = preparedRef.current;
    return prep && prep.key === exportKeyRef.current ? prep : null;
  }, []);

  const captureNow = useCallback(async () => {
    /**
     * Bring the twins up to the live card before photographing one.
     *
     * They lag it by up to PRERENDER_DEBOUNCE_MS, and this path exists for
     * exactly the window in which they do — a tap that lands before the
     * pre-render has caught up. Without the flush the file that comes back is a
     * picture of the previous statement, which is the drift §7 spends the whole
     * one-component rule preventing, arriving through the back door.
     *
     * `flushSync` rather than a settle: the capture reads the DOM, so the
     * commit has to have happened, not merely been scheduled.
     */
    capturingRef.current = true;
    try {
      flushSync(() => setExportProps(moodscreenPropsRef.current));

      const node = document.getElementById(EXPORT_NODE_ID);
      if (!node) throw new Error("The Moodscreen is not ready yet.");
      const theme = getTheme(formValueRef.current?.themeId);
      await ensureMoodscreenFontsReady(theme);
      const blob = await captureMoodscreenBlob(node, { theme });
      /* The handle the card is wearing, not only a claimed one — a guest who
       * has typed a name into the claim field gets `moodscreen-isaac.png`
       * rather than a file named after nobody. */
      const filename = exportFilename(moodscreenProps.username, formValueRef.current?.name);
      return { blob, filename };
    } finally {
      capturingRef.current = false;
    }
  }, [moodscreenProps.username]);

  /**
   * The link preview: photograph the 1200x630 twin and upload it as
   * og/{user_id}.jpg, after every successful save — api/og-page.js serves it as
   * the og:image of moodscreen.live/username.
   *
   * Only for a claimed handle. Without one there is no public page for a link
   * to point at, and the twin would be wearing the draft handle from the claim
   * field rather than anything a stranger could open.
   *
   * One at a time. Saves can land faster than a capture and an upload, and two
   * uploads racing could leave the older picture as the last one written; so a
   * save that arrives mid-flight marks one more as owed and the loop takes it,
   * photographing whatever the twin shows by then.
   */
  const ogUploadRef = useRef({ running: false, owed: false });
  const claimedUsernameRef = useRef(username);
  claimedUsernameRef.current = username;

  refreshOgImageRef.current = async (userId) => {
    if (!claimedUsernameRef.current || typeof document === "undefined") return;
    const state = ogUploadRef.current;
    if (state.running) {
      state.owed = true;
      return;
    }
    state.running = true;
    try {
      do {
        state.owed = false;
        /* The twins trail the live card by the pre-render debounce, which is
         * shorter than the persist debounce, so they are almost always current
         * by the time a save lands. Almost: bring them up if not, guarded the
         * same way captureNow is so the flush does not also start a 1620px
         * capture alongside this one. */
        if (JSON.stringify(exportPropsRef.current) !== exportKeyRef.current) {
          capturingRef.current = true;
          try {
            flushSync(() => setExportProps(moodscreenPropsRef.current));
          } finally {
            capturingRef.current = false;
          }
        }
        const node = document.getElementById(EXPORT_NODE_IDS.og);
        if (!node) return;
        const theme = getTheme(moodscreenPropsRef.current.themeId);
        const blob = await captureOgJpeg(node, { theme });
        const { error } = await uploadOgImage(userId, blob);
        if (error) throw error;
      } while (state.owed);
    } catch (e) {
      /* Not user-facing. The page falls back to the generic preview, and the
       * next save tries again. */
      console.warn("moodscreen link preview upload failed:", e);
    } finally {
      state.running = false;
    }
  };

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
      saveState,
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
      saveState,
      draftUsername,
    ],
  );

  return (
    <MoodscreenContext.Provider value={value}>
      {children}
      {/* The node every capture photographs. Always mounted, never seen — and
        * drawn from the debounced copy rather than the live one, so typing does
        * not reconcile two more full-size cards per character. */}
      <MoodscreenExportSurface {...drawnExportProps} />
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
