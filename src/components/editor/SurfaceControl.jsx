/**
 * The surface control — CLAUDE.md §7.9: "Three small squares beneath the
 * wheel: colour, ink, paper."
 *
 * Squares, not screens. The mood strip above it is ten miniature Moodscreens
 * because a mood *is* the card's colour; a surface is the arrangement, and
 * drawing it as a second row of screens would make two different questions
 * look like one long answer. Squares read as swatches, which is what they are.
 *
 * Each square shows the field it actually produces, run through the same
 * `resolveSurface` the renderer uses — so `colour` follows the chosen mood and
 * `ink` is the lifted near-black rather than a guess at one. A swatch that
 * lies about its own result is worse than no swatch.
 */
import { useMemo } from "react";
import { getMood, MOODS } from "../../lib/moods.js";
import { SURFACES, resolveSurface } from "../../themes/surface.js";

export default function SurfaceControl({
  value = "colour",
  mood = "thinking",
  onChange = () => {},
  at,
  className = "",
  label = "Surface",
}) {
  const resolved = useMemo(() => {
    const m = getMood(mood) ?? MOODS[0];
    return Object.fromEntries(
      SURFACES.map((s) => [s.id, resolveSurface({ mood: m, surface: s.id, at })]),
    );
  }, [mood, at]);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={["flex items-center gap-2", className].filter(Boolean).join(" ")}
    >
      {SURFACES.map((s) => {
        const active = s.id === value;
        const look = resolved[s.id];
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s.id)}
            title={s.label}
            className={[
              "relative grid h-8 w-8 place-items-center rounded-sm",
              "cursor-pointer touch-manipulation",
              "outline-none focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2",
            ].join(" ")}
            style={{
              background: look.background,
              /* The selected square is ringed in its own ink rather than in
               * the accent: the accent is already this mood's colour, so on
               * `colour` an accent ring would vanish into the swatch. */
              boxShadow: active
                ? `inset 0 0 0 2px ${look.ink}`
                : "inset 0 0 0 1px var(--line-strong)",
              transitionProperty: "background-color, box-shadow",
              transitionDuration: "var(--dur-hover)",
              transitionTimingFunction: "var(--ease)",
            }}
          >
            <span className="sr-only">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
