import { useEffect, useState } from "react";

/**
 * `prefers-reduced-motion: reduce`, as a value React can branch on.
 *
 * base.css already collapses every duration under this query, which covers the
 * three CSS moments of §6's budget. It cannot cover the fourth: the hero
 * Moodscreen joining the wall is scroll-linked, and CSS cannot switch off a
 * scroll listener that JS started — as base.css's own note says. The marquee is
 * the same problem from the other end, where the blanket rule would park the
 * track at its end position rather than stop it.
 *
 * Starts false and corrects on mount. Server-side and first paint get the
 * animated answer, which is the common case; the effect runs before anything
 * has moved far enough to matter.
 */
export default function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return reduced;
}
