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

/**
 * The edge inset, and how far past it the edges bow outward.
 *
 * §7.1's path bows 16 units on a 400 box. At that strength the four edges
 * bulge enough that the outline reads as a lozenge rather than as a screen —
 * the curve never settles into anything you would call a side. Running it at
 * 60% keeps the bow doing its job (the shape is still visibly not a rounded
 * rectangle, and still reads as convex) without the sides swelling.
 *
 * This is one number rather than eight hand-edited coordinates because it is
 * the thing most likely to be tuned again, and eight coordinates edited by
 * hand is eight chances for one of them to be missed.
 */
const EDGE = 20;
const FULL_BOW = 16;
export const BOW_SCALE = 0.6;

const BOW = FULL_BOW * BOW_SCALE;
const NEAR = round(EDGE - BOW);
const FAR = round(SCREEN_VIEWBOX - EDGE + BOW);

function round(n) {
  return Math.round(n * 100) / 100;
}

/**
 * §7.1's path, with the bow scaled. The corner control points are untouched:
 * they set how tightly the corners pull in, which is the part that makes it a
 * screen, and only the mid-edge controls carry the bow.
 */
export const SCREEN_PATH = [
  `M75 ${EDGE} C150 ${NEAR}, 250 ${NEAR}, 325 ${EDGE}`,
  `C357 27, 373 43, 380 75`,
  `C${FAR} 150, ${FAR} 250, 380 325`,
  `C373 357, 357 373, 325 380`,
  `C250 ${FAR}, 150 ${FAR}, 75 380`,
  `C43 373, 27 357, ${EDGE} 325`,
  `C${NEAR} 250, ${NEAR} 150, ${EDGE} 75`,
  `C27 43, 43 27, 75 ${EDGE} Z`,
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
 * Because the corners curve inward, content sits further in than it would on
 * a rectangle.
 *
 * §7.1 sets this at 13%, which was written against the full-strength bow. With
 * the bow at 60% the corners intrude that much less, and 13% left the content
 * filling about a third of the card with dead space above and below the stack
 * — the statement is supposed to be the largest thing on the card by a wide
 * margin, and it cannot be if it is boxed into the middle 400px of 540.
 */
export const SAFE_INSET = 0.085;

/** The safe area in px for a card drawn at `size`. */
export function safeInset(size) {
  return Math.round(size * SAFE_INSET);
}
