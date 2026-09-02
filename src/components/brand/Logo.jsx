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
 * Length matters more than it looks. These ran 5 units against a stroke of 3
 * to 3.6 with round caps, and a round-capped stroke only 1.4 times longer than
 * it is wide is a dot — which made the mark read as exactly the smiley §8
 * exists to avoid. At 9 units the stroke is three times its own width and
 * reads as the line it is meant to be.
 */
const EYES_VERTICAL = ["M14.5 11.5 V20.5", "M25.5 11.5 V20.5"];

/** `coding` lays the eyes down. Same centres, and long enough to read too. */
const EYES_HORIZONTAL = ["M11 16 H17", "M23 16 H29"];

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
/** Eye top 11.5 less the round cap's 1.5. */
export const MARK_INK_TOP = 10;
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
export const MARK_INK_LEFT = 9.5;
export const MARK_INK_RIGHT = 30.5;
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
