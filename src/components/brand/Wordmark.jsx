/**
 * The lockup — CLAUDE.md §8.
 *
 * `moodscreen`, lowercase, one word, tracking -0.03em, Switzer Semibold.
 * The mark's height is locked to the wordmark's x-height, not its cap height,
 * so the face reads as a letter in the word rather than a badge beside it.
 *
 * The geometry, since it is easy to get wrong by eye:
 *   the drawn face occupies 19.5 of the 40-unit viewBox, so to make the *ink*
 *   one x-height tall the svg box has to be 40/19.5 x-heights, and the box
 *   then has to slide down until the ink's bottom edge lands on the baseline.
 */
import Logo, { MARK_INK_BOTTOM, MARK_INK_HEIGHT, MARK_VIEWBOX } from "./Logo.jsx";

/** Switzer's x-height, in em. */
const X_HEIGHT = 0.5;

const BOX_EM = (X_HEIGHT * MARK_VIEWBOX) / MARK_INK_HEIGHT;
const BASELINE_DROP_EM = ((MARK_VIEWBOX - MARK_INK_BOTTOM) / MARK_VIEWBOX) * BOX_EM;

export default function Wordmark({
  mood = "thinking",
  size = 24,
  markOnly = false,
  /**
   * `accent` — the mark carries the live accent, the word carries text.
   * `current` — both inherit, for when the lockup sits on a mood fill and
   *             has to be drawn in that card's ink.
   */
  tone = "accent",
  className = "",
  ...rest
}) {
  return (
    <span
      className={`inline-flex items-baseline ${tone === "accent" ? "text-fg" : ""} ${className}`}
      style={{ fontSize: size, gap: "0.3em" }}
      {...rest}
    >
      <Logo
        mood={mood}
        size={size}
        style={{
          width: `${BOX_EM}em`,
          height: `${BOX_EM}em`,
          transform: `translateY(${BASELINE_DROP_EM}em)`,
          color: tone === "accent" ? "var(--accent)" : "currentColor",
          flex: "none",
        }}
      />
      {markOnly ? (
        <span className="sr-only">moodscreen</span>
      ) : (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          moodscreen
        </span>
      )}
    </span>
  );
}
