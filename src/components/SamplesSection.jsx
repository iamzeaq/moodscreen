/**
 * Homepage — example moodscreen cards (explore / social proof).
 */

import { MicroDecorMesh, MicroSectionRule } from "./MicroDecor.jsx";
import StatusCard from "./StatusCard.jsx";

const SAMPLES = [
  {
    name: "Isaac Twekyard",
    initials: "IT",
    location: "Lagos",
    moodRows: [{ category: "🚀 building", quote: "something interesting" }],
    activeWithin48h: true,
  },
  {
    name: "Amina Okoro",
    initials: "AO",
    location: "Lagos",
    moodRows: [{ category: "📦 shipping", quote: "a quiet release" }],
    activeWithin48h: true,
  },
  {
    name: "Leo Park",
    initials: "LP",
    location: "Paris",
    moodRows: [{ category: "🎧 listening", quote: "Frank Ocean on repeat" }],
    activeWithin48h: true,
  },
  {
    name: "Sam Okonkwo",
    initials: "SO",
    location: "Remote",
    moodRows: [{ category: "📊 working on", quote: "deep work · no pings" }],
    activeWithin48h: false,
  },
  {
    name: "Rei Tanaka",
    initials: "RT",
    location: "Tokyo",
    moodRows: [{ category: "🧠 thinking", quote: "planning the next launch" }],
    activeWithin48h: true,
  },
  {
    name: "Sofia Reyes",
    initials: "SR",
    location: "Mexico City",
    moodRows: [{ category: "📝 writing", quote: "reading, writing, repeat" }],
    activeWithin48h: true,
  },
];

export default function SamplesSection() {
  return (
    <section
      id="samples"
      className="relative border-t border-border bg-surface px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="samples-heading"
    >
      <MicroDecorMesh />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-meta">
            Explore
          </p>
          <h2
            id="samples-heading"
            className="mt-3 text-balance text-2xl font-semibold tracking-tight text-primary sm:text-3xl"
          >
            What people are on
          </h2>
          <p className="mt-3 text-base leading-relaxed text-secondary">
            Same card everywhere — a live line on who you are and what you&apos;re on.
          </p>
          <MicroSectionRule className="mt-6" />
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 items-start gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {SAMPLES.map((s, i) => (
            <div key={`${s.name}-${i}`} className="flex justify-center">
              <StatusCard
                name={s.name}
                initials={s.initials}
                location={s.location}
                moodRows={s.moodRows}
                activeWithin48h={s.activeWithin48h}
                darkMode
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
