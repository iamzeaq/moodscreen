/**
 * The hero — CLAUDE.md §9.1 and §7.9.
 *
 * "Headline, subhead, and a **live editor**: the visitor types and the
 * Moodscreen builds in real time, colour changing with the mood. No 'create'
 * button. The CTA below is `Claim moodscreen.live/yourname`, which converts far
 * better because the work is already done."
 *
 * That is the entire argument for this section's shape. There is no gate
 * between arriving and having made something, so the ask at the bottom is not
 * "would you like to try this" — it is "you have made one, do you want to keep
 * it". Anything added between the headline and the field weakens that, which is
 * why the editor is exactly three controls: the statement, the mood, and the
 * surface. §7.2's two user choices, plus the one thing they are choosing about.
 *
 * The mood category picker and the suggestion list that used to live here are
 * gone. Categories were a second vocabulary competing with the ten moods, and a
 * suggestion list answers the headline's question on the visitor's behalf.
 *
 * This is the only centred section on the site (§5). Everything below it is
 * left-aligned or full-bleed, and that contrast is what stops the page reading
 * as a stack of centred boxes.
 */
import Moodscreen from "./Moodscreen.jsx";
import MoodStrip from "./editor/MoodStrip.jsx";
import StatementField from "./editor/StatementField.jsx";
import SurfaceControl from "./editor/SurfaceControl.jsx";
import { FaceField } from "./brand/FaceField.jsx";
import ClaimField from "./ClaimField.jsx";
import Button from "./ui/Button.jsx";
import { PLACEHOLDER_STATEMENT, useMoodscreen } from "../context/MoodscreenContext.jsx";

export default function Hero() {
  const {
    formValue,
    handleFormChange,
    moodscreenProps,
    storageHydrated,
    downloadPng,
    isExporting,
    downloadError,
  } = useMoodscreen();

  return (
    <section
      className="relative overflow-hidden px-4 pb-24 pt-28 [padding-top:calc(7rem+env(safe-area-inset-top))] sm:px-6"
      aria-labelledby="hero-heading"
    >
      {/* §9.1's face scatter. Behind everything, masked clear of the middle. */}
      <FaceField />

      <div className="relative z-10 mx-auto flex max-w-content flex-col items-center text-center">
        <h1
          id="hero-heading"
          className="max-w-[15ch] text-balance text-48 font-semibold text-fg sm:text-64"
        >
          What are you on right now?
        </h1>

        <p className="mt-4 max-w-[46ch] text-18 text-muted">
          Say what you&apos;re on. Post it anywhere. It stays live.
        </p>

        {/* The editor and its output, side by side above the fold on desktop
          * and stacked on a phone with the card first — seeing the thing you
          * are making is what makes typing into it feel like making. */}
        <div className="mt-12 flex w-full flex-col items-center gap-10 lg:mt-16 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
          <div className="order-1 shrink-0 lg:order-2">
            {/* Exactly the props the export nodes get — no local
              * substitutions. That is what makes the saved PNG the image on
              * screen rather than a near-miss of it. */}
            <Moodscreen
              {...moodscreenProps}
              width={360}
              className="max-w-full"
              /* Held back for the one frame before localStorage is read, so a
               * returning visitor never sees the default card flash past the
               * one they made. */
              style={{
                opacity: storageHydrated ? 1 : 0,
                transitionProperty: "opacity",
                transitionDuration: "var(--dur-enter)",
                transitionTimingFunction: "var(--ease)",
              }}
            />
          </div>

          <div className="order-2 flex w-full max-w-[440px] flex-col items-center gap-6 lg:order-1">
            <StatementField
              className="w-full"
              value={formValue.statement}
              onChange={(statement) => handleFormChange({ statement })}
              placeholder={PLACEHOLDER_STATEMENT}
            />

            <MoodStrip
              className="w-full"
              value={formValue.mood}
              onChange={(mood) => handleFormChange({ mood })}
            />

            <SurfaceControl
              value={formValue.surface}
              mood={formValue.mood}
              at={moodscreenProps.at}
              onChange={(surface) => handleFormChange({ surface })}
            />
          </div>
        </div>

        {/* §9.1 — the CTA is the claim, not a create button. The work above is
          * already done, so this asks for a name and nothing else.
          *
          * Download sits beside it because §1 is guest-first: "anyone can make
          * and share a Moodscreen with no account". The hero is where it gets
          * made, so it has to be where it can be taken away. The two are one
          * row and two different acts — claiming keeps the page, downloading
          * takes the image — and nothing about the claim should read as the
          * way to get the file. */}
        <ClaimField
          className="mt-14 w-full max-w-[420px]"
          secondaryAction={
            <Button
              variant="secondary"
              size="lg"
              onClick={downloadPng}
              loading={isExporting}
            >
              Download
            </Button>
          }
        />

        {downloadError ? (
          <p className="mt-4 max-w-[40ch] text-center text-13 text-danger" role="alert">
            {downloadError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
