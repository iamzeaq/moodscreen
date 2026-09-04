/**
 * The wall opt-in — CLAUDE.md §9.3, "Public visibility is opt-in, default off."
 *
 * The flag has to be settable by the person it describes or it is not opt-in,
 * it is off. So this is small, plain, and says exactly what saying yes does:
 * the Moodscreen appears on the front page where anyone can see it.
 *
 * It only offers itself to someone who has claimed a page, because the wall
 * links every tile to a live page and there is nothing to link to until then.
 *
 * Deliberately not a §10 primary action. The screen-shaped button is for the
 * one primary action in a view, and agreeing to appear on a wall is a setting —
 * dressing it as the loudest thing on the page would be arguing for a yes.
 */
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { setWallPublic } from "../services/profileService.js";

export default function WallOptIn({ className = "" }) {
  const { user, profile, refreshProfile } = useAuth();
  const claimed = Boolean(profile?.username);

  const [on, setOn] = useState(Boolean(profile?.wall_public));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* The profile is the truth; this only mirrors it until a change is saved. */
  useEffect(() => {
    setOn(Boolean(profile?.wall_public));
  }, [profile?.wall_public]);

  if (!user || !claimed) return null;

  const toggle = async () => {
    const next = !on;
    setOn(next);
    setSaving(true);
    setError(null);
    const { error: e } = await setWallPublic(user.id, next);
    setSaving(false);
    if (e) {
      /* Put it back rather than leaving a control claiming something that did
       * not happen. */
      setOn(!next);
      setError("That didn't save. Try again.");
      return;
    }
    void refreshProfile?.();
  };

  return (
    <div className={className}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={on}
          disabled={saving}
          onChange={toggle}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
        />
        <span>
          <span className="block text-15 text-fg">Show my Moodscreen on the wall</span>
          <span className="mt-1 block text-13 text-muted">
            It scrolls on the front page and links to moodscreen.live/{profile.username}.
            Off unless you turn it on.
          </span>
        </span>
      </label>

      {error ? (
        <p className="mt-2 text-13 text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
