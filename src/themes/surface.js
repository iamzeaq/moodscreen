/**
 * How a theme's `surface` turns a mood into the two colours the card needs:
 * what it is painted with, and what every piece of text on it is drawn in.
 *
 * Only three values exist, so this is a lookup rather than logic. Adding a
 * theme never comes here; adding a new *kind* of surface does.
 *
 * CLAUDE.md §3: large saturated fills bloom on dark screens, so the site
 * renders the mood at ~6% less chroma while the export keeps it full. That
 * is the only difference between what you see and what you post.
 */

/** `paper` — a warm off-white, the one surface that ignores the mood. */
export const PAPER = "#F2EFE6";

export function resolveSurface(theme, mood, { forExport = false } = {}) {
  const fill = forExport ? mood.color : mood.siteColor;

  switch (theme.surface) {
    /* The card is the mood's own ink; the type is the mood. Reads as neon. */
    case "ink":
      return { background: mood.ink, ink: fill, over: "dark" };

    /* Off-white stock, mood ink for type. The mood shows only in the glyph. */
    case "paper":
      return { background: PAPER, ink: mood.ink, over: "light" };

    /* The signature: mood fill, ink type. */
    case "mood":
    default:
      return { background: fill, ink: mood.ink, over: "light" };
  }
}
