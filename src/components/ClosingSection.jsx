/**
 * The close — CLAUDE.md §9.6: "the claim field again, one line above it."
 *
 * One line, one field. Everything that could be argued has been argued by the
 * time anyone reaches the bottom of the page, so this is not a second pitch —
 * it is the same ask, put where someone who scrolled past it the first time
 * will meet it again.
 *
 * It carries the second of the two face-mark backgrounds: one enormous mark
 * run off the left edge of the window. The hero's twenty are scattered and
 * drifting because a hero is a field of possibilities; this is one, still, and
 * far too big to take in at once — which is the right note for the last thing
 * on the page.
 */
import ClaimField from "./ClaimField.jsx";
import { FaceCrop } from "./brand/FaceField.jsx";
import { useMoodscreen } from "../context/MoodscreenContext.jsx";

export default function ClosingSection() {
  const { moodscreenProps } = useMoodscreen();

  return (
    <section
      /* Tall enough that an 820px mark has somewhere to be. Below that the
       * face is cropped top and bottom as well as at the edge, and three cuts
       * turn it back into slabs. */
      className="relative flex min-h-[520px] items-center overflow-hidden px-4 py-24 sm:min-h-[720px] sm:px-6 sm:py-32"
      aria-labelledby="closing-heading"
    >
      {/* One mood, static, cropped by the window. It follows the Moodscreen
        * being edited, so the page ends on the colour it began on. */}
      <FaceCrop mood={moodscreenProps.mood} />

      {/* Left-aligned. §5: only the hero is centred, and a second centred
        * block at the bottom would make the page read as two hero sections
        * with content in between. */}
      <div className="relative z-10 mx-auto flex w-full max-w-content flex-col items-start">
        {/* §9.6 — one line above the field, and §2 fixes what it says. Not a
          * heading plus a supporting paragraph: everything worth arguing has
          * been argued by the time anyone is down here. */}
        {/* 24 on a phone: at 34 the URL is wider than a 390px viewport, and
          * this is the one line that must not wrap mid-domain. */}
        <h2 id="closing-heading" className="text-balance text-24 font-semibold text-fg sm:text-34">
          Claim moodscreen.live/yourname
        </h2>

        <ClaimField align="start" className="mt-8 w-full max-w-[420px]" />
      </div>
    </section>
  );
}
