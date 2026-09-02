/**
 * The mark — CLAUDE.md §8.
 *
 * A three-stroke line face. Two vertical strokes for eyes, one for the mouth.
 * Vertical eyes, not dots: dots plus a curve is a smiley, and smileys are the
 * most exhausted mark in software.
 *
 * It is a component with a `mood` prop, not a static file. Eyes never move
 * except for `coding`, where they lie down; only the mouth changes. Adding a
 * mood is one entry in FACES, not a new logo.
 */

/**
 * Eyes, at rest: two vertical strokes centred on x 14.5 / 25.5, y 16.
 *
 * Length is the whole of whether this reads as §8's line face or as the smiley
 * §8 exists to avoid, and it has been got wrong twice. A round-capped stroke is
 * a dot until it is comfortably longer than it is wide, and the ratio that
 * matters is not the one in these units — it is the one on screen at the
 * smallest size the mark is drawn, which is 17px in the lockup. There the
 * stroke is bumped to 3.6 (see strokeFor), so 9 units was 2.5x its own width
 * and still read as a dot; with a curved mouth under it the whole mark read as
 * a smiley. At 12 units it is 3.3x, which holds up at 17px and at 300.
 */
const EYES_VERTICAL = ["M14.5 10 V22", "M25.5 10 V22"];

/**
 * `coding` lays the eyes down. Same centres, and they have to earn the same
 * ratio — a short horizontal stroke is just as much a dot as a short vertical
 * one. 9 units rather than the eyes' 12 because at 12 the two would meet in
 * the middle of the face.
 */
const EYES_HORIZONTAL = ["M10 16 H19", "M21 16 H30"];

/**
 * The mouth table. The first five are transcribed from §8 verbatim.
 * The rest extend the spectrum in the same idiom — change them freely, each
 * is one path.
 */
const FACES = {
  building: { mouth: { d: "M15 25 Q20 30 25 25" } },
  thinking: { mouth: { d: "M15 27 H22" } },
  coding: { mouth: { d: "M15 27 H25" }, eyes: EYES_HORIZONTAL },
  speaking: { mouth: { circle: { cx: 20, cy: 27, r: 3 } } },
  offline: { mouth: { d: "M15 27 Q20 23 25 27" } },

  /* Extensions — not in §8. */
  creating: { mouth: { d: "M14 26 Q17 23 20 26 T26 26" } },
  hiring: { mouth: { d: "M15 25 Q20 31 25 25" } },
  available: { mouth: { d: "M15 26 Q20 29 25 26" } },
  learning: { mouth: { d: "M18 27 H25" } },
  traveling: { mouth: { d: "M15 28 L25 25" } },
};

const DEFAULT_MOOD = "thinking";

/* The drawn box inside the 40x40 viewBox, stroke caps included. Used by the
 * lockup to sit the mark on the wordmark's x-height rather than its cap. */
export const MARK_VIEWBOX = 40;
/** Eye top 10 less the round cap's 1.5. */
export const MARK_INK_TOP = 8.5;
/** `speaking`'s mouth circle reaches y 30; the cap adds 1.5. */
export const MARK_INK_BOTTOM = 31.5;
export const MARK_INK_HEIGHT = MARK_INK_BOTTOM - MARK_INK_TOP;

/**
 * The horizontal bounds too, so the face can be addressed as a face.
 *
 * The 40-unit viewBox is mostly empty margin — the drawn face sits inside
 * about half of it — which makes any offset computed against the box wildly
 * unfaithful to where the features actually are. Anything that needs to
 * position the face against something else (the watermark cropping itself on
 * the screen edge) works in these bounds via `tight`, where 0..1 of the box is
 * 0..1 of the face and a crop at 55% really does land between the eyes.
 *
 * These are the union across every mood, not the current one, so the framing
 * does not jump when the mood cross-fades. `coding` is the widest, being the
 * only mood that lays its eyes down.
 */
export const MARK_INK_LEFT = 8.5;
export const MARK_INK_RIGHT = 31.5;
export const MARK_INK_WIDTH = MARK_INK_RIGHT - MARK_INK_LEFT;

/** Stroke 3 at 40x40; bump to 3.6 below 24px or it thins out. */
function strokeFor(size) {
  return size < 24 ? 3.6 : 3;
}

export default function Logo({
  mood = DEFAULT_MOOD,
  size = 40,
  /**
   * Crop the viewBox to the face's own bounds instead of the 40-unit box, so
   * the element *is* the face. Callers that need to position features rather
   * than an element want this; everything else wants the padded box, which is
   * what keeps the mark optically centred beside text.
   */
  tight = false,
  /** Explicit box, for `tight`, where the face is not square. */
  width,
  height,
  strokeWidth,
  title,
  className = "",
  style,
  ...rest
}) {
  const face = FACES[mood] ?? FACES[DEFAULT_MOOD];
  const eyes = face.eyes ?? EYES_VERTICAL;
  const stroke = strokeWidth ?? strokeFor(size);

  const viewBox = tight
    ? `${MARK_INK_LEFT} ${MARK_INK_TOP} ${MARK_INK_WIDTH} ${MARK_INK_HEIGHT}`
    : `0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`;

  return (
    <svg
      viewBox={viewBox}
      width={width ?? size}
      height={height ?? size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      style={style}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {eyes.map((d) => (
        <path key={d} d={d} />
      ))}
      {face.mouth.circle ? (
        <circle
          cx={face.mouth.circle.cx}
          cy={face.mouth.circle.cy}
          r={face.mouth.circle.r}
        />
      ) : (
        <path d={face.mouth.d} />
      )}
    </svg>
  );
}

export const LOGO_MOODS = Object.keys(FACES);
