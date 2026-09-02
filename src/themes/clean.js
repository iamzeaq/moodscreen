/**
 * clean — free. Switzer.
 *
 * The interface family doing display duty. It is the theme for someone who
 * wants the statement to read as a sentence rather than as a graphic, and the
 * only one where the card and the site are set in the same face.
 */
export const clean = {
  id: "clean",
  name: "Clean",
  tier: "free",

  font: {
    family: '"Switzer", ui-sans-serif, system-ui, sans-serif',
    faceFamily: "Switzer",
    weight: 600,
    case: "sentence",
    tracking: "-0.02em",
    lineHeight: 1.25,
    scale: [38, 30, 24, 19],
  },

  texture: "glyph",
};
