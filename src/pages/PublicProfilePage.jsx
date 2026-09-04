/**
 * moodscreen.live/username — CLAUDE.md §7.10.
 *
 * This page is for a stranger arriving from a story with no context. They tapped
 * an image; this is what is behind it. So it answers three questions in order —
 * who, what are they on, and is this current — and then it stops.
 *
 * **The Moodscreen is the page.** Not a header with the Moodscreen in it, not a
 * profile that happens to show one. Everything above the screen is small enough
 * to read in a glance and everything below it is one line. No feed, no history
 * of past moods, no stats, no link list, no grid: §1 says this is not a link
 * directory and not a website builder, and every one of those is how a page like
 * this turns into one.
 *
 * **The canvas stays near-black.** Only the screen carries the mood. Filling the
 * page with the hue would double the colour's area and halve its force — the
 * mood pops precisely because it is the one saturated thing on a quiet ground,
 * which is the same argument §7.8 makes for the export's backdrop.
 *
 * The "updated N minutes ago" line and the live dot beside it are not
 * decoration. §7.10: the page must never read as static, and those two marks are
 * the whole difference between this and a link-in-bio page. They sit directly
 * under the screen because that is the thing whose currency they are vouching
 * for.
 *
 * Motion is the breathing dot and nothing else. §6's budget has four moments and
 * none of the other three belongs here; the page's job is to exist and load
 * fast.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Moodscreen from "../components/Moodscreen.jsx";
import useFittedWidth from "../hooks/useFittedWidth.js";
import {
  isReservedUsername,
  isUsernameSlugValid,
  normalizeUsernameSlug,
} from "../lib/profileUtils.js";
import { accentVars } from "../lib/color.js";
import { getMood } from "../lib/moods.js";
import { relativeTime, relativeTimeTick } from "../lib/relativeTime.js";
import { getWallSeed } from "../lib/wallSeeds.js";
import { fetchPublicPage } from "../services/profileService.js";

/** The screen is the hero of the page, so it takes whatever width there is. */
const CARD_MAX = 420;

/**
 * A tidy label for a link, and the reason there is only one of them.
 *
 * §1: "One optional link per Moodscreen, maximum. Resist every request that adds
 * a second link field." Shown as its host rather than its full URL — a bare
 * `https://…?utm_source=…` is noise, and the host is the part anyone actually
 * reads before deciding to tap.
 */
function linkLabel(href) {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function toHref(link) {
  const t = String(link || "").trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/**
 * The relative stamp, kept true while the tab is open.
 *
 * A page left on a desk that still says "just now" an hour later is exactly the
 * staleness §7.10 forbids, and it is the one failure the reader cannot see is a
 * failure. The tick follows the bucket rather than a fixed interval, so this is
 * one timer a minute for the first hour and then hourly — not an animation, and
 * nothing like the cost of one.
 */
function useRelativeTime(at) {
  const [, bump] = useState(0);

  useEffect(() => {
    const ms = relativeTimeTick(at);
    if (ms === null) return undefined;
    const t = window.setTimeout(() => bump((n) => n + 1), ms);
    return () => window.clearTimeout(t);
  });

  return relativeTime(at);
}

export default function PublicProfilePage() {
  const { username: raw } = useParams();
  const slug = normalizeUsernameSlug(raw || "");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!slug || isReservedUsername(slug) || !isUsernameSlugValid(slug)) {
        setPage(null);
        setLoading(false);
        return;
      }
      setLoading(true);

      /* One request. See fetchPublicPage and the `public_moodscreens` view —
       * this used to be the profile, then the Moodscreen keyed by the id it
       * returned, which is two serial waits on the page shared links land on. */
      const { data } = await fetchPublicPage(slug);
      if (cancelled) return;

      if (data) {
        const ms = data.moodscreen;
        setPage({
          username: data.username,
          name: (ms.name || data.username).trim(),
          location: (ms.location || data.location || "").trim(),
          link: (ms.link || "").trim(),
          avatarUrl: ms.avatarUrl || "",
          mood: ms.mood,
          statement: ms.statement,
          themeId: ms.themeId,
          surface: ms.surface,
          /* §7.4 — the tint belongs to the hour it was written, not the hour a
           * stranger opens it. */
          at: ms.updated_at || data.updated_at || ms.created_at,
        });
        setLoading(false);
        return;
      }

      /* A seeded Moodscreen from the wall (§9.3). Every tile on the wall links
       * to its live page, and a seed has no row in `profiles`, so without this
       * the thirty most visible links on the site would all land on "this page
       * doesn't exist" — a worse first impression than the empty wall the seeds
       * exist to prevent. */
      const seed = getWallSeed(slug);
      if (seed) {
        setPage({
          username: seed.username,
          name: seed.name,
          location: seed.location,
          /* Read from the seed rather than blanked. No seed carries either of
           * these today, so both resolve to "" and the link and the avatar
           * simply do not draw — but hardcoding that here would mean a seed
           * that grew a link still could not show one, and the failure would
           * look like the link being broken rather than absent. */
          link: seed.link || "",
          avatarUrl: seed.avatarUrl || "",
          mood: seed.mood,
          statement: seed.statement,
          themeId: seed.themeId,
          surface: seed.surface,
          at: seed.at,
        });
        setLoading(false);
        return;
      }

      setPage(null);
      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const updated = useRelativeTime(page?.at);
  const [cardRef, cardWidth] = useFittedWidth(CARD_MAX);

  if (loading) {
    return <div className="min-h-dvh bg-canvas" aria-hidden />;
  }

  if (!page) {
    return (
      <div className="min-h-dvh bg-canvas px-4 py-32 text-center sm:px-6">
        <p className="text-18 text-muted">Nobody has claimed this page yet.</p>
        <Link
          to="/"
          className="mt-6 inline-block text-15 text-fg underline decoration-line-strong underline-offset-4 transition-colors duration-[var(--dur-hover)] hover:decoration-current"
        >
          Claim moodscreen.live/yourname
        </Link>
      </div>
    );
  }

  const mood = getMood(page.mood);
  const href = toHref(page.link);
  const initial = page.name.trim().charAt(0).toUpperCase();

  return (
    <div
      className="min-h-dvh bg-canvas px-4 py-14 sm:px-6 sm:py-20"
      /* §3 — the accent is the mood currently in focus, and on this page there
        * is exactly one. It reaches the focus rings and the caret, not the
        * ground: the canvas stays near-black so the screen is the only
        * saturated thing on it. */
      style={mood ? accentVars(mood.color) : undefined}
    >
      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center">
        {/* Who. Small — the screen below is the thing that carries this page,
          * and an avatar big enough to compete with it turns the page back into
          * a profile. */}
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-raised text-24 font-semibold text-muted">
          {page.avatarUrl ? (
            <img
              src={page.avatarUrl}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>

        <h1 className="mt-5 text-balance text-center text-24 font-semibold text-fg">
          {page.name}
        </h1>

        {/* The handle, in full. It is what was claimed and what the link they
          * followed said, so seeing it whole is how a stranger confirms they
          * landed where the image pointed. */}
        <p className="mt-1.5 text-15 text-muted">moodscreen.live/{page.username}</p>

        {page.location ? (
          <p className="mt-1 text-13 text-faint">{page.location}</p>
        ) : null}

        {/* What they are on. The hero of the page. */}
        <div ref={cardRef} className="mt-10 w-full" style={{ maxWidth: CARD_MAX }}>
          {/* Named props, not a spread of `page` — `link` belongs to this page
            * and not to the screen, and §7.5 already refuses `location`. */}
          <Moodscreen
            mood={page.mood}
            statement={page.statement}
            name={page.name}
            username={page.username}
            avatarUrl={page.avatarUrl}
            surface={page.surface}
            themeId={page.themeId}
            at={page.at}
            width={cardWidth}
          />
        </div>

        {/* Is this current. Directly under the screen, because that is what it
          * is vouching for. */}
        {updated ? (
          <p className="mt-6 flex items-center gap-2 text-13 text-muted">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                /* The site colour, not the export one — §3 drops ~6% chroma
                  * for anything drawn on the dark canvas. */
                background: mood?.siteColor ?? "var(--accent)",
                /* §6, moment 2 — the one piece of motion on this page. */
                animation: "moodscreen-breathe 2400ms var(--ease) infinite",
              }}
            />
            updated {updated}
          </p>
        ) : null}

        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            /* §12 — no arrow appended to link text. The underline is the
              * affordance and it does not need help. */
            className="mt-6 text-15 text-fg underline decoration-line-strong underline-offset-4 transition-colors duration-[var(--dur-hover)] hover:decoration-current"
          >
            {linkLabel(href)}
          </a>
        ) : null}

        {/* Quiet, and last. Someone who tapped through from a story is here for
          * the person above, not for the product — so this is a way out for
          * anyone who wants one, not a pitch. §2: make a Moodscreen, never
          * "create yours". */}
        <Link
          to="/"
          className="mt-14 text-13 text-faint transition-colors duration-[var(--dur-hover)] hover:text-muted"
        >
          Make your own Moodscreen
        </Link>
      </div>
    </div>
  );
}
