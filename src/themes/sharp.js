/**
 * sharp — free.
 *
 * The inverse of `classic`: the card is the mood's ink and the type is the
 * mood colour, so the same ten hues read as neon rather than as paint.
 * Clash Display at 600 with tight tracking, no watermark — the statement is
 * the only thing on it, which is the point.
 */
export const sharp = {
  id: "sharp",
  label: "Sharp",
  tier: "free",

  font: {
    family: '"Clash Display", ui-sans-serif, system-ui, sans-serif',
    faceFamily: "Clash Display",
    weight: 600,
    /* Clash sets a touch larger than Instrument Serif at the same px. */
    scale: 0.94,
    tracking: "-0.03em",
  },

  surface: "ink",
  texture: "grain",
  glyph: "inline",
  radius: 16,
};
