/**
 * classic — free. Instrument Serif.
 *
 * The one that does not shout. A serif depends on the contrast between its
 * capitals and its lowercase, so this is a `sentence` theme: uppercasing it
 * would flatten exactly the thing it is chosen for.
 */
export const classic = {
  id: "classic",
  name: "Classic",
  tier: "free",

  font: {
    family: '"Instrument Serif", ui-serif, Georgia, serif',
    /** The exact family name `document.fonts.load()` has to be given. */
    faceFamily: "Instrument Serif",
    weight: 400,
    case: "sentence",
    tracking: "-0.01em",
    lineHeight: 1.15,
    scale: [46, 36, 28, 22],
  },

  texture: "glyph",
};
