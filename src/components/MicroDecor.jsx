/**
 * Layered monochrome backdrops — pointer-events none, decorative only.
 */

export function MicroDecorHero() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 ms-micro-orbs ms-micro-orbs--drift opacity-90" />
      <div className="absolute inset-0 ms-micro-mesh opacity-50" />
      <div className="absolute inset-0 ms-micro-dots opacity-[0.35]" />
    </div>
  );
}

export function MicroDecorSection() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 ms-micro-dots opacity-[0.28]" />
    </div>
  );
}

export function MicroDecorMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 ms-micro-mesh opacity-[0.4]" />
      <div className="absolute inset-0 ms-micro-dots opacity-[0.18]" />
    </div>
  );
}

/** For colored sections — neutral dots only, very light */
export function MicroDecorSoft({ className = "" }) {
  return (
    <div
      className={["pointer-events-none absolute inset-0 z-0 overflow-hidden", className].filter(Boolean).join(" ")}
      aria-hidden
    >
      <div className="absolute inset-0 ms-micro-dots opacity-[0.14]" />
    </div>
  );
}

/** Minimal corner brackets — use inside `relative` container */
export function MicroCornerFrame({ className = "" }) {
  return (
    <svg
      className={["pointer-events-none absolute inset-0 h-full w-full text-primary", className].join(" ")}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      preserveAspectRatio="none"
    >
      <path
        d="M0 40 L0 0 L40 0"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.11"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M360 0 L400 0 L400 40"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.11"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M400 360 L400 400 L360 400"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.11"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M40 400 L0 400 L0 360"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.11"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* MicroSectionRule is gone. A dot-line-dot ornament under a heading is a
 * horizontal rule with decoration on it, and nothing on this site separates
 * anything with a straight line any more — see components/brand/ScreenDivider. */
