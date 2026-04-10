import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusCard from "../components/StatusCard.jsx";
import { moodRowsFromEntries } from "../lib/moodCategories.js";
import {
  getInitialsFromName,
  isActiveWithin48h,
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
      const moodRows = moodRowsFromEntries(normalized.moodEntries || []);
      const name = (normalized.name || profile.username || slug).trim() || slug;
      setCard({
        name,
        initials: getInitialsFromName(name),
        avatar: normalized.avatarUrl || null,
        location: (normalized.location || profile.location || "").trim(),
        moodRows,
        footerText: "",
        activeWithin48h: isActiveWithin48h(profile.last_active),
        darkMode: normalized.cardDarkMode !== false,
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
        <StatusCard {...card} />
      </div>
    </div>
  );
}
