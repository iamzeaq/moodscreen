import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { completeOnboarding } from "../services/profileService.js";
import {
  isUsernameSlugValid,
  normalizeUsernameSlug,
} from "../lib/profileUtils.js";

export default function OnboardingPage() {
  const { user, sessionReady, profileLoading, refreshProfile, isSupabaseConfigured } =
    useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionReady || profileLoading) return;
    if (!isSupabaseConfigured || !user?.id) {
      navigate("/", { replace: true });
    }
  }, [sessionReady, profileLoading, user?.id, isSupabaseConfigured, navigate]);

  if (!sessionReady || profileLoading) {
    return <div className="min-h-dvh bg-surface" aria-hidden />;
  }

  if (!isSupabaseConfigured || !user?.id) {
    return <div className="min-h-dvh bg-surface" aria-hidden />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    const slug = normalizeUsernameSlug(username);
    if (!isUsernameSlugValid(slug)) {
      setError("Username: 3–30 characters, lowercase letters, numbers, or underscore.");
      return;
    }
    const loc = location.trim();
    const st = status.trim();
    if (!loc || !st) {
      setError("Add location and status.");
      return;
    }
    setBusy(true);
    const { error: err } = await completeOnboarding(user.id, {
      username: slug,
      location: loc,
      statusText: st,
    });
    setBusy(false);
    if (err) {
      const msg = err?.message || String(err);
      const taken =
        err?.code === "23505" || /duplicate|unique|already exists/i.test(msg);
      setError(taken ? "That username is taken." : msg.length < 120 ? msg : "Could not save.");
      return;
    }
    await refreshProfile();
    navigate(`/${slug}`, { replace: true });
  }

  return (
    <div className="min-h-dvh bg-surface px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="ds-body text-secondary transition-colors hover:text-primary"
        >
          ← Home
        </Link>

        <h1 className="ds-title-sm mt-8">Finish setup</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          Choose your public URL and a first status. You can edit everything later in the studio.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="onb-username" className="block text-xs font-medium text-secondary">
              Username
            </label>
            <div className="mt-1.5 flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
              <span className="shrink-0 text-meta">/</span>
              <input
                id="onb-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-primary outline-none placeholder:text-meta"
                placeholder="your_name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="onb-location" className="block text-xs font-medium text-secondary">
              Location
            </label>
            <input
              id="onb-location"
              name="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-primary outline-none placeholder:text-meta"
              placeholder="City or region"
            />
          </div>

          <div>
            <label htmlFor="onb-status" className="block text-xs font-medium text-secondary">
              Status
            </label>
            <textarea
              id="onb-status"
              name="status"
              rows={3}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1.5 w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-primary outline-none placeholder:text-meta"
              placeholder="What you’re up to"
            />
          </div>

          {error ? (
            <p className="text-xs leading-relaxed text-red-600/90 dark:text-red-400/90" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="generator-btn generator-btn-primary w-full disabled:opacity-50"
          >
            {busy ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
