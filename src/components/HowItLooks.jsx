/**
 * Section 2 — Example Moodscreen cards (how it looks).
 */

import { MicroDecorSection } from "./MicroDecor.jsx";
import StatusCard from "./StatusCard.jsx";

const EXAMPLES = [
  {
    key: "building",
    tag: "Founder",
    brand: "Zipload",
    name: "Isaac Twekyard",
    initials: "IT",
    location: "Lagos",
    moodRows: [{ category: "🚀 building", quote: "Zipload" }],
    activeWithin48h: true,
  },
  {
    key: "listening",
    tag: "Designer",
    brand: "Northline",
    name: "Marc Dubois",
    initials: "MD",
    location: "Paris",
    moodRows: [{ category: "🎧 listening", quote: "Frank Ocean on repeat" }],
    activeWithin48h: true,
  },
  {
    key: "reading",
    tag: "Writer",
    brand: "Quiet Studio",
    name: "Sam Okonkwo",
    initials: "SO",
    location: "Remote",
    moodRows: [{ category: "📖 reading", quote: "Deep Work · Cal Newport" }],
    activeWithin48h: true,
  },
  {
    key: "thinking",
    tag: "Creator",
    brand: "Signal Lab",
    name: "Rei Tanaka",
    initials: "RT",
    location: "Tokyo",
    moodRows: [
      { category: "🧠 thinking", quote: "Thinking through the next launch" },
    ],
    activeWithin48h: true,
  },
];

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
      className={["w-[min(100%,420px)] shrink-0", waveClass]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="rounded-full border border-border bg-white/70 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-secondary">
          {ex.tag}
        </span>
        <span className="text-[0.75rem] font-medium text-meta">{ex.brand}</span>
      </div>
      <div className="hover:[&_.status-card-ios]:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)]">
        <StatusCard
          name={ex.name}
          initials={ex.initials}
          location={ex.location}
          moodRows={ex.moodRows}
          activeWithin48h={ex.activeWithin48h}
          darkMode
        />
      </div>
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
            key={`${ex.key}-${idx}`}
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
