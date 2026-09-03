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
      className="relative bg-canvas"
      aria-labelledby="how-it-looks-heading"
    >
      <MicroDecorSection />
      <div className="relative z-10 mx-auto max-w-content px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-10">
          <div>
            {/* Left-aligned: §5 makes the hero the only centred section. */}
            <h2 id="how-it-looks-heading" className="max-w-xl text-balance text-34 font-semibold text-fg">
              This is what people are on
            </h2>
          </div>

          <MarqueeRow items={EXAMPLES} direction="left" duration={36} />
        </div>
      </div>
    </section>
  );
}
