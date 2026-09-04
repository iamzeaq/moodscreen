/**
 * The two reads the front page's middle needs — CLAUDE.md §9.2 and §9.3.
 *
 * The wall shows the most recent public Moodscreens, and the pulse counts them
 * by mood. Both are cached at module scope: they are the same answer for every
 * visitor, they are read on mount by a section that can remount as the page
 * re-renders, and neither is worth a round-trip twice in one visit.
 */
import { normalizeStoredMoodscreen } from "../lib/moodscreenPayload.js";
import { WALL_SEEDS } from "../lib/wallSeeds.js";
import { MOOD_IDS } from "../lib/moods.js";
import { supabase } from "../lib/supabaseClient.js";

/**
 * How many real Moodscreens to pull for the wall.
 *
 * Two rows of tiles, and a row repeats its content to loop seamlessly, so far
 * more than this would be paid for on every visit and never seen.
 */
const WALL_LIMIT = 60;

/**
 * §9.3 — no expiry, for now.
 *
 * The wall shows the most recent public Moodscreens and nothing filters them by
 * age. What makes a Moodscreen stale is an open product decision and it is not
 * being guessed at here; when it is settled it lands here and in
 * PULSE_WINDOW_HOURS, and the query shapes do not change.
 */
export const WALL_WINDOW_HOURS = null;

/**
 * §9.2 — the freshness rule for the count, deliberately absent.
 *
 * `pulse_by_mood(NULL)` counts every Moodscreen. Passing a number here counts
 * only those updated within that many hours, which is the same decision as
 * WALL_WINDOW_HOURS and gets made at the same time.
 */
export const PULSE_WINDOW_HOURS = null;

/** §9.2 — below this the whole section is hidden; a small number advertises emptiness. */
export const PULSE_MIN_TOTAL = 200;

/** How long a cached answer stands before the next mount refetches. */
const CACHE_MS = 60_000;

function cached(fn) {
  let at = 0;
  let value = null;
  return () => {
    const now = Date.now();
    if (value && now - at < CACHE_MS) return value;
    at = now;
    value = fn().catch((e) => {
      /* A failed fetch must not be remembered for a minute. */
      value = null;
      throw e;
    });
    return value;
  };
}

/**
 * A stored payload plus its owner, flattened into exactly the props
 * <Moodscreen> takes.
 *
 * Everything on the wall goes through this, seeds included, so a seed and a
 * real Moodscreen are the same kind of thing by the time a tile draws one.
 */
function toTile(row, { username, name, location }) {
  const n = normalizeStoredMoodscreen(row);
  return {
    username,
    name: (n.name || name || username || "").trim(),
    location: (n.location || location || "").trim(),
    mood: n.mood,
    statement: n.statement,
    surface: n.surface,
    themeId: n.themeId,
    avatarUrl: n.avatarUrl || "",
    /* §7.4 — the hour it was written, not the hour the wall was loaded. */
    at: n.updated_at || n.created_at,
  };
}

/**
 * The authored seeds, in the same shape, for when there is no database.
 *
 * `at` is carried across as authored rather than normalised to UTC — see the
 * note in scripts/generate-wall-seed.mjs. A seed's timestamp is a fixture
 * chosen to show §7.4's three bands in one row, not a record of an instant, and
 * zoning it moves every seed by the reader's offset.
 */
function localSeedTiles() {
  return WALL_SEEDS.map((s) =>
    toTile(
      { ...s, updated_at: s.at },
      { username: s.username, name: s.name, location: s.location },
    ),
  );
}

async function fetchSeedTiles() {
  if (!supabase) return localSeedTiles();
  const { data, error } = await supabase
    .from("wall_seeds")
    .select("username, name, location, data")
    .order("sort_order", { ascending: true });

  /* The seeds exist so the wall is never empty, so a missing table or a failed
   * request falls back to the authored list rather than to nothing. */
  if (error || !Array.isArray(data) || data.length === 0) return localSeedTiles();
  return data.map((r) =>
    toTile(r.data, { username: r.username, name: r.name, location: r.location }),
  );
}

async function fetchRealTiles() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("wall_moodscreens")
    .select("username, location, data, updated_at")
    .order("updated_at", { ascending: false })
    .limit(WALL_LIMIT);

  if (error || !Array.isArray(data)) return [];
  return data.map((r) =>
    toTile(r.data, { username: r.username, name: "", location: r.location }),
  );
}

/**
 * The wall's contents: real public Moodscreens first, seeds behind them.
 *
 * Real ones lead because they are the point — the wall is proof that people are
 * using this. The seeds fill out the rows behind them and drop off the end as
 * real ones arrive, so the section grows into itself rather than being switched
 * over on some launch day.
 */
export const fetchWallTiles = cached(async () => {
  const [real, seeds] = await Promise.all([fetchRealTiles(), fetchSeedTiles()]);
  const taken = new Set(real.map((t) => t.username));
  return [...real, ...seeds.filter((t) => !taken.has(t.username))];
});

/**
 * §9.2 — the count, by mood.
 *
 * Returns the total and a full ten-mood breakdown, zeros included, so the bar
 * has a stable set of segments rather than one that changes shape as moods come
 * and go.
 *
 * Seeds are not counted. The threshold below which this section hides exists
 * precisely so a small number is never advertised, and padding the count with
 * examples to clear that threshold would be advertising a number that is not
 * true.
 */
export const fetchPulse = cached(async () => {
  const empty = { total: 0, byMood: MOOD_IDS.map((id) => ({ mood: id, total: 0 })) };
  if (!supabase) return empty;

  const { data, error } = await supabase.rpc("pulse_by_mood", {
    window_hours: PULSE_WINDOW_HOURS,
  });
  if (error || !Array.isArray(data)) return empty;

  const counts = new Map(data.map((r) => [r.mood_id, Number(r.total) || 0]));
  const byMood = MOOD_IDS.map((id) => ({ mood: id, total: counts.get(id) ?? 0 }));
  return { total: byMood.reduce((a, m) => a + m.total, 0), byMood };
});
