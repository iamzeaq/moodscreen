/**
 * classic — free.
 *
 * The mood colour carries the whole card and a serif does the talking. This
 * is the default and the one most Moodscreens will be, so it takes the
 * signature treatment: full mood fill, grain, and the mood's own glyph
 * blown up and cropped by the card edge.
 */
export const classic = {
  id: "classic",
  label: "Classic",
  tier: "free",

  font: {
    family: '"Instrument Serif", ui-serif, Georgia, serif',
    /** The exact family name `document.fonts.load()` has to be given. */
    faceFamily: "Instrument Serif",
    weight: 400,
    /** Multiplies the statement size the character-count scale picks. */
    scale: 1,
    tracking: "-0.01em",
  },

  surface: "mood",
  texture: "grain",
  glyph: "watermark",
  radius: 16,
};
