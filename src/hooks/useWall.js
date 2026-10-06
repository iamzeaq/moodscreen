/**
 * The front page's two data reads — CLAUDE.md §9.2 and §9.3.
 *
 * Both live here rather than inside their sections because the landing page has
 * to know whether either section is going to draw *before* it lays the page
 * out: §9.7's dividers alternate down the page, and a section that hides itself
 * after the page has decided on directions leaves two arcs facing the same way.
 * So the page asks, and passes the answer down.
 */
import { useEffect, useState } from "react";
import { fetchPulse, fetchWallTiles, PULSE_MIN_TOTAL } from "../services/wallService.js";

/** Neither section flashes empty before its data lands; both start hidden. */
const IDLE = { data: null, ready: false };

function useAsync(fn) {
  const [state, setState] = useState(IDLE);

  useEffect(() => {
    let cancelled = false;
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, ready: true });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, ready: true });
      });
    return () => {
      cancelled = true;
    };
    /* `fn` is a module-level cached function and never changes identity. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

/**
 * §9.2 — the pulse, and whether it has earned its place on the page.
 *
 * "Hide the whole section below 200 live Moodscreens — a small number
 * advertises emptiness." That threshold is the whole visibility rule, and it is
 * checked here so the page can lay itself out around the answer.
 */
export function usePulse() {
  const { data, ready } = useAsync(fetchPulse);
  return {
    pulse: data,
    visible: ready && Boolean(data) && data.total >= PULSE_MIN_TOTAL,
  };
}

/**
 * §9.3 — the wall's tiles, and whether there are enough of them.
 *
 * "Handle the empty state by hiding the section." With the seeds in place this
 * is only reachable when a database is configured and answering with nothing,
 * but an empty wall is worse than no wall in exactly that case too.
 */
export function useWallTiles() {
  const { data, ready } = useAsync(fetchWallTiles);
  const tiles = Array.isArray(data) ? data : [];
  return { tiles, visible: ready && tiles.length > 0 };
}
