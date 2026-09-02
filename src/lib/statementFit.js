/**
 * Fitting the statement — CLAUDE.md §4.
 *
 * User text is unpredictable length. Step down by character count; do not
 * truncate and do not overflow. The sizes are for the card's 1x layout,
 * which is always 360x450 — that is what makes a fixed ladder possible at
 * all, and what makes the export a pure 3x scale of what is on screen.
 */

/** Hard cap on the input, so nothing lands below the smallest step. */
export const STATEMENT_MAX_CHARS = 180;

const LADDER = [
  { upTo: 42, size: 34 },
  { upTo: 80, size: 26 },
  { upTo: 130, size: 20 },
  { upTo: Infinity, size: 17 },
];

/** The ladder as data, for the kitchen sink and for tests. */
export const STATEMENT_STEPS = LADDER;

/**
 * @param {string} statement
 * @param {{ scale?: number }} [theme] the active theme's `font`
 * @returns {number} px, at 1x
 */
export function statementSize(statement, { scale = 1 } = {}) {
  const n = (statement ?? "").length;
  const step = LADDER.find((s) => n <= s.upTo) ?? LADDER[LADDER.length - 1];
  return Math.round(step.size * scale * 100) / 100;
}

/** Trim to the cap without cutting mid-word where it can be helped. */
export function clampStatement(statement) {
  const s = String(statement ?? "");
  if (s.length <= STATEMENT_MAX_CHARS) return s;
  const cut = s.slice(0, STATEMENT_MAX_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > STATEMENT_MAX_CHARS - 24 ? cut.slice(0, lastSpace) : cut;
}
