/**
 * Themes — CLAUDE.md §7.7.
 *
 * A theme owns **type only**. Colour belongs to the mood, surface belongs to
 * the user, and the chrome never changes. Getting that boundary right is what
 * lets forty themes still look like one product, and it is why there is no
 * `surface`, `radius` or colour field anywhere below.
 *
 * The schema:
 *
 *   id       string
 *   name     string        shown in the theme picker
 *   tier     'free' | 'pro'
 *   font     { family, faceFamily, weight, case, tracking, lineHeight, scale }
 *   texture  'scanline' | 'glyph'
 *
 * Every font field is necessary because typefaces are not interchangeable:
 *
 *   `case`   Silkscreen and Press Start 2P come from displays that only had
 *            uppercase, so caps is native to them. Instrument Serif depends on
 *            the contrast between capitals and lowercase, so caps destroys it.
 *            Pixel and mono themes uppercase; serif themes do not.
 *
 *   `scale`  four sizes, one per step of the §7.6 ladder. The font-size number
 *            sets the em box, not the letters inside it — Bebas Neue at 50 and
 *            Press Start 2P at 24 occupy the same space — so a single global
 *            ladder would overflow half the themes and shrink the rest.
 *
 * Adding a theme is adding one object to this folder and a line to the list
 * below. Nobody touches the renderer. If a new theme requires a renderer
 * change, the abstraction is wrong and the renderer is what needs fixing.
 *
 * Free tier is five, one of each kind. Pro adds from the licence-cleared list
 * — all OFL or Fontshare, all free to embed in a commercial product. Do not
 * ship Monument Extended or Editorial New; those need paid licences.
 */
import { classic } from "./classic.js";
import { clean } from "./clean.js";
import { impact } from "./impact.js";
import { nokia } from "./nokia.js";
import { terminal } from "./terminal.js";

export const THEME_LIST = [nokia, terminal, impact, classic, clean];

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

/** `upper` themes uppercase the statement; `sentence` themes leave it alone. */
export function applyCase(text, theme) {
  return theme?.font?.case === "upper" ? String(text ?? "").toUpperCase() : String(text ?? "");
}
