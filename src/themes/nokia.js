/**
 * nokia — free. Silkscreen.
 *
 * The theme the shape is named after. Silkscreen comes from displays that only
 * ever had capitals, so `upper` is native to it rather than a style choice,
 * and it pairs with the scanline texture for the same reason.
 */
export const nokia = {
  id: "nokia",
  name: "Nokia",
  tier: "free",

  font: {
    family: '"Silkscreen", ui-monospace, "Courier New", monospace',
    faceFamily: "Silkscreen",
    weight: 400,
    case: "upper",
    tracking: "0.02em",
    lineHeight: 1.35,
    scale: [38, 30, 23, 18],
  },

  texture: "scanline",
};
