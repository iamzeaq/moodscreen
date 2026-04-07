/**
 * Section 1 — Landing hero
 */

import FloatingBackground from "./FloatingBackground.jsx";
import { MicroCornerFrame, MicroDecorHero } from "./MicroDecor.jsx";
import SignupWidget from "./SignupWidget.jsx";

export default function Hero() {
  return (
    <section
      className="hero-section relative min-h-dvh overflow-x-hidden px-4 py-16 [padding-top:calc(4rem+env(safe-area-inset-top))] [padding-bottom:calc(4rem+env(safe-area-inset-bottom))] sm:px-6"
    >
      <MicroDecorHero />
      <FloatingBackground density={12} seed={7} className="z-[1] opacity-40" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <MicroCornerFrame className="hidden sm:block" />
        <div className="relative mx-auto max-w-3xl lg:mx-0 lg:max-w-none">
          <h1 className="mt-5 max-w-[22ch] text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-primary sm:text-5xl md:text-6xl lg:text-left">
            what are you on right now
          </h1>

          <p className="mt-4 max-w-[42ch] text-base leading-relaxed tracking-[-0.01em] text-secondary">
            a screen for your current state
          </p>

          <SignupWidget
            defaultLabel="create yours"
            className="mt-7 w-full max-w-full sm:w-auto"
          />
        </div>
      </div>
    </section>
  );
}
