/**
 * The section divider — the screen's own edge, not a horizontal rule.
 *
 * §9 asks the page to have a spine, and §12 bans the generic move. A 1px
 * horizontal rule is the most generic separator there is, and on this page it
 * is also wrong on its own terms: the product is a screen with bowed edges, so
 * the line between two sections should be one of those edges.
 *
 * `up` draws the top edge, so the section below it begins like a screen.
 * `down` draws the bottom edge, so the section above it ends like one.
 * Alternating the two down the page is what turns a list of sections into a
 * stack of screens; using one direction throughout just looks like a wave.
 *
 * The curve is `edgeCurvePath`, which is §7.1's first cubic with its ends
 * pinned to the box — the same coordinates the card is drawn from.
 *
 * Two numbers here are not free choices.
 *
 * It spans the **content column**, not the viewport. Run edge to edge at
 * 1440px the same rise reads as a line someone forgot to level, because an arc
 * is judged by its rise against its own width and 1440 is too wide for it.
 * Inside 1120 it reads as a curve, and it also lines up with everything else
 * on the page, which is what a divider is for.
 *
 * The **depth** is then set so the visible rise is the card's own ratio: §7.1's
 * top edge sags 2.88% of its width, which across the content column is 33px.
 * A cubic reaches three quarters of its control offset at the midpoint, so the
 * box is 44 and the curve inside it rises 33.
 */
import { useMemo } from "react";
import { edgeCurvePath } from "../../lib/screen.js";

/**
 * The box the curve is drawn into, in the SVG's own units. Only the ratio
 * matters — `preserveAspectRatio="none"` stretches it to whatever width the
 * container is, and `vectorEffect` keeps the stroke at 1px through that.
 */
const BOX = { width: 100, depth: 10 };

export default function ScreenDivider({
  /** `up` — the screen's top edge. `down` — its bottom. */
  direction = "up",
  /** Rendered depth. The curve's own visible rise is three quarters of this. */
  depth = 44,
  /**
   * Off for the small ornament under a heading, which is already inside a
   * column and wants to be as wide as whatever it is placed in.
   */
  contained = true,
  className = "",
  ...rest
}) {
  const d = useMemo(() => edgeCurvePath(BOX.width, BOX.depth, direction), [direction]);

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none w-full",
        contained ? "mx-auto max-w-content px-4 sm:px-6" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.depth}`}
        preserveAspectRatio="none"
        width="100%"
        height={depth}
        fill="none"
        style={{ display: "block" }}
      >
        <path
          d={d}
          stroke="var(--line)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
