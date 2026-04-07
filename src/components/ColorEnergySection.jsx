/**
 * Section 3 — Color + Energy
 * Stat blocks + Moodscreen cards.
 */

import { MicroDecorSoft } from "./MicroDecor.jsx";
import StatusCard from "./StatusCard.jsx";

function StatBlock({ label, value, sub, tint }) {
  return (
    <div className="relative overflow-hidden rounded-card p-6">
      <div
        aria-hidden
        className="absolute inset-0 -z-0"
        style={{
          background: `radial-gradient(65% 80% at 20% 10%, ${tint.glow} 0%, transparent 55%), radial-gradient(60% 70% at 90% 70%, ${tint.glow2} 0%, transparent 55%)`,
          opacity: 1,
        }}
      />
      <div className="relative z-10">
        <div className="ds-meta uppercase tracking-[0.12em]">{label}</div>
        <div className="mt-2 text-5xl font-semibold tracking-tight text-primary sm:text-6xl">
          {value}
        </div>
        {sub ? <div className="mt-2 ds-body text-secondary">{sub}</div> : null}
      </div>
    </div>
  );
}

function CardPedestal({ children, accent }) {
  return (
    <div
      className={[
        "rounded-[2rem] bg-[#030303] p-3 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.38)] ring-1",
        accent ? accent : "ring-white/[0.06]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function ColorEnergySection() {
  return (
    <section
      className="relative border-t border-border overflow-hidden bg-gradient-to-br from-[#fff2d6] via-[#f4edff] to-[#dff3ff] py-16 sm:py-20"
      id="color-energy"
      aria-labelledby="color-energy-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-52 top-10 h-80 w-80 rounded-full bg-[#ffedd5]/80 blur-3xl opacity-50"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-52 top-20 h-80 w-80 rounded-full bg-[#e9d5ff]/65 blur-3xl opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#dbeafe]/60 blur-3xl opacity-35"
      />

      <MicroDecorSoft className="z-[1]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 lg:items-start">
          <div className="lg:col-span-5">
            <p className="ds-meta uppercase tracking-[0.12em] text-meta">
              color + energy
            </p>
            <h2
              id="color-energy-heading"
              className="mt-3 text-balance text-2xl font-semibold tracking-tight text-primary sm:text-3xl"
            >
              Build your vibe in seconds
            </h2>
            <p className="mt-3 ds-body">
              Bold energy, still calm. set your state and share.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
              <StatBlock
                label="ACTIVE NOW"
                value="5"
                sub="states active"
                tint={{ glow: "rgba(185, 74, 32, 0.28)", glow2: "rgba(255, 193, 122, 0.25)" }}
              />
              <StatBlock
                label="TODAY"
                value="3"
                sub="updates today"
                tint={{ glow: "rgba(124, 58, 237, 0.22)", glow2: "rgba(233, 213, 255, 0.28)" }}
              />
              <StatBlock
                label="THIS WEEK"
                value="12"
                sub="views this week"
                tint={{ glow: "rgba(59, 130, 246, 0.22)", glow2: "rgba(219, 234, 254, 0.28)" }}
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:pr-6">
                  <CardPedestal accent="ring-[#e8705c]/25">
                    <StatusCard
                      name="Amina Okoro"
                      initials="AO"
                      location="Lagos"
                      moodRows={[{ category: "🚀 building", quote: "Zipload" }]}
                      activeWithin48h
                      darkMode
                    />
                  </CardPedestal>
                </div>

                <div className="sm:pl-6 [transform:translateY(18px)]">
                  <CardPedestal accent="ring-violet-400/20">
                    <StatusCard
                      name="Leo Park"
                      initials="LP"
                      location="Seoul"
                      moodRows={[
                        { category: "🎧 listening", quote: "Frank Ocean · Blonde" },
                      ]}
                      activeWithin48h
                      darkMode
                    />
                  </CardPedestal>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 sm:flex sm:justify-end">
                <div className="w-full max-w-[420px] [transform:translateY(-10px)] sm:ml-auto">
                  <CardPedestal accent="ring-sky-400/20">
                    <StatusCard
                      name="Sofia Reyes"
                      initials="SR"
                      location="Remote"
                      moodRows={[
                        { category: "📊 working on", quote: "deep work · no meetings" },
                      ]}
                      activeWithin48h={false}
                      darkMode
                    />
                  </CardPedestal>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
