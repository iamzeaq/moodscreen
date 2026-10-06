/**
 * Moment 3 of §6's motion budget: "Pulse counters roll their digits vertically
 * when values change — 180ms."
 *
 * Each digit position is a column of the ten numerals, moved by a transform. So
 * the animation is transform-only, which is what §6 requires of anything that
 * has to survive a mid-range Android, and only the columns whose digit actually
 * changed appear to move — 199 to 200 rolls two of the three, which is what
 * makes it read as a counter rather than as a transition.
 *
 * Under `prefers-reduced-motion` this needs no special case. base.css collapses
 * the duration to nothing and the roll becomes the instant swap §6 asks for,
 * because the end state is the correct number either way. That is the whole
 * difference between this and the marquee, which the same rule would park at a
 * meaningless position.
 */

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * The digit column's height is set in `em` off the number's own font-size, so
 * the roll travels exactly one line whatever size the caller renders at.
 */
const LINE = 1;

function Column({ digit }) {
  const n = Number(digit);

  return (
    <span
      style={{
        display: "inline-block",
        height: `${LINE}em`,
        overflow: "hidden",
        verticalAlign: "baseline",
      }}
    >
      <span
        style={{
          display: "block",
          transform: `translateY(${-n * LINE}em)`,
          transitionProperty: "transform",
          transitionDuration: "var(--dur-state)",
          transitionTimingFunction: "var(--ease)",
        }}
      >
        {DIGITS.map((d) => (
          <span key={d} style={{ display: "block", height: `${LINE}em` }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function RollingNumber({ value = 0, className = "", ...rest }) {
  /* Grouped with a thin space rather than a comma: the separator is a reading
   * aid, and a comma at 64px is a mark the eye stops on. */
  const digits = String(Math.max(0, Math.floor(Number(value) || 0))).split("");
  const from = digits.length;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontVariantNumeric: "tabular-nums",
        lineHeight: LINE,
      }}
      {...rest}
    >
      {/* One reading of the number for anything not looking at it. The columns
        * beside this are ten numerals each, which is not something to hand to a
        * screen reader. */}
      <span className="sr-only">{Math.floor(Number(value) || 0)}</span>

      <span aria-hidden="true" style={{ display: "inline-flex", lineHeight: LINE }}>
        {digits.map((d, i) => {
          /* Thousands separator, counted from the right. */
          const remaining = from - i - 1;
          const space = remaining > 0 && remaining % 3 === 0;
          return (
            <span key={`${from}-${i}`} style={{ display: "inline-flex" }}>
              <Column digit={d} />
              {space ? <span style={{ width: "0.18em" }} /> : null}
            </span>
          );
        })}
      </span>
    </span>
  );
}
