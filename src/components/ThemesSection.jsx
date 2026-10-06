/**
 * Themes — CLAUDE.md §9.5.
 *
 * "Horizontal scroller of real Moodscreens in each theme. The upsell is
 * aesthetic, so it must be seen, not tabulated. No pricing table."
 *
 * A table of what each tier includes would be the obvious build and the wrong
 * one. What Pro sells is how a Moodscreen looks (§1), and nobody has ever been
 * persuaded that something looks good by reading a row of ticks. So this section
 * is the argument itself: five finished Moodscreens, each wearing a different
 * typeface, and the theme's name under it. If the faces are not worth paying
 * for, no table was going to fix that.
 *
 * **The Moodscreens are real ones.** Each tile is a wall seed rendered exactly
 * as its own page renders it — same words, same mood, same surface, same theme.
 * Nothing here is a specimen assembled to flatter a typeface, and nothing has to
 * be kept in step with anything: the seeds already carry one of each theme,
 * because §9.3's list runs its mood, surface and theme cycles against each other
 * precisely so no two lines up twice.
 *
 * That does mean the five statements differ, which weakens the type comparison a
 * little — five identical sentences would isolate the typeface perfectly. It
 * would also be a specimen sheet rather than a wall of Moodscreens, and the
 * label under each tile already says which face you are looking at.
 *
 * A scroller, not a grid. §9's rhythm puts a scroller in this slot, and a
 * horizontal row that runs off the edge of a phone says "there are more of
 * these" in a way a wrapped grid of exactly five cannot.
 */
import Moodscreen from "./Moodscreen.jsx";
import ScreenDivider from "./brand/ScreenDivider.jsx";
import { WALL_SEEDS } from "../lib/wallSeeds.js";
import { THEME_LIST } from "../themes/index.js";

const TILE = 260;

/**
 * One real Moodscreen per theme, in the order themes are declared.
 *
 * The seeds cover every free theme, so this is a lookup rather than a
 * construction. A Pro theme added later will have no seed — §9.3's list is the
 * wall's content, not a fixture for this section — so it falls back to the first
 * seed's words wearing that theme, which is still a Moodscreen someone wrote
 * rather than lorem.
 */
const TILES = THEME_LIST.map((theme) => {
  const seed = WALL_SEEDS.find((s) => s.themeId === theme.id) ?? {
    ...WALL_SEEDS[0],
    themeId: theme.id,
  };
  return { theme, seed };
});

export default function ThemesSection() {
  return (
    <section id="themes" className="relative bg-canvas" aria-labelledby="themes-heading">
      <div className="mx-auto max-w-content px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl">
          <h2 id="themes-heading" className="text-balance text-34 font-semibold text-fg">
            The same words, in a different voice
          </h2>
          <p className="mt-3 text-18 text-muted">
            A theme changes the typeface and nothing else. The colour is still the
            mood you picked, and the shape is always the screen.
          </p>
          <ScreenDivider
            direction="up"
            depth={14}
            contained={false}
            className="mt-6 max-w-[160px]"
          />
        </div>

        {/* Runs off the right edge of a phone — the cut tile is what says there
          * is more of this. On a wide screen the content column is narrower than
          * the window, so the row simply ends inside it (§5). */}
        <div className="-mr-4 mt-12 overflow-x-auto overscroll-x-contain sm:-mr-6">
          <ul className="flex snap-x snap-mandatory gap-8 pb-4 pr-4 sm:pr-6">
            {TILES.map(({ theme, seed }) => (
              <li key={theme.id} className="shrink-0 snap-start">
                <Moodscreen {...seed} width={TILE} />

                {/* The label sits under its Moodscreen, left-aligned with it —
                  * a caption to the thing above, not a header for it. */}
                <div
                  className="mt-4 flex items-baseline gap-2"
                  style={{ width: TILE }}
                >
                  <span className="text-15 text-fg">{theme.name}</span>
                  {theme.tier === "pro" ? (
                    /* Marked, not gated. Someone scrolling this row should be
                      * able to see what Pro buys before being asked for
                      * anything — §9.5 is an argument, not a paywall. */
                    <span className="text-11 text-accent">Pro</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
