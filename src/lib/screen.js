/**
 * The screen — CLAUDE.md §7.1.
 *
 * Not a rounded rectangle. Edges bow outward and the corners pull tight, like
 * a Nokia or a CRT. The outline is the brand: it comes straight out of the
 * product name, and nothing else in this category looks like it.
 *
 * The path is authored once, on a 0 0 400 400 viewBox, and everything else
 * here is derived from it. It is used two ways — as the card's fill, and as
 * the clip for every layer inside it — so the normalised copy exists to let
 * CSS `clip-path` scale it to whatever size the card is drawn at without a
 * second transcription of the coordinates to get out of step.
 */

export const SCREEN_VIEWBOX = 400;

/** §7.1, verbatim. */
export const SCREEN_PATH = [
  "M75 20 C150 4, 250 4, 325 20 C357 27, 373 43, 380 75",
  "C396 150, 396 250, 380 325 C373 357, 357 373, 325 380",
  "C250 396, 150 396, 75 380 C43 373, 27 357, 20 325",
  "C4 250, 4 150, 20 75 C27 43, 43 27, 75 20 Z",
].join(" ");

/**
 * The same path in 0..1, for `clipPathUnits="objectBoundingBox"`.
 *
 * Scaled rather than rewritten. A hand-copied second version would drift from
 * the first the moment either is touched, and the drift would show up as a
 * one-pixel halo around a card nobody could explain.
 */
export const SCREEN_PATH_UNIT = SCREEN_PATH.replace(/-?\d*\.?\d+/g, (n) =>
  String(Math.round((Number(n) / SCREEN_VIEWBOX) * 1e5) / 1e5),
);

/**
 * The path scaled to a px box, for CSS `clip-path: path(...)`.
 *
 * Clipping this way rather than with `clip-path: url(#id)` is deliberate.
 * html-to-image serialises the card into a foreignObject, and every reference
 * to an SVG def by id is one more thing that can fail to survive that trip —
 * §7.3 already had to ban filter-based grain for exactly this reason. A
 * literal path in the CSS has nothing to resolve, so what the export captures
 * is what the browser drew. The card always lays out at one fixed size, so
 * baking px coordinates in costs nothing.
 */
export function screenPathAt(size) {
  const k = size / SCREEN_VIEWBOX;
  return SCREEN_PATH.replace(/-?\d*\.?\d+/g, (n) => String(Math.round(Number(n) * k * 100) / 100));
}

/**
 * §7.1: because the corners curve inward, content sits further in than it
 * would on a rectangle. Safe area is 13% on all sides.
 */
export const SAFE_INSET = 0.13;

/** The safe area in px for a card drawn at `size`. */
export function safeInset(size) {
  return Math.round(size * SAFE_INSET);
}
