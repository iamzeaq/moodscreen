/**
 * iOS-style expandable signup control: compact label → floating panel with auth actions.
 * Uses AuthContext only (no direct Supabase in UI). Animations are CSS-driven.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getAccountDisplayIdentifier, getAuthProvider } from "../lib/userProfile.js";
import { GoogleLogoMark, XLogoMark } from "./icons/BrandOAuthIcons.jsx";
import UserAvatar from "./UserAvatar.jsx";

/** Small provider mark beside account id — iOS-adjacent scale, minimal */
function AccountProviderMark({ user }) {
  const p = getAuthProvider(user);
  const size = 15;
  if (p === "google") {
    return <GoogleLogoMark size={size} className="shrink-0 opacity-[0.97]" />;
  }
  if (p === "twitter") {
    return <XLogoMark size={size} className="shrink-0 text-neutral-800" />;
  }
  return null;
}

function Chevron({ expanded, className, compact }) {
  const s = compact ? 14 : 16;
  return (
    <svg
      className={[className, "signup-widget-chevron transition-transform duration-200 ease-out"].filter(Boolean).join(" ")}
      style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={compact ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export default function SignupWidget({
  defaultLabel = "create yours",
  guestStudioPath = "/create",
  className = "",
  align = "start",
  /** `nav` — top bar: compact, no hint line; signed-in uses same dropdown pattern */
  variant = "default",
}) {
  const id = useId();
  const rootRef = useRef(null);
  const navigate = useNavigate();
  const {
    user,
    sessionReady,
    loginWithGoogle,
    loginWithTwitter,
    logout,
    isSupabaseConfigured,
  } = useAuth();

  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [busy, setBusy] = useState(null);

  const loggedIn = Boolean(sessionReady && user?.email);
  const isNav = variant === "nav";
  const expandedGuest = (hover || pinned || focusInside) && !loggedIn;
  const expandedAccount =
    isNav && loggedIn && (hover || pinned || focusInside);
  const expandedPanel = expandedGuest || expandedAccount;
  const expanded = expandedPanel;

  const goStudio = useCallback(() => {
    navigate(guestStudioPath);
    setPinned(false);
  }, [guestStudioPath, navigate]);

  /** Desktop-only hover expand — avoids iOS “sticky hover” fighting tap-to-toggle */
  const setHoverIfSupported = useCallback((value) => {
    if (!value) {
      setHover(false);
      return;
    }
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      setHover(true);
    }
  }, []);

  /* Defer outside-click listener one frame so open + outside detection don’t race on mobile */
  useEffect(() => {
    if (!pinned) return undefined;
    let cancelled = false;
    function onDocPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) {
        setPinned(false);
      }
    }
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      document.addEventListener("pointerdown", onDocPointerDown, true);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", onDocPointerDown, true);
    };
  }, [pinned]);

  useEffect(() => {
    if (!pinned && !expanded) return undefined;
    function onKey(e) {
      if (e.key === "Escape") {
        setPinned(false);
        rootRef.current?.querySelector(".signup-widget-trigger")?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pinned, expanded]);

  useEffect(() => {
    if (user?.email) setPinned(false);
  }, [user?.email]);

  async function runProvider(key, fn) {
    if (!sessionReady) return;
    if (!isSupabaseConfigured) {
      goStudio();
      return;
    }
    setBusy(key);
    try {
      const { error } = await fn();
      if (error) console.warn(error.message);
    } finally {
      setBusy(null);
    }
  }

  if (sessionReady && user?.email && !isNav) {
    return (
      <div className={["inline-flex", className].filter(Boolean).join(" ")}>
        <button
          type="button"
          onClick={goStudio}
          className="signup-widget-studio-only inline-flex min-h-12 items-center justify-center rounded-[22px] border border-black/[0.1] bg-card/90 px-7 text-base font-medium text-primary shadow-[0_2px_12px_-4px_rgba(0,0,0,0.12)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_28px_-8px_rgba(0,0,0,0.18)] active:scale-[0.98]"
        >
          Open studio&nbsp;→
        </button>
      </div>
    );
  }

  const alignClass =
    align === "center"
      ? "justify-center"
      : align === "end"
        ? "justify-end"
        : "justify-start lg:justify-start";

  if (sessionReady && user?.email && isNav) {
    return (
      <div
        ref={rootRef}
        className={["signup-widget-root relative inline-flex max-w-full", alignClass, className]
          .filter(Boolean)
          .join(" ")}
      onMouseEnter={() => setHoverIfSupported(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onFocusCapture={() => setFocusInside(true)}
      onBlurCapture={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget)) {
          setFocusInside(false);
        }
      }}
    >
      <button
        type="button"
        id={`${id}-account-trigger`}
          aria-expanded={expandedAccount}
          aria-controls={`${id}-account-panel`}
          title={user.email}
          aria-label="Account menu"
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          onClick={() => setPinned((p) => !p)}
          className={[
            "relative h-10 w-10 shrink-0 overflow-hidden rounded-full p-0 transition-transform duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-card)]",
            pressed ? "scale-[0.96]" : "scale-100",
          ].join(" ")}
        >
          <UserAvatar user={user} size={40} plain className="h-full w-full" />
        </button>

        <div
          id={`${id}-account-panel`}
          role="region"
          aria-hidden={!expandedAccount}
          aria-labelledby={`${id}-account-trigger`}
          className={[
            "absolute right-0 top-[calc(100%+8px)] z-[80] w-[min(100vw-2rem,17rem)] overflow-hidden rounded-2xl border border-black/[0.08] bg-[rgba(255,255,255,0.96)] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.8)_inset] backdrop-blur-md transition-[opacity,transform,visibility] duration-200 ease-out",
            expandedAccount
              ? "visible translate-y-0 opacity-100"
              : "invisible pointer-events-none -translate-y-1 opacity-0",
          ].join(" ")}
        >
          <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-3 py-2.5 text-left">
            <AccountProviderMark user={user} />
            <span
              className="min-w-0 flex-1 truncate text-xs font-medium leading-snug tracking-[-0.01em] text-primary"
              title={getAccountDisplayIdentifier(user)}
            >
              {getAccountDisplayIdentifier(user) || user.email}
            </span>
          </div>
          <div className="signup-widget-actions flex flex-col gap-2 px-3 pb-3 pt-2">
            <button
              type="button"
              onClick={() => {
                goStudio();
              }}
              className="signup-widget-action flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-black/[0.08] bg-white/60 px-4 text-center text-sm font-medium text-primary shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[transform,background-color,box-shadow] duration-300 ease-out hover:bg-white hover:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.12)] active:scale-[0.99]"
            >
              Open studio&nbsp;→
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                setPinned(false);
              }}
              className="mt-0.5 w-full rounded-xl py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-meta transition-colors hover:text-primary"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={["signup-widget-root relative inline-flex max-w-full", alignClass, className]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={() => setHoverIfSupported(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onFocusCapture={() => setFocusInside(true)}
      onBlurCapture={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget)) {
          setFocusInside(false);
        }
      }}
    >
      <div
        className={[
          "signup-widget-shell signup-widget-shell--guest signup-widget-shell--gradient-cta transition-[transform,box-shadow,min-width,background-color,border-color,border-radius,color] duration-200 ease-out",
          expandedGuest
            ? "rounded-[1.125rem] border border-neutral-900/88 bg-[rgba(252,252,253,0.98)] shadow-[0_4px_20px_-6px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.8)_inset]"
            : "rounded-full border-0",
          expandedGuest ? "signup-widget-shell--expanded" : "",
          expandedGuest ? "signup-widget-shell--dropdown-open" : "",
          pressed ? "signup-widget-shell--pressed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={expandedGuest}
          aria-controls={`${id}-panel`}
          className={[
            "signup-widget-trigger flex w-full min-h-10 items-center justify-between gap-2 px-5 py-2.5 text-left text-sm font-semibold tracking-[-0.01em] transition-[padding,color] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            expandedGuest
              ? "text-primary focus-visible:ring-black/15"
              : "min-h-12 text-[#1e2118] focus-visible:ring-[#3d4a2e]/35",
          ].join(" ")}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          onClick={() => setPinned((p) => !p)}
          title="Sign-in with Google, X, or continue as guest"
        >
          <span
            className={[
              "signup-widget-label min-w-0 flex-1 truncate transition-[font-size,opacity] duration-200 ease-out",
              expandedGuest ? "text-[0.8125rem] text-secondary" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {defaultLabel}
          </span>
          <Chevron
            expanded={expandedGuest}
            compact
            className={
              expandedGuest
                ? "shrink-0 text-meta opacity-70"
                : "shrink-0 text-[#1e2118]/75 opacity-90"
            }
          />
        </button>

        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-trigger`}
          className={[
            "signup-widget-panel",
            expandedGuest ? "signup-widget-panel--open" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="signup-widget-panel-inner">
            <div className="signup-widget-actions flex flex-col gap-2 px-3 pb-3 pt-0">
              {!sessionReady ? (
                <p className="px-1 py-2 text-center text-xs text-meta">
                  Preparing sign-in…
                </p>
              ) : null}
              {sessionReady && isSupabaseConfigured ? (
                <>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => runProvider("google", loginWithGoogle)}
                    aria-label={
                      busy === "google" ? "Redirecting to Google" : "Sign in with Google"
                    }
                    className="signup-widget-action flex min-h-11 items-center gap-3 rounded-2xl border border-black/[0.08] bg-white/60 px-4 text-left text-sm font-medium text-primary shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[transform,background-color] duration-150 ease-out hover:bg-white active:scale-[0.99] disabled:opacity-50"
                  >
                    <GoogleLogoMark size={20} />
                    <span>{busy === "google" ? "Redirecting…" : "Sign in"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => runProvider("twitter", loginWithTwitter)}
                    aria-label={
                      busy === "twitter" ? "Redirecting to X" : "Sign in with X (Twitter)"
                    }
                    className="signup-widget-action flex min-h-11 items-center gap-3 rounded-2xl border border-black/[0.08] bg-white/60 px-4 text-left text-sm font-medium text-primary shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[transform,background-color] duration-150 ease-out hover:bg-white active:scale-[0.99] disabled:opacity-50"
                  >
                    <XLogoMark size={20} className="text-white" />
                    <span>{busy === "twitter" ? "Redirecting…" : "Sign in"}</span>
                  </button>
                </>
              ) : sessionReady ? (
                <p className="px-1 pb-1 text-xs leading-relaxed text-meta">
                  Sign-in isn&apos;t available on this build (missing{" "}
                  <code className="rounded bg-white/10 px-1 py-0.5 text-[0.65rem]">VITE_SUPABASE_URL</code>{" "}
                  /{" "}
                  <code className="rounded bg-white/10 px-1 py-0.5 text-[0.65rem]">
                    VITE_SUPABASE_ANON_KEY
                  </code>{" "}
                  in the host environment). Add them and redeploy — same on phone and desktop.
                  You can still use the studio.
                </p>
              ) : null}
              <button
                type="button"
                onClick={goStudio}
                className="mt-1 w-full rounded-xl py-2.5 text-center text-xs font-medium text-meta transition-colors hover:text-primary"
              >
                Continue without signing in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
