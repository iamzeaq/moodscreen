/**
 * OKLCH colour maths.
 *
 * CLAUDE.md §3: accent hover and press are derived by *lightness in OKLCH*,
 * not by opacity — opacity muddies against a dark canvas. Site-rendered mood
 * fills also drop ~6% chroma, which is a chroma move, not an alpha one.
 * Neither is expressible in CSS that ships everywhere today, so it happens
 * here and lands in the DOM as plain hex.
 */

const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

/** "#a1b2c3" | "#abc" -> [r, g, b] in 0..1 */
export function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** [r, g, b] in 0..1 -> "#a1b2c3" */
export function rgbToHex(rgb) {
  return `#${rgb
    .map((c) => Math.round(clamp(c, 0, 1) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** sRGB 0..1 -> OKLCH { l: 0..1, c: 0..~0.4, h: degrees } */
export function rgbToOklch([r, g, b]) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const c = Math.hypot(A, B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

/** OKLCH -> sRGB 0..1, unclamped (may fall outside the gamut) */
function oklchToRgbRaw({ l, c, h }) {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);

  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;

  return [
    linearToSrgb(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    linearToSrgb(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    linearToSrgb(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

const inGamut = (rgb) => rgb.every((v) => v >= -0.0001 && v <= 1.0001);

/**
 * OKLCH -> sRGB, gamut-mapped by pulling chroma in rather than clipping
 * channels. Clipping shifts hue; a yellow lightened past the gamut edge turns
 * green, which is exactly the failure a mood palette cannot afford.
 */
export function oklchToRgb(lch) {
  const target = { l: clamp(lch.l, 0, 1), c: Math.max(lch.c, 0), h: lch.h };
  const direct = oklchToRgbRaw(target);
  if (inGamut(direct)) return direct.map((v) => clamp(v, 0, 1));

  let lo = 0;
  let hi = target.c;
  for (let i = 0; i < 18; i += 1) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToRgbRaw({ ...target, c: mid }))) lo = mid;
    else hi = mid;
  }
  return oklchToRgbRaw({ ...target, c: lo }).map((v) => clamp(v, 0, 1));
}

export const hexToOklch = (hex) => rgbToOklch(hexToRgb(hex));
export const oklchToHex = (lch) => rgbToHex(oklchToRgb(lch));

/** The most chroma sRGB can hold at a given lightness and hue. */
function maxChroma(l, h) {
  let lo = 0;
  let hi = 0.45;
  for (let i = 0; i < 18; i += 1) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToRgbRaw({ l, c: mid, h }))) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * Shift lightness by an absolute OKLCH amount. `+0.08` is the spec's "+8%".
 *
 * Chroma is carried across as a *proportion* of what the gamut allows at the
 * new lightness, not as a fixed number. Holding chroma fixed looks right for
 * mid-tone hues and falls apart at the ends: hiring's yellow sits near the
 * top of the gamut already, so +8% lightness with fixed chroma has nowhere to
 * go but cream. Proportional chroma keeps it a brighter yellow, which is what
 * "hover lightens the fill" is supposed to mean.
 */
export function lighten(hex, dl) {
  const { l, c, h } = hexToOklch(hex);
  const ceiling = maxChroma(l, h);
  const ratio = ceiling > 0 ? Math.min(c / ceiling, 1) : 0;

  let nextL = clamp(l + dl, 0, 1);

  /**
   * Lightening past the top of a hue's gamut does not produce a lighter
   * version of the colour, it produces a pale wash of it — hiring's yellow
   * already sits near the sRGB ceiling, and a straight +8% turns it to cream.
   * So when lightening, stop at the highest lightness that still holds most
   * of the original chroma. The hover is smaller for those hues, which is
   * correct: there is less room above them.
   */
  if (dl > 0) {
    const floor = c * 0.85;
    if (maxChroma(nextL, h) < floor) {
      let lo = l;
      let hi = nextL;
      for (let i = 0; i < 16; i += 1) {
        const mid = (lo + hi) / 2;
        if (maxChroma(mid, h) >= floor) lo = mid;
        else hi = mid;
      }
      nextL = lo;
    }
  }

  return oklchToHex({ l: nextL, c: ratio * maxChroma(nextL, h), h });
}

/** Scale chroma. `0.94` is the ~6% drop mood fills take on the site. */
export function scaleChroma(hex, factor) {
  const lch = hexToOklch(hex);
  return oklchToHex({ ...lch, c: lch.c * factor });
}

/**
 * The same hue at an absolute OKLCH lightness, with chroma capped rather than
 * carried. This is how every surface ink is derived (CLAUDE.md §7.2): same hue
 * family, clamped lightness, never hand-picked. The cap is what keeps a dark
 * tone of a vivid hue from reading as a second saturated colour on the card.
 */
export function toneOf(hex, lightness, maxChromaAllowed) {
  const { c, h } = hexToOklch(hex);
  return oklchToHex({ l: clamp(lightness, 0, 1), c: Math.min(c, maxChromaAllowed), h });
}

/** WCAG relative luminance, for the contrast guard in themes/surface.js. */
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio, 1..21.
 *
 * Thirty mood x surface combinations times three night bands is ninety pairs
 * of colours that nobody is going to eyeball individually, so the ink
 * derivation checks itself against this rather than trusting the ladder.
 */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `rgb(r g b / a)` — used for tints and rings, where alpha is correct. */
export function withAlpha(hex, alpha) {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.round(c * 255));
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/**
 * A very dark tone from the colour's own hue family — never black, never
 * white. The same rule the mood cards use for their `ink` (CLAUDE.md §3),
 * applied to whatever colour is currently driving `--accent` so that text on
 * a filled accent button stays legible across all ten hues.
 */
export function inkFor(hex) {
  const { c, h } = hexToOklch(hex);
  return oklchToHex({ l: 0.28, c: Math.min(c * 0.85, 0.09), h });
}

/**
 * The four accent variables from CLAUDE.md §3, plus the two the components
 * need: an ink for text sitting on the fill, and the focus ring at 40%.
 */
export function accentVars(hex) {
  return {
    "--accent": hex,
    "--accent-hover": lighten(hex, 0.08),
    "--accent-press": lighten(hex, -0.08),
    "--accent-tint": withAlpha(hex, 0.14),
    "--accent-ring": withAlpha(hex, 0.4),
    "--accent-ink": inkFor(hex),
  };
}

/** Write the accent set onto an element (usually documentElement). */
export function applyAccent(el, hex) {
  if (!el) return;
  const vars = accentVars(hex);
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
}
