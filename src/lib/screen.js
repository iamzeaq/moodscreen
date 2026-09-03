/**
 * The screen — CLAUDE.md §7.1.
 *
 * Not a rounded rectangle. Edges bow outward and the corners pull tight, like
 * a Nokia or a CRT. The outline is the brand: it comes straight out of the
 * product name, and nothing else in this category looks like it.
 *
 * The path is authored once, on a 0 0 400 400 viewBox, and everything else
 * here is derived from it. It is used three ways — as the card's fill, as the
 * clip for every layer inside it, and as the thing content is positioned
 * against — so the normalised copy exists to let CSS `clip-path` scale it to
 * whatever size the card is drawn at without a second transcription of the
 * coordinates to get out of step.
 */

export const SCREEN_VIEWBOX = 400;

/** The centre of the box, on both axes. The shape is symmetric about it. */
const MID = SCREEN_VIEWBOX / 2;

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
 * §7.1's path as its eight cubics, with the bow scaled. The corner control
 * points are untouched: they set how tightly the corners pull in, which is the
 * part that makes it a screen, and only the mid-edge controls carry the bow.
 *
 * This is the single source of truth for the outline. The `d` string below is
 * generated from it, and so is the sampled edge that content is laid out
 * against — the previous arrangement had the string as the original and the
 * layout working off a guessed inset, which is precisely how content ended up
 * being positioned against the square element box instead of the drawn shape.
 *
 * Each entry is [start, control1, control2, end].
 */
const SCREEN_SEGMENTS = [
  /* top edge, bowing up */
  [[75, EDGE], [150, NEAR], [250, NEAR], [325, EDGE]],
  /* top-right corner */
  [[325, EDGE], [357, 27], [373, 43], [380, 75]],
  /* right edge, bowing out */
  [[380, 75], [FAR, 150], [FAR, 250], [380, 325]],
  /* bottom-right corner */
  [[380, 325], [373, 357], [357, 373], [325, 380]],
  /* bottom edge */
  [[325, 380], [250, FAR], [150, FAR], [75, 380]],
  /* bottom-left corner */
  [[75, 380], [43, 373], [27, 357], [EDGE, 325]],
  /* left edge */
  [[EDGE, 325], [NEAR, 250], [NEAR, 150], [EDGE, 75]],
  /* top-left corner */
  [[EDGE, 75], [27, 43], [43, 27], [75, EDGE]],
];

export const SCREEN_PATH = [
  `M${SCREEN_SEGMENTS[0][0][0]} ${SCREEN_SEGMENTS[0][0][1]}`,
  ...SCREEN_SEGMENTS.map(
    ([, c1, c2, end]) => `C${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${end[0]} ${end[1]}`,
  ),
  "Z",
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
 * The midpoint of a cubic, which by the path's symmetry is where an edge or a
 * corner reaches furthest from the box.
 *
 * Worth having because the drawn shape is nowhere near its own bounding box:
 * the corners pull in to about 90% on both axes, so a layer aimed at
 * (100%, 100%) is aimed at a point outside the screen and gets clipped away
 * entirely. That is not a rounding error — it is roughly a tenth of the card on
 * each axis, enough to lose a whole feature of anything positioned against it.
 */
const cubicMid = (a, b, c, d) => 0.125 * a + 0.375 * b + 0.375 * c + 0.125 * d;

/**
 * Where the drawn top edge sits at the card's centre line, as a fraction of
 * the box.
 *
 * Not the 20-unit inset: the top edge bows *upward*, so at the middle — which
 * is where the centre stack is — the shape starts about seven units higher
 * than at the corners. Content is centred against this rather than against the
 * safe inset because the space the eye judges runs to the edge it can see, not
 * to the invisible line the first row happens to sit on.
 */
export const SCREEN_TOP = cubicMid(EDGE, NEAR, NEAR, EDGE) / SCREEN_VIEWBOX;

/** The drawn top edge in px for a card drawn at `size`. */
export function screenTop(size) {
  return SCREEN_TOP * size;
}

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

/* ------------------------------------------------------- the drawn edge */

/**
 * How far right the shape reaches at each whole unit of y, sampled once.
 *
 * There is no closed form for "x of this cubic at that y" worth writing here,
 * and the answer is needed at a handful of fixed heights that are known at
 * module load, so the curve is walked densely and bucketed instead. One pass,
 * 401 numbers, and every layout question below becomes a table lookup.
 *
 * Only the right half is stored. The shape is symmetric about both axes, so
 * the left edge is its mirror and the bottom half repeats the top.
 */
const RIGHT_EDGE = (() => {
  const table = new Float64Array(SCREEN_VIEWBOX + 1).fill(MID);
  const STEPS = 2000;

  for (const [p0, p1, p2, p3] of SCREEN_SEGMENTS) {
    for (let i = 0; i <= STEPS; i += 1) {
      const t = i / STEPS;
      const u = 1 - t;
      const w0 = u * u * u;
      const w1 = 3 * u * u * t;
      const w2 = 3 * u * t * t;
      const w3 = t * t * t;

      const x = w0 * p0[0] + w1 * p1[0] + w2 * p2[0] + w3 * p3[0];
      const y = w0 * p0[1] + w1 * p1[1] + w2 * p2[1] + w3 * p3[1];

      const yi = Math.round(y);
      if (yi >= 0 && yi <= SCREEN_VIEWBOX && x > table[yi]) table[yi] = x;
    }
  }

  return table;
})();

/**
 * Half the width the shape has at a given height, in viewBox units.
 *
 * Clamped rather than extrapolated: a y outside the shape has no width at all,
 * and returning a negative number there would silently produce a layout that
 * looks fine and clips.
 */
export function screenHalfWidthAt(y) {
  const clamped = Math.min(Math.max(y, 0), SCREEN_VIEWBOX);
  const lo = Math.floor(clamped);
  const hi = Math.min(lo + 1, SCREEN_VIEWBOX);
  const f = clamped - lo;
  const x = RIGHT_EDGE[lo] * (1 - f) + RIGHT_EDGE[hi] * f;
  return Math.max(x - MID, 0);
}

/* ---------------------------------------------------------- the safe area */

/**
 * How far content stays clear of the drawn edge, in viewBox units.
 *
 * Measured horizontally rather than along the normal, because that is the
 * direction in which a line of text actually runs out of room. Ten units is
 * 13.5px on the 540 card: enough that the timestamp does not appear to be
 * touching the bezel, small enough not to eat into the statement.
 */
const EDGE_MARGIN = 10;

/**
 * The vertical inset — how far below the top of the box the first row sits.
 *
 * §7.1 sets one figure at 13% for all four sides, which was written against
 * the full-strength bow. With the bow at 60% a uniform 13% boxes the content
 * into the middle of the card with dead space above and below the stack, and
 * the statement is supposed to be the largest thing on the card by a wide
 * margin. So the two axes are separated: vertically the shape's own edge bows
 * *outward*, which is room, and this keeps the old 8.5%. Horizontally the
 * corners pull *inward*, which is the opposite, and that side is measured off
 * the path per row rather than assumed — see safeSideInset.
 */
export const SAFE_INSET = 0.085;

/** The vertical inset in px for a card drawn at `size`. */
export function safeInset(size) {
  return Math.round(size * SAFE_INSET);
}

/**
 * The horizontal inset a band of content needs, in px, to clear the drawn edge
 * over the whole of its height.
 *
 * This is the fix for the class of bug that put the timestamp half off the
 * card. A single square inset cannot be right for every row: the corners pull
 * in by about a tenth of the box, so at the height where the top row sits the
 * shape is 158 units wide either side of centre, while at the vertical middle
 * it is 187. A row placed at 8.5% from the top and 8.5% from the side is asking
 * for 166 units of half-width at a height that has 158, and the eight units it
 * is over by are the ones the clip path throws away.
 *
 * Both ends of the band are checked because the half-width grows monotonically
 * toward the middle: whichever end is nearer the top or the bottom of the card
 * is the one that constrains it.
 *
 * @param {number} y0   band top, in px from the top of the card
 * @param {number} y1   band bottom, in px
 * @param {number} size the card's drawn size in px
 */
export function safeSideInset(y0, y1, size) {
  const k = SCREEN_VIEWBOX / size;
  const half = Math.min(screenHalfWidthAt(y0 * k), screenHalfWidthAt(y1 * k));
  return Math.ceil(((MID - half + EDGE_MARGIN) / SCREEN_VIEWBOX) * size);
}
