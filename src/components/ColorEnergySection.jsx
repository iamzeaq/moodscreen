/**
 * A placeholder standing where §9.2's pulse goes.
 *
 * Session 4 replaces this with the real thing: one cached aggregate query, a
 * big live count, the breakdown as a mood-coloured bar beneath it, digits
 * rolling on change, and the whole section hidden below 200 live Moodscreens
 * because a small number advertises emptiness.
 *
 * What it is not any more is the light-ground, blur-orb, "build your vibe"
 * block it was. Every part of that broke a rule the redesign is built on — a
 * cream gradient behind cards §3 says need a quiet ground, glow §12 bans
 * outright, and body copy that could have come from any launch page. It is
 * cut back to the shape session 4 will fill rather than restyled, so nobody
 * mistakes it for finished work.
 *
 * §9.2 also fixes the alignment: left, in a wide band. The hero is the only
 * centred section on the site.
 */
import Moodscreen from "./Moodscreen.jsx";
import { SAMPLE_MOODSCREENS } from "../lib/sampleMoodscreens.js";

/** Placeholder figures. Session 4 replaces these with the aggregate query. */
const STATS = [
  { label: "Live right now", value: "—" },
  { label: "Updated today", value: "—" },
  { label: "Moods in play", value: "10" },
];

export default function ColorEnergySection() {
  return (
    <section
      className="relative bg-canvas px-4 py-16 sm:px-6 sm:py-20"
      id="color-energy"
      aria-labelledby="color-energy-heading"
    >
      <div className="mx-auto grid max-w-content grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <h2
            id="color-energy-heading"
            className="max-w-[20ch] text-balance text-34 font-semibold text-fg"
          >
            Ten moods, three surfaces, thirty looks
          </h2>
          <p className="mt-3 max-w-[46ch] text-18 text-muted">
            Two taps decide all of it. The colour means something — violet is always
            thinking, red is always speaking — so a Moodscreen reads before it is read.
          </p>

          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <dd className="text-48 font-semibold text-fg tabular-nums">{s.value}</dd>
                <dt className="mt-1 text-13 text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-7">
          {SAMPLE_MOODSCREENS.slice(0, 2).map((s) => (
            <div key={s.username} className="flex justify-center">
              <Moodscreen {...s} width={300} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
