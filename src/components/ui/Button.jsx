/**
 * Button — CLAUDE.md §10.
 *
 * Six states, all specified: rest, hover, active, focus-visible, disabled,
 * loading. Most builds ship two and it shows.
 *
 *   Primary 44px tall, secondary 36px, radius 10px.
 *   Hover lightens the fill; it does not scale.
 *   Active translateY(1px) at 80ms.
 *   Focus-visible is a 2px accent ring at 40% alpha with 2px offset — never
 *   removed.
 *
 * One primary action per view. No gradient fills, no glow.
 */
import { forwardRef } from "react";

const VARIANTS = {
  /* Filled with the live accent. Text is an ink derived from the same hue, so
   * the label stays legible across all ten moods — white would fail on
   * hiring's yellow, black would look printed on thinking's violet. */
  primary: [
    "bg-accent text-[var(--accent-ink)]",
    "hover:bg-accent-hover",
    "active:bg-accent-press",
    "disabled:bg-accent disabled:text-[var(--accent-ink)]",
  ].join(" "),

  /* A raised surface, not an outline. Hover lightens the fill, same rule. */
  secondary: [
    "bg-panel text-fg border border-line",
    "hover:bg-overlay hover:border-line-strong",
    "active:bg-panel",
  ].join(" "),

  /* No fill at rest; the hover fill is the affordance. */
  ghost: [
    "bg-transparent text-muted border border-transparent",
    "hover:bg-panel hover:text-fg",
    "active:bg-raised",
  ].join(" "),
};

const SIZES = {
  /* 44px — primary. 36px — secondary. Radius 10px on both. */
  lg: "h-11 px-5 text-15",
  md: "h-9 px-[14px] text-13",
};

const DEFAULT_SIZE = { primary: "lg", secondary: "md", ghost: "md" };

const BASE = [
  "relative inline-flex select-none items-center justify-center gap-2",
  "rounded-md font-ui font-semibold whitespace-nowrap",
  "cursor-pointer touch-manipulation",
  /* Never removed. 2px accent ring at 40% alpha, 2px offset. */
  "outline-none focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2",
  /* Active is a 1px settle, never a scale. */
  "active:translate-y-px",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0",
  "aria-[busy=true]:cursor-progress aria-[busy=true]:active:translate-y-0",
].join(" ");

/**
 * Two properties, two speeds, named explicitly. Never `transition: all` —
 * it animates layout properties nobody asked for and drops frames on
 * mid-range Android.
 */
const TRANSITION = {
  transitionProperty: "background-color, border-color, color, transform",
  transitionDuration: "var(--dur-hover), var(--dur-hover), var(--dur-hover), 80ms",
  transitionTimingFunction: "var(--ease)",
};

function Spinner() {
  return (
    <svg
      className="absolute h-4 w-4 animate-spin"
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
  );
}

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size,
    loading = false,
    disabled = false,
    type = "button",
    as: Tag = "button",
    className = "",
    children,
    style,
    ...rest
  },
  ref,
) {
  const resolvedSize = size ?? DEFAULT_SIZE[variant] ?? "md";
  const inert = disabled || loading;

  return (
    <Tag
      ref={ref}
      type={Tag === "button" ? type : undefined}
      disabled={Tag === "button" ? inert : undefined}
      aria-disabled={Tag === "button" ? undefined : inert || undefined}
      aria-busy={loading || undefined}
      className={[BASE, VARIANTS[variant] ?? VARIANTS.primary, SIZES[resolvedSize], className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...TRANSITION, ...style }}
      {...rest}
    >
      {/* The label keeps its width while loading, so nothing reflows. */}
      <span className={`inline-flex items-center gap-2 ${loading ? "invisible" : ""}`}>
        {children}
      </span>
      {loading ? <Spinner /> : null}
    </Tag>
  );
});

export default Button;
