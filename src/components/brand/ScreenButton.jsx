/**
 * The primary button — CLAUDE.md §10, drawn as §7.1's screen.
 *
 * Not a pill. The outline is the brand: it comes out of the product name, and
 * a rounded rectangle beside it is the one shape on the page that could have
 * come from anywhere. So the primary action is the Moodscreen in miniature —
 * the same path, the same mood colour, the same face mark, at roughly 210x68.
 *
 * Nothing here is new geometry. The outline is `screenPathBox` fitted to the
 * button's box, the mark is `<Logo mood>` at the lockup's size, and the fill is
 * a mood from §3's spectrum. If any of those three ever needed a private copy,
 * the button would have stopped being the product's own shape.
 *
 * On hover it steps to the next mood round the §7.9 hue ring over 180ms — the
 * §6 state-change duration. That is the accent rule (§3) turned into an
 * invitation: the button is the thing whose colour you are about to choose.
 *
 * Six states, same as `<Button>`: rest, hover, active, focus-visible, disabled,
 * loading. What differs is how two of them are drawn. The focus ring cannot be
 * `outline` — an outline round a screen is a rectangle round a screen — so it
 * is a second copy of the path, stroked, sitting 2px outside. And hover
 * lightens nothing: it changes hue, which is the same promise (never a scale)
 * kept in the currency this button trades in.
 */
import { forwardRef, useEffect, useMemo, useState } from "react";
import Logo from "./Logo.jsx";
import { screenPathBox } from "../../lib/screen.js";
import { accentForMood, nextMoodId } from "../../lib/moods.js";
import { inkFor } from "../../lib/color.js";

/** §10's primary is 44px tall; this one is a screen, so it is a screen's shape. */
const REST = { width: 210, height: 68 };

/**
 * The ring's 2px sits 2px outside the fill, per §10. Both come out of the same
 * path stretched into a box 8px larger on each axis — which is what "offset"
 * means on a shape whose sides are curved, since there is no single direction
 * to push a bowed edge in.
 */
const RING_OUTSET = 4;

const ScreenButton = forwardRef(function ScreenButton(
  {
    /** The mood the button wears at rest. Usually the one currently in focus. */
    mood = "thinking",
    width = REST.width,
    height = REST.height,
    /** The face mark inside. 20px sits between the lockup's 17 and the label's 24. */
    markSize = 20,
    disabled = false,
    loading = false,
    type = "button",
    as: Tag = "button",
    className = "",
    children,
    style,
    ...rest
  },
  ref,
) {
  const inert = disabled || loading;

  /**
   * Each hover advances one stop, so hovering repeatedly walks the ring rather
   * than flipping between two colours. Rest is always the button's own mood.
   */
  const [hovered, setHovered] = useState(false);
  const [step, setStep] = useState(1);
  useEffect(() => setStep(1), [mood]);

  const shown = hovered && !inert ? nextMoodId(mood, step) : mood;
  const fill = accentForMood(shown);
  const ink = useMemo(() => inkFor(fill), [fill]);

  const d = useMemo(() => screenPathBox(width, height), [width, height]);
  const ringD = useMemo(
    () => screenPathBox(width + RING_OUTSET * 2, height + RING_OUTSET * 2),
    [width, height],
  );

  return (
    <Tag
      ref={ref}
      type={Tag === "button" ? type : undefined}
      disabled={Tag === "button" ? inert : undefined}
      aria-disabled={Tag === "button" ? undefined : inert || undefined}
      aria-busy={loading || undefined}
      onPointerEnter={() => {
        setHovered(true);
        setStep((s) => s + 1);
      }}
      onPointerLeave={() => setHovered(false)}
      className={[
        "group relative inline-flex shrink-0 select-none items-center justify-center",
        "cursor-pointer touch-manipulation bg-transparent p-0 outline-none",
        /* §10 — active is a 1px settle, never a scale. */
        "active:translate-y-px",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0",
        "aria-[busy=true]:cursor-progress aria-[busy=true]:active:translate-y-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width,
        height,
        transitionProperty: "transform",
        transitionDuration: "80ms",
        transitionTimingFunction: "var(--ease)",
        ...style,
      }}
      {...rest}
    >
      {/* The focus ring. Hidden until focus-visible; §10 says never removed. */}
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${width + RING_OUTSET * 2} ${height + RING_OUTSET * 2}`}
        className="pointer-events-none absolute opacity-0 group-focus-visible:opacity-100"
        style={{ inset: -RING_OUTSET }}
        width={width + RING_OUTSET * 2}
        height={height + RING_OUTSET * 2}
      >
        <path d={ringD} fill="none" stroke="var(--accent-ring)" strokeWidth="2" />
      </svg>

      {/* The screen itself. `fill` is the only thing that moves on hover. */}
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="pointer-events-none absolute inset-0"
      >
        <path
          d={d}
          fill={fill}
          style={{
            transitionProperty: "fill",
            transitionDuration: "var(--dur-state)",
            transitionTimingFunction: "var(--ease)",
          }}
        />
      </svg>

      <span
        className="relative z-10 inline-flex items-center gap-2 font-ui text-15 font-semibold"
        style={{
          color: ink,
          letterSpacing: "-0.01em",
          transitionProperty: "color",
          transitionDuration: "var(--dur-state)",
          transitionTimingFunction: "var(--ease)",
        }}
      >
        {/* §8 — the mark takes the mood the button is currently wearing. */}
        <Logo mood={shown} size={markSize} />

        {/* The label keeps its width while loading, so nothing reflows, and
          * the spinner sits exactly where the label was rather than off to
          * one side of a button that otherwise looks half-empty. */}
        <span className="relative inline-flex items-center">
          <span className={loading ? "invisible" : undefined}>{children}</span>
          {loading ? (
            <svg
              className="absolute left-1/2 h-4 w-4 -translate-x-1/2 animate-spin"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path
                d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : null}
        </span>
      </span>
    </Tag>
  );
});

export default ScreenButton;
