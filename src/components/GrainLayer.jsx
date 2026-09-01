/**
 * The grain layer — CLAUDE.md §7, texture move 1.
 *
 * Mounted once, at the app root. A tiled PNG at 7% opacity, never an SVG
 * filter: html-to-image does not reliably capture SVG filters, so a
 * filter-based grain vanishes from exports.
 *
 * `pointer-events: none`, below every interactive layer, never animated.
 * All of that lives in `.grain-layer` in src/styles/base.css.
 */
export default function GrainLayer() {
  return <div className="grain-layer" aria-hidden="true" />;
}
