/**
 * Surface — CLAUDE.md §7.2 and §7.4.
 *
 * Every Moodscreen is a combination of exactly two things the user picks: a
 * mood, which owns the hue, and a surface, which owns how that hue is
 * arranged. Ten moods x three surfaces is thirty looks from two taps.
 *
 * Surface used to be a field on the theme. It is a user choice now, so it
 * arrives here as a value rather than being read off `theme` — a theme owns
 * type and nothing else (§7.7).
 *
 * Both neutrals below are fixed by the spec. Every *ink* is derived in OKLCH
 * from the mood's own hue: same hue family, clamped lightness, never
 * hand-picked. That is what makes an eleventh mood free and what makes the Pro
 * free-hue wheel work with no extra data.
 */
import { contrastRatio, hexToOklch, toneOf } from "../lib/color.js";

/** `ink` — near-black, per §7.2. Never pure #000; nothing sits darker. */
export const INK_SURFACE = "#0D0D10";

/** `paper` — bone. The one surface whose field ignores the mood. */
export const PAPER_SURFACE = "#F4F2EC";

export const SURFACES = [
  { id: "colour", label: "Colour" },
  { id: "ink", label: "Ink" },
  { id: "paper", label: "Paper" },
];

export const SURFACE_IDS = SURFACES.map((s) => s.id);

export const DEFAULT_SURFACE = "colour";

export function isSurfaceId(id) {
  return SURFACE_IDS.includes(id);
}

/**
 * Where each surface puts its ink, as OKLCH lightness plus a chroma ceiling.
 *
 * `colour` and `paper` want a dark tone of the hue; `ink` wants a lightened
 * one. The ceilings differ because a light tint carries chroma far better than
 * a dark one — the same 0.09 that keeps a dark tone from going neon leaves a
 * light tone looking washed.
 */
const INK_TONE = {
  colour: { l: 0.3, maxC: 0.09 },
  ink: { l: 0.8, maxC: 0.13 },
  paper: { l: 0.38, maxC: 0.1 },
};

/**
 * §7.4 — the card's tone shifts with the hour it was posted. Same hue
 * throughout; only lightness moves. Automatic, no toggle: the card is *of a
 * moment*, it isn't configured.
 */
const NIGHT_BANDS = [
  { id: "day", from: 6, to: 17, shift: 0 },
  { id: "evening", from: 17, to: 22, shift: -0.06 },
  { id: "night", from: 22, to: 6, shift: -0.14 },
];

export function bandFor(date) {
  const h = date instanceof Date && !Number.isNaN(date.valueOf()) ? date.getHours() : 12;
  return NIGHT_BANDS.find(({ from, to }) => (from < to ? h >= from && h < to : h >= from || h < to));
}

/**
 * How much of the band's shift a surface's field actually takes.
 *
 * The shift is written for the mood fill, which has the room for it. The two
 * neutral fields do not: `ink` is already near-black and a full −14% lands on
 * pure black, which §3 forbids outright, and `paper` at −14% stops being bone
 * and becomes a grey card. Both still move, so a 3am Moodscreen reads as one
 * on every surface — they just move at the rate their field can afford.
 */
const FIELD_SHIFT = { colour: 1, ink: 0.35, paper: 0.4 };

/**
 * How far down each field is allowed to go, whatever the hour.
 *
 * §7.4's −14% was written for the fill alone, before the ink was being derived
 * from the same hue. Taken literally it walks the darker moods into a band
 * where no dark tone of their own hue can stay readable on them — `creating`
 * and `offline` at 3am fall under 3:1 — and the ink has nowhere to go, because
 * §7.2 fixes its direction and §3 forbids reaching black. So the shift runs at
 * full strength until the field hits this floor and then stops. Every mood
 * still darkens visibly across the three bands; none of them darkens into
 * illegibility.
 */
const FIELD_MIN_L = { colour: 0.52, ink: 0, paper: 0.86 };

/**
 * The bar the ink search aims for, and the one it actually guarantees.
 *
 * 4.5:1 is the target and most combinations reach it. The saturated hues
 * cannot: violet, pink and red hold little luminance, so no dark tone of the
 * same hue clears 4.5 against them at any hour, and §7.2 does not allow
 * answering that with a light ink or an off-hue one. What every combination
 * does clear is 3:1, which is the bar that applies to the statement — it is
 * 30-50px on a 540px card, comfortably WCAG's large-text threshold, and the
 * statement is the only thing on the Moodscreen that has to survive a
 * thumbnail. `npm run check:contrast` walks all ninety combinations and fails
 * if any falls under it.
 *
 * The small metadata is the part this cannot carry, which is why the renderer
 * draws it at a stronger ink alpha on `colour` than on the two neutral fields.
 */
const MIN_CONTRAST = 4.5;

/** Verified across all ninety combinations by scripts/check-contrast.mjs. */
export const GUARANTEED_CONTRAST = 3;

/**
 * §3, absolutely: an ink is never black and never white. These are the bounds
 * the search below is allowed to move between.
 */
const INK_MIN_L = 0.18;
const INK_MAX_L = 0.93;

/**
 * Pull the ink away from its field until it clears MIN_CONTRAST.
 *
 * `offline` is the mood that forces this to exist: a mid grey has less room
 * between its fill and a dark tone of itself than any other hue, and deriving
 * blind lands it inside 3.5:1 — which is exactly what moods.js had to admit
 * about its hand-picked value. Checking every combination instead of
 * special-casing one mood is what §7.2 is asking for, and it is also what
 * guarantees the Pro hue wheel cannot land on a bad angle.
 *
 * The search only ever runs in the direction §7.2 specifies for that surface —
 * darker on `colour` and `paper`, lighter on `ink`. It never flips: a colour
 * card that answered a dark hour with light text would stop looking like the
 * surface the user picked, and surface is their choice, not the renderer's.
 * Where the whole range falls short, the best available is used.
 */
function ensureContrast(field, base, { l, maxC }) {
  const direction = l < 0.5 ? -1 : 1;
  let best = { ink: toneOf(base, l, maxC), ratio: 0 };

  for (let step = 0; step <= 20; step += 1) {
    const nextL = l + direction * step * 0.04;
    if (nextL < INK_MIN_L || nextL > INK_MAX_L) break;

    const ink = toneOf(base, nextL, maxC);
    const ratio = contrastRatio(ink, field);
    if (ratio >= MIN_CONTRAST) return ink;
    if (ratio > best.ratio) best = { ink, ratio };
  }

  return best.ink;
}

/**
 * @param {object}  args
 * @param {object}  args.mood      an entry from lib/moods.js
 * @param {string}  args.surface   'colour' | 'ink' | 'paper'
 * @param {Date}    [args.at]      when the Moodscreen was posted
 * @param {boolean} [args.forExport] full chroma rather than the site's −6%
 * @returns {{ background: string, ink: string, over: 'light'|'dark',
 *            surface: string, band: string }}
 */
export function resolveSurface({ mood, surface = DEFAULT_SURFACE, at, forExport = false }) {
  const id = isSurfaceId(surface) ? surface : DEFAULT_SURFACE;
  const band = bandFor(at instanceof Date ? at : new Date(at ?? Date.now()));

  /* §3: large saturated fills bloom on a dark screen, so the site renders the
   * mood at ~6% less chroma while the export keeps it full. The only
   * difference between what you see and what you post. */
  const hue = forExport ? mood.color : mood.siteColor;

  const field = { colour: hue, ink: INK_SURFACE, paper: PAPER_SURFACE }[id];
  const tone = INK_TONE[id];

  const shifted = band.shift
    ? toneOf(
        field,
        Math.max(hexToOklch(field).l + band.shift * FIELD_SHIFT[id], FIELD_MIN_L[id]),
        /* The mood fill keeps its chroma through the shift; the two neutral
         * fields have almost none to keep and must not acquire any. */
        id === "colour" ? 0.4 : 0.02,
      )
    : field;

  /* §7.4: at night the ink lightens to compensate for the darker field. On
   * `paper` it does the opposite — the field barely moved and a lighter ink
   * would only lose contrast. */
  const inkShift = band.id === "night" && id === "ink" ? 0.05 : 0;

  return {
    background: shifted,
    ink: ensureContrast(shifted, hue, { l: tone.l + inkShift, maxC: tone.maxC }),
    over: id === "ink" ? "dark" : "light",
    surface: id,
    band: band.id,
  };
}
