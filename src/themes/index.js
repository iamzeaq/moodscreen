/**
 * Themes — CLAUDE.md §7.
 *
 * A theme is data, not a component. Adding one is a file in this folder and
 * a line in the list below; if it ever requires touching `<Moodscreen>`, the
 * abstraction is wrong and the renderer is what needs fixing, not the theme.
 *
 * The schema:
 *
 *   id       string
 *   label    string        shown in the theme picker
 *   tier     'free' | 'pro'
 *   font     { family, faceFamily, weight, scale, tracking }
 *   surface  'mood' | 'ink' | 'paper'      see ./surface.js
 *   texture  'grain' | 'none' | 'halftone'
 *   glyph    'watermark' | 'inline' | 'none'
 *   radius   number (px, at the card's 1x layout size)
 *
 * `scale` lives in the theme because pixel fonts render cleanly only at exact
 * multiples of their design grid, so `pixel` will need its own size ladder
 * rather than the shared character-count one.
 *
 * Free: classic, sharp.
 * Pro (not built yet): terminal (Departure Mono), pixel (Silkscreen),
 * anime (Bebas Neue).
 */
import { classic } from "./classic.js";
import { sharp } from "./sharp.js";

export const THEME_LIST = [classic, sharp];

export const THEMES = Object.fromEntries(THEME_LIST.map((t) => [t.id, t]));

export const DEFAULT_THEME_ID = classic.id;

export const FREE_THEMES = THEME_LIST.filter((t) => t.tier === "free");
export const PRO_THEMES = THEME_LIST.filter((t) => t.tier === "pro");

export function getTheme(id) {
  return THEMES[id] ?? THEMES[DEFAULT_THEME_ID];
}

export function isThemeId(id) {
  return typeof id === "string" && Object.hasOwn(THEMES, id);
}
