/**
 * Fitting the statement — CLAUDE.md §7.6.
 *
 * This returns an *index*, not a size. The renderer reads
 * `theme.font.scale[index]`, because the font-size number sets the em box and
 * not the letters inside it: Bebas Neue at 50 and Press Start 2P at 24 occupy
 * the same space. A single global ladder would overflow half the themes and
 * shrink the rest, so the four steps live in each theme and this only says
 * which of them a given statement earns.
 *
 * Short statements get bigger. That rewards punchiness without ever telling
 * anyone to be punchy.
 */

/**
 * Hard cap — §7.6. Five lines at the smallest step is the ceiling; past that
 * the type drops below what survives WhatsApp's compression and starts
 * crowding the lockup.
 */
export const STATEMENT_MAX_CHARS = 100;

/** Upper character bound of each step, in `theme.font.scale` order. */
const BREAKS = [20, 45, 75, STATEMENT_MAX_CHARS];

/** The ladder as data, for the kitchen sink and for tests. */
export const STATEMENT_STEPS = BREAKS;

/**
 * @param {string} statement
 * @returns {number} index into `theme.font.scale`, 0..3
 */
export function statementFit(statement) {
  const n = (statement ?? "").length;
  const i = BREAKS.findIndex((upTo) => n <= upTo);
  return i === -1 ? BREAKS.length - 1 : i;
}

/**
 * The px size for a statement under a theme. The renderer's one call.
 *
 * @param {string} statement
 * @param {{ scale?: number[] }} [font] the active theme's `font`
 * @returns {number} px, at the card's 1x layout size
 */
export function statementSize(statement, { scale } = {}) {
  const ladder = Array.isArray(scale) && scale.length ? scale : BREAKS.map(() => 24);
  const index = statementFit(statement);
  return ladder[Math.min(index, ladder.length - 1)];
}

/** Trim to the cap without cutting mid-word where it can be helped. */
export function clampStatement(statement) {
  const s = String(statement ?? "");
  if (s.length <= STATEMENT_MAX_CHARS) return s;
  const cut = s.slice(0, STATEMENT_MAX_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > STATEMENT_MAX_CHARS - 24 ? cut.slice(0, lastSpace) : cut;
}
