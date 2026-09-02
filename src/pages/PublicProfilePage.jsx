import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Moodscreen from "../components/Moodscreen.jsx";
import { deriveMoodId, deriveStatement } from "../lib/moodscreenModel.js";
import {
  isReservedUsername,
  isUsernameSlugValid,
  normalizeUsernameSlug,
} from "../lib/profileUtils.js";
import { normalizeStoredMoodscreen } from "../lib/moodscreenPayload.js";
import { fetchMoodscreenForUser } from "../services/moodscreenDataService.js";
import { fetchProfileByUsername } from "../services/profileService.js";

export default function PublicProfilePage() {
  const { username: raw } = useParams();
  const slug = normalizeUsernameSlug(raw || "");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [card, setCard] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!slug || isReservedUsername(slug) || !isUsernameSlugValid(slug)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setNotFound(false);
      const { data: profile, error: pe } = await fetchProfileByUsername(slug);
      if (cancelled) return;
      if (pe || !profile?.username) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data: ms } = await fetchMoodscreenForUser(profile.id);
      if (cancelled) return;
      const normalized = ms && typeof ms === "object" ? ms : normalizeStoredMoodscreen(null);
      const entries = normalized.moodEntries || [];
      const name = (normalized.name || profile.username || slug).trim() || slug;
      setCard({
        name,
        location: (normalized.location || profile.location || "").trim(),
        mood: deriveMoodId(entries),
        statement: deriveStatement(entries),
        themeId: normalized.themeId,
        surface: normalized.surface,
        /* §7.4 — the tint belongs to the hour it was written, not the hour a
         * stranger opens it. */
        at: normalized.updated_at || normalized.created_at,
        username: profile.username,
      });
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <div className="min-h-dvh bg-surface" aria-hidden />;
  }

  if (notFound || !card) {
    return (
      <div className="min-h-dvh bg-surface px-4 py-16 text-center">
        <p className="text-sm text-secondary">This profile doesn’t exist.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
        <Link
          to="/"
          className="ds-body self-start text-secondary transition-colors hover:text-primary"
        >
          ← Home
        </Link>
        <div className="flex justify-center">
          <Moodscreen {...card} width={360} />
        </div>
        <div className="cta-section">
          <p className="cta-text">Your turn</p>
          <Link to="/create" className="cta-button">
            Make a Moodscreen
          </Link>
          <p className="cta-subtext">Takes ten seconds</p>
        </div>
      </div>
    </div>
  );
}
