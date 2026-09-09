/**
 * The mood spectrum — CLAUDE.md §3.
 *
 * Ten moods. Each carries the full-strength colour used in the export, an
 * `ink` (a very dark tone from its own hue family, used for every piece of
 * text on that mood's Moodscreen — never black, never white), and a
 * `siteColor`, the same fill with ~6% of its chroma removed because large
 * saturated fills bloom on a dark screen.
 *
 * This is the palette the redesign runs on. `moodCategories.js` still holds
 * the pre-redesign list of 34 emoji categories that the current editor uses;
 * reconciling the two belongs to the Moodscreen renderer work, not here.
 */
import { hexToOklch, scaleChroma } from "./color.js";

const SPECTRUM = [
  { id: "building", label: "Building", color: "#FF8A00", ink: "#4A2C05" },
  { id: "creating", label: "Creating", color: "#FF5FA2", ink: "#4E1330" },
  { id: "coding", label: "Coding", color: "#00C08B", ink: "#05392A" },
  { id: "hiring", label: "Hiring", color: "#FFD029", ink: "#4A3703" },
  { id: "thinking", label: "Thinking", color: "#8B7BFF", ink: "#221C55" },
  { id: "available", label: "Available", color: "#2ED47A", ink: "#0B3D22" },
  { id: "speaking", label: "Speaking", color: "#FF4D6D", ink: "#4C0E1C" },
  { id: "learning", label: "Learning", color: "#00BFC7", ink: "#04383B" },
  { id: "traveling", label: "Traveling", color: "#3DA5F5", ink: "#0A2E4A" },
  /* `offline` is a mid grey, so it has the least room for ink. This is as
   * dark as its hue family goes before it stops reading as blue-grey and
   * starts reading as a hole in the card; it clears 3.5:1, which carries the
   * statement but not 11px metadata. The renderer gives that line a size
   * bump on this mood. */
  { id: "offline", label: "Offline", color: "#6E7480", ink: "#1B1F28" },
];

/** ~6% chroma off the export colour, for anything rendered on the site. */
const SITE_CHROMA = 0.94;

export const MOODS = SPECTRUM.map((m) => ({
  ...m,
  siteColor: scaleChroma(m.color, SITE_CHROMA),
}));

export const MOOD_IDS = MOODS.map((m) => m.id);

const BY_ID = new Map(MOODS.map((m) => [m.id, m]));

/** The accent before any mood is chosen (CLAUDE.md §3). */
export const DEFAULT_ACCENT = "#8B7BFF";

export function getMood(id) {
  return BY_ID.get(id) ?? null;
}

/** The colour that should be driving `--accent` for a given mood. */
export function accentForMood(id) {
  return BY_ID.get(id)?.color ?? DEFAULT_ACCENT;
}

/**
 * The ten, ordered by hue — CLAUDE.md §7.9.
 *
 * The picker is a ring of stops "ordered by hue", and the web strip is the
 * same data in a line, so the order has to come from the colours rather than
 * from the order §3 happens to list them in. Sorted by OKLCH hue angle so the
 * strip reads as a spectrum and scrubbing it feels like turning a dial.
 *
 * `offline` is a mid grey with almost no chroma, so its hue angle is close to
 * meaningless. It goes last deliberately: it is the one mood that means the
 * absence of the others, and an end stop is where the eye expects that.
 */
export const MOODS_BY_HUE = (() => {
  const grey = MOODS.filter((m) => m.id === "offline");
  const rest = MOODS.filter((m) => m.id !== "offline");
  rest.sort((a, b) => hexToOklch(a.color).h - hexToOklch(b.color).h);
  return [...rest, ...grey];
})();

export const MOOD_IDS_BY_HUE = MOODS_BY_HUE.map((m) => m.id);

/** The next mood round the ring — what the §10 button cycles through on hover. */
export function nextMoodId(id, step = 1) {
  const i = MOOD_IDS_BY_HUE.indexOf(id);
  const from = i === -1 ? 0 : i;
  const n = MOOD_IDS_BY_HUE.length;
  return MOOD_IDS_BY_HUE[(((from + step) % n) + n) % n];
}

export function isMoodId(id) {
  return typeof id === "string" && BY_ID.has(id);
}
