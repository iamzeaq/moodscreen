/**
 * Section 2 — Example Moodscreen cards (how it looks).
 */

import { MicroDecorSection } from "./MicroDecor.jsx";
import Moodscreen from "./Moodscreen.jsx";
import { SAMPLE_MOODSCREENS } from "../lib/sampleMoodscreens.js";

const EXAMPLES = SAMPLE_MOODSCREENS.slice(0, 6);

/** Repeating vertical offsets so the marquee reads as a wave (still one horizontal line of travel). */
const MARQUEE_WAVE = [
  "-translate-y-4 sm:-translate-y-5",
  "translate-y-5 sm:translate-y-6",
  "-translate-y-2 sm:-translate-y-2.5",
  "translate-y-4 sm:translate-y-5",
  "-translate-y-5 sm:-translate-y-6",
  "translate-y-3 sm:translate-y-4",
  "-translate-y-1 sm:-translate-y-1.5",
  "translate-y-5 sm:translate-y-6",
];

function MovingCard({ ex, waveClass = "" }) {
  return (
    <article
      className={["w-[300px] shrink-0", waveClass]
        .filter(Boolean)
        .join(" ")}
    >
      <Moodscreen {...ex} width={300} />
    </article>
  );
}

function MarqueeRow({ items, direction = "left", duration = 32 }) {
  const loopItems = [...items, ...items];
  const className =
    direction === "right"
      ? "moodscreen-marquee-track moodscreen-marquee-track-right"
      : "moodscreen-marquee-track moodscreen-marquee-track-left";

  return (
    <div className="moodscreen-marquee-shell">
      <div className={className} style={{ animationDuration: `${duration}s` }}>
        {loopItems.map((ex, idx) => (
          <MovingCard
            key={`${ex.username}-${idx}`}
            ex={ex}
            waveClass={MARQUEE_WAVE[idx % MARQUEE_WAVE.length]}
          />
        ))}
      </div>
    </div>
  );
}

export default function HowItLooks() {
  return (
    <section
      id="how-it-looks"
      className="relative border-t border-border bg-gradient-to-b from-[#fbf7f2] via-[#f7f7f8] to-[#f0f0f2]"
      aria-labelledby="how-it-looks-heading"
    >
      <MicroDecorSection />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-10">
          <div>
            <h2
              id="how-it-looks-heading"
              className="mx-auto max-w-xl text-balance text-center text-2xl font-semibold tracking-tight text-primary sm:text-3xl"
            >
              this is what people are on
            </h2>
          </div>

          <MarqueeRow items={EXAMPLES} direction="left" duration={36} />
        </div>
      </div>
    </section>
  );
}
