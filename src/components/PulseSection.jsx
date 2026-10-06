/**
 * The pulse — CLAUDE.md §9, section 2.
 *
 * "Left-aligned wide band. Big live count, then the breakdown beneath it as a
 * mood-coloured bar. The hero asks the question; this answers it at scale."
 *
 * That last sentence is the whole brief. The hero asks one person what they are
 * on; this says how many people answered, and what they said. So the number is
 * the largest thing in the section and everything else is caption to it — there
 * is no headline above it competing for the same job.
 *
 * Left-aligned, because the hero is the only centred section on the site (§5),
 * and this is the first section after it: if the page is going to break out of
 * centred layout it has to do it here or the hero's centring stops reading as a
 * deliberate exception.
 *
 * **Visibility is decided by the caller.** §9 hides this entirely below 200
 * live Moodscreens, and the check lives in usePulse so the landing page can
 * work out its §9.7 divider directions before it lays anything out.
 *
 * The bar does not animate. §6 grants the motion budget four moments and a
 * growing bar is not one of them; the digits roll because that moment is
 * specified, and a width transition beside it would also be the one thing §6
 * bans outright, since width cannot be animated on the compositor.
 */
import { MOODS, getMood } from "../lib/moods.js";
import RollingNumber from "./pulse/RollingNumber.jsx";

/**
 * Segments below this share of the total are dropped from the bar.
 *
 * A one-pixel sliver is not a reading of anything — it is a scratch on the bar,
 * and ten of them at the tail turn a breakdown into a texture. The mood still
 * appears in the list beneath with its real count.
 */
const MIN_SHARE = 0.012;

export default function PulseSection({ pulse }) {
  if (!pulse) return null;

  const { total, byMood } = pulse;
  if (!total) return null;

  /* Ordered by size, so the bar reads left to right as "mostly this, then
   * this". The ten are hue-ordered everywhere else on the site because that is
   * how they are *chosen*; here they are being counted. */
  const ranked = byMood
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total || a.mood.localeCompare(b.mood));

  const segments = ranked.filter((m) => m.total / total >= MIN_SHARE);

  return (
    <section
      className="relative bg-canvas px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="pulse-count"
    >
      <div className="mx-auto max-w-content">
        {/* The count, and its caption directly under it. §5: space above a
          * heading is about twice the space below, so the caption binds to the
          * number rather than floating between it and the bar. */}
        <p
          id="pulse-count"
          className="text-48 font-semibold tracking-[-0.03em] text-fg sm:text-64"
        >
          <RollingNumber value={total} />
        </p>

        <p className="mt-2 text-18 text-muted">
          Moodscreens live right now, across ten moods.
        </p>

        {/* The breakdown. One bar, segments in the mood colours — this is the
          * one place on the site outside a Moodscreen where the spectrum
          * appears, and it is legitimate here because the colours *are* the
          * data: violet is thinking wherever you meet it (§3). */}
        <div
          className="mt-12 flex h-4 w-full gap-[3px] overflow-hidden"
          role="img"
          aria-label={ranked
            .map((m) => `${getMood(m.mood)?.label ?? m.mood}: ${m.total}`)
            .join(", ")}
        >
          {segments.map((m, i) => {
            const mood = getMood(m.mood);
            return (
              <span
                key={m.mood}
                /* Nested radius (§5): the segments are the bar's own ends, so
                 * only the outer two are rounded and the joins stay square. */
                style={{
                  width: `${(m.total / total) * 100}%`,
                  background: mood?.siteColor ?? "var(--line-strong)",
                  borderTopLeftRadius: i === 0 ? "var(--r-sm)" : 0,
                  borderBottomLeftRadius: i === 0 ? "var(--r-sm)" : 0,
                  borderTopRightRadius: i === segments.length - 1 ? "var(--r-sm)" : 0,
                  borderBottomRightRadius: i === segments.length - 1 ? "var(--r-sm)" : 0,
                }}
              />
            );
          })}
        </div>

        {/* The key. Every mood with a count, including the ones too small to
          * hold a segment — dropping them from the bar is a drawing decision,
          * not a decision to stop counting them. */}
        <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
          {ranked.map((m) => {
            const mood = getMood(m.mood) ?? MOODS[0];
            return (
              <li key={m.mood} className="flex items-baseline gap-2.5">
                <span
                  aria-hidden="true"
                  className="size-2 translate-y-[-1px] rounded-full"
                  style={{ background: mood.siteColor }}
                />
                <span className="text-15 text-fg tabular-nums">{m.total}</span>
                <span className="text-15 lowercase text-muted">{mood.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
