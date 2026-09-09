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
 * Eyes, at rest: two vertical strokes on x 14.5 / 25.5, running y 8 to 18.
 *
 * Two numbers matter and they pull against each other. The stroke has to be
 * long enough to read as a line rather than a dot — a round-capped stroke is a
 * dot until it is comfortably longer than it is wide, and the ratio that counts
 * is the one at the smallest size the mark is drawn, 17px in the lockup, where
 * strokeFor bumps the stroke to 3.6. But it also has to *stop*, well clear of
 * the mouth, and that is the constraint the last attempt missed: at 12 units
 * the eyes ran to y 22, whose round cap ends at 23.5, which is exactly where
 * `building`'s mouth stroke begins. Eye and mouth fused into one continuous
 * stroke and the mark rendered as a capital U — not an upside-down face, but
 * not a face at all.
 *
 * So the pair moved up rather than growing down. 10 units at 2.8x the stroke
 * still reads as a line, and ending at y 18 leaves 4 units of clear ground
 * above the mouth. The gap is doing as much work as the length: it is what
 * makes two marks read as eyes over a mouth instead of as one glyph.
 */
const EYES_VERTICAL = ["M14.5 7 V17", "M25.5 7 V17"];

/**
 * `coding` lays the eyes down, on the vertical pair's centre line rather than
 * §8's y 16 — that figure was written when the eyes straddled it, and an eye
 * that lies down should not also drop 3 units down the face.
 */
const EYES_HORIZONTAL = ["M10 12 H19", "M21 12 H30"];

/**
 * The mouth table. The first five are transcribed from §8 verbatim.
 * The rest extend the spectrum in the same idiom — change them freely, each
 * is one path.
 */
/**
 * The mouth table.
 *
 * The curved mouths are inset one unit either side of §8's coordinates, so
 * they run x 16..24 against eyes at x 14.5 and 25.5. That single unit is what
 * stops the mark reading as a capital U at small sizes: a curve whose ends sit
 * directly beneath the eyes and turn up toward them is read by the eye as one
 * continuous stroke, and at 17px the gap between them is under three pixels —
 * far too little to argue otherwise. Pulling the ends inboard breaks the
 * alignment, and the two shapes separate at every size.
 *
 * The straight mouths need no such help and keep §8's figures exactly.
 */
const FACES = {
  building: { mouth: { d: "M16 25 Q20 29.5 24 25" } },
  thinking: { mouth: { d: "M15 27 H22" } },
  coding: { mouth: { d: "M15 27 H25" }, eyes: EYES_HORIZONTAL },
  speaking: { mouth: { circle: { cx: 20, cy: 27, r: 3 } } },
  offline: { mouth: { d: "M16 27 Q20 23.5 24 27" } },

  /* Extensions — not in §8. */
  creating: { mouth: { d: "M15 26 Q17.5 23.5 20 26 T25 26" } },
  hiring: { mouth: { d: "M16 25 Q20 30.5 24 25" } },
  available: { mouth: { d: "M16 26 Q20 28.5 24 26" } },
  learning: { mouth: { d: "M18 27 H25" } },
  traveling: { mouth: { d: "M16 28 L24 25" } },
};

const DEFAULT_MOOD = "thinking";

/* The drawn box inside the 40x40 viewBox, stroke caps included. Used by the
 * lockup to sit the mark on the wordmark's x-height rather than its cap. */
export const MARK_VIEWBOX = 40;
/** Eye top 7 less the round cap's 1.5. */
export const MARK_INK_TOP = 5.5;
/** `speaking`'s mouth circle reaches y 30; the cap adds 1.5. */
export const MARK_INK_BOTTOM = 31.5;
export const MARK_INK_HEIGHT = MARK_INK_BOTTOM - MARK_INK_TOP;

/** Stroke 3 at 40x40; bump to 3.6 below 24px or it thins out. */
function strokeFor(size) {
  return size < 24 ? 3.6 : 3;
}

export default function Logo({
  mood = DEFAULT_MOOD,
  size = 40,
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

  return (
    <svg
      viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}
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
