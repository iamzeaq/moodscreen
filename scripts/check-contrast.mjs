/**
 * Walks every mood x surface x hour combination and fails if the statement
 * would fall below the readable bar.
 *
 *   node scripts/check-contrast.mjs
 *
 * Ten moods, three surfaces and three night bands is ninety pairs of colours,
 * all of them derived rather than chosen (CLAUDE.md §7.2), which means nobody
 * is ever going to eyeball them individually. This is what stands in for that.
 * Run it after touching the mood spectrum, the surface derivation, or the
 * night bands — and it is what has to keep passing when the Pro hue wheel
 * starts handing in arbitrary angles.
 */
import { contrastRatio } from "../src/lib/color.js";
import { MOODS } from "../src/lib/moods.js";
import { GUARANTEED_CONTRAST, resolveSurface, SURFACE_IDS } from "../src/themes/surface.js";

/** One hour inside each band, so the band boundaries are exercised too. */
const HOURS = { day: 12, evening: 19, night: 3 };

const rows = [];

for (const mood of MOODS) {
  for (const surface of SURFACE_IDS) {
    for (const [band, hour] of Object.entries(HOURS)) {
      const at = new Date(2026, 0, 1, hour);
      const { background, ink, band: got } = resolveSurface({ mood, surface, at });

      if (got !== band) {
        console.error(`band mismatch: ${hour}:00 resolved as ${got}, expected ${band}`);
        process.exit(1);
      }

      rows.push({ mood: mood.id, surface, band, background, ink, ratio: contrastRatio(ink, background) });
    }
  }
}

const failures = rows.filter((r) => r.ratio < GUARANTEED_CONTRAST);
const worst = rows.reduce((a, b) => (b.ratio < a.ratio ? b : a));

for (const r of failures) {
  console.error(
    `FAIL ${r.mood}/${r.surface}/${r.band}  ${r.ink} on ${r.background}  ${r.ratio.toFixed(2)}:1`,
  );
}

console.log(`${rows.length} combinations checked`);
console.log(
  `worst: ${worst.mood}/${worst.surface}/${worst.band}  ${worst.ink} on ${worst.background}  ${worst.ratio.toFixed(2)}:1`,
);
console.log(`at or above 4.5:1: ${rows.filter((r) => r.ratio >= 4.5).length}/${rows.length}`);

if (failures.length) {
  console.error(`\n${failures.length} combination(s) under ${GUARANTEED_CONTRAST}:1`);
  process.exit(1);
}
