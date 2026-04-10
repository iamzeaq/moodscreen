/**
 * Minimal auth sheet — Google / Twitter / guest. No direct Supabase imports.
 */
import { useState } from "react";
import { GoogleLogoMark, XLogoMark } from "./icons/BrandOAuthIcons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthModal() {
  const {
    closeAuthModal,
    loginWithGoogle,
    loginWithTwitter,
    isSupabaseConfigured,
  } = useAuth();
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  async function run(provider, fn) {
    if (!isSupabaseConfigured) {
      setMessage(
        "Sign-in needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your host’s build env, then redeploy (Vite inlines them at build time).",
      );
      return;
    }
    setMessage(null);
    setBusy(provider);
    try {
      const { error } = await fn();
      if (error) setMessage(error.message || "Something went wrong.");
      // OAuth redirects the browser — no close needed on success
    } catch (e) {
      setMessage(e?.message || "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={closeAuthModal}
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-[0_24px_64px_-20px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.04]">
        <h2 id="auth-modal-title" className="ds-title-sm">
          Save your moodscreen
        </h2>
        <p className="mt-2 ds-body text-secondary">
          Optional — keep editing as a guest anytime. Sign in to sync across devices.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run("google", loginWithGoogle)}
            aria-label={busy === "google" ? "Redirecting to Google" : "Sign in with Google"}
            className="generator-btn generator-btn-primary inline-flex w-full items-center justify-center gap-3 disabled:opacity-50"
          >
            <GoogleLogoMark size={20} />
            <span>{busy === "google" ? "Redirecting…" : "Sign in"}</span>
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run("twitter", loginWithTwitter)}
            aria-label={busy === "twitter" ? "Redirecting to X" : "Sign in with X (Twitter)"}
            className="generator-btn generator-btn-ghost inline-flex w-full items-center justify-center gap-3 disabled:opacity-50"
          >
            <XLogoMark size={20} className="text-primary" />
            <span>{busy === "twitter" ? "Redirecting…" : "Sign in"}</span>
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={closeAuthModal}
            className="mt-1 w-full rounded-pill border border-transparent py-2.5 text-sm font-medium text-secondary transition-colors hover:text-primary"
          >
            Continue as guest
          </button>
        </div>

        {message ? (
          <p className="mt-4 text-center text-xs text-meta" role="alert">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
