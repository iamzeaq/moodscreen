/**
 * terminal — free. JetBrains Mono.
 *
 * A working monospace rather than a decorative one. §12 forbids monospace as
 * decoration for small labels; this is the opposite case, where the whole
 * statement is set in it deliberately.
 */
export const terminal = {
  id: "terminal",
  name: "Terminal",
  tier: "free",

  font: {
    family: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    faceFamily: "JetBrains Mono",
    weight: 500,
    case: "upper",
    tracking: "0.01em",
    lineHeight: 1.4,
    scale: [31, 25, 20, 16],
  },

  texture: "scanline",
};
