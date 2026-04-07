/**
 * Section 4 — Final CTA: bento visual (left) + headline + signup
 */
import FinalCTABento from "./FinalCTABento.jsx";
import { MicroDecorSection, MicroSectionRule } from "./MicroDecor.jsx";
import SocialShareIconsStrip from "./SocialShareIconsStrip.jsx";
import SignupWidget from "./SignupWidget.jsx";

export default function FinalCTASection() {
  return (
    <section
      className="relative border-t border-border bg-[#f3f1ec] px-4 py-20 sm:px-6 sm:py-28"
      aria-labelledby="final-cta-heading"
    >
      <MicroDecorSection />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <FinalCTABento />
          </div>

          <div className="order-1 mx-auto flex w-full max-w-xl flex-col text-center lg:order-2 lg:col-span-5 lg:mx-0 lg:max-w-none lg:text-left">
            <h2
              id="final-cta-heading"
              className="text-balance text-4xl font-semibold tracking-tight text-primary sm:text-5xl"
            >
              a simple way to show what you&apos;re doing, thinking, and on
            </h2>
            <MicroSectionRule className="mt-5 w-full lg:justify-start" />
            <p className="mt-4 text-base leading-relaxed text-secondary">
              One screen for your mood, your tabs, your tempo — then share it anywhere.
            </p>

            <SocialShareIconsStrip className="mt-7 flex justify-center lg:justify-start" />

            <div className="mt-9 flex w-full justify-center lg:justify-start">
              <SignupWidget
                defaultLabel="create yours"
                align="center"
                className="max-w-full lg:mx-0"
              />
            </div>

            <p className="mt-4 ds-meta">minimal. shareable. yours.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
