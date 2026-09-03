/**
 * Homepage — example moodscreen cards (explore / social proof).
 */

import { MicroDecorMesh } from "./MicroDecor.jsx";
import ScreenDivider from "./brand/ScreenDivider.jsx";
import Moodscreen from "./Moodscreen.jsx";
import { SAMPLE_MOODSCREENS } from "../lib/sampleMoodscreens.js";

const SAMPLES = SAMPLE_MOODSCREENS.slice(0, 6);

export default function SamplesSection() {
  return (
    <section
      id="samples"
      className="relative bg-surface px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="samples-heading"
    >
      <MicroDecorMesh />
      <div className="relative z-10 mx-auto max-w-content">
        {/* §12 — no all-caps eyebrow above the heading, and §2 — the object is
          * a Moodscreen, never a card. */}
        <div className="max-w-2xl">
          <h2 id="samples-heading" className="text-balance text-34 font-semibold text-fg">
            One Moodscreen, everywhere you post it
          </h2>
          <p className="mt-3 text-18 text-muted">
            The image you share and the page it points at are the same thing, and both
            stay current.
          </p>
          {/* The ornament under the heading is the screen's edge too — a
            * dot-line-dot rule is a horizontal rule wearing a hat. */}
          <ScreenDivider direction="up" depth={14} contained={false} className="mt-6 max-w-[160px]" />
        </div>

        <div className="mt-10 grid grid-cols-1 items-start justify-items-center gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {SAMPLES.map((s) => (
            <div key={s.username} className="flex justify-center">
              <Moodscreen {...s} width={300} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
