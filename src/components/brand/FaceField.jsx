/**
 * Face-mark backgrounds — the hero's scatter and the closing section's crop.
 *
 * Two sections carry these and the rest stay clean, which is the whole point:
 * a texture that appears everywhere stops being a texture and becomes the
 * background colour. The wall already shows real Moodscreens and the pulse
 * needs a clean field for its numbers, so neither gets one.
 *
 * Both are `<Logo mood>` — the §8 mark, not a decorative shape drawn to look
 * like it. Adding an eleventh mood changes these two backgrounds for free.
 */
import { useMemo } from "react";
import Logo from "./Logo.jsx";
import { MOOD_IDS_BY_HUE, accentForMood } from "../../lib/moods.js";

/**
 * A tiny deterministic generator.
 *
 * The layout has to be the same on every render and the same for every
 * visitor — `Math.random()` would reshuffle the background on each keystroke in
 * the hero, since typing re-renders the section around it. Seeded once at
 * module load, so the scatter is a fixed drawing that happens to be computed.
 */
function makeRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const COUNT = 20;

/**
 * §4's ladder does not apply to a graphic, so this is its own range — and it
 * is a range with a ceiling for the reason §7.3 spells out about the
 * watermark: past a certain size the mark stops grouping into a face and
 * becomes three separate bars a long way apart. The upper end here is where
 * the eyes and the mouth still read as one thing at a glance.
 */
const SIZE = { min: 60, max: 190 };

/**
 * Opacity runs 8-14%. Below 8 the mark stops being legible as a face and reads
 * as dirt on the screen; above 14 it competes with the headline, and the
 * headline has to win in a section whose entire job is one question.
 */
const OPACITY = { min: 0.08, max: 0.14 };

/** Slight, not jaunty. A mark tilted past this reads as a mistake. */
const TILT = 14;

/**
 * The marks sit on a ring rather than at free positions.
 *
 * The hero is the only centred section (§5) and its middle is the headline,
 * the subhead and the editor — the three things nothing may sit behind. A ring
 * with a jittered radius keeps every mark in the margins by construction,
 * which is more reliable than placing twenty of them by eye and rechecking at
 * every breakpoint. The mask below then guarantees it at any viewport.
 */
const RING = { min: 0.44, max: 0.62 };

const MARKS = (() => {
  const rand = makeRandom(0x5eed);
  const out = [];

  for (let i = 0; i < COUNT; i += 1) {
    /* Even spacing round the ring plus jitter, so it reads as scattered
     * without ever clumping into a gap the eye reads as a hole. */
    const angle = ((i + rand() * 0.7 - 0.35) / COUNT) * Math.PI * 2;
    const t = rand();
    const radius = RING.min + t * (RING.max - RING.min);

    /**
     * Size falls off with radius, so the big marks sit in the band just
     * outside the masked centre and the outermost ones are small.
     *
     * That is not a taste call. A 190px mark centred at 62% of the way to the
     * edge hangs off it, and `overflow-hidden` then cuts a face into a pair of
     * loose strokes — which is exactly the "rendering fault" read §7.3 rejects
     * cropping for. Small at the edges keeps every mark whole.
     */
    const size = Math.round(SIZE.max - t * (SIZE.max - SIZE.min));

    out.push({
      id: i,
      mood: MOOD_IDS_BY_HUE[i % MOOD_IDS_BY_HUE.length],
      size,
      left: 50 + Math.cos(angle) * radius * 92,
      top: 50 + Math.sin(angle) * radius * 74,
      rotate: Math.round((rand() * 2 - 1) * TILT),
      opacity: OPACITY.min + rand() * (OPACITY.max - OPACITY.min),
      /* Drift: tens of seconds, never the same two neighbours, and small
       * enough that you only notice it if you stop and look. */
      drift: {
        x: Math.round((rand() * 2 - 1) * 26),
        y: Math.round((rand() * 2 - 1) * 22),
        turn: Math.round((rand() * 2 - 1) * 5),
        duration: Math.round(34 + rand() * 38),
        delay: Math.round(rand() * -30),
      },
    });
  }

  return out;
})();

/**
 * The hero's scatter — CLAUDE.md §9.1.
 *
 * Twenty marks across the mood spectrum, drifting on `transform` only, behind
 * a mask that keeps the centre of the section clear whatever the viewport
 * does. `.face-drift` is the one place the four §6 durations do not apply:
 * this is ambient, measured in tens of seconds, and a 320ms version of it
 * would be exactly the scroll-stagger signature §6 bans.
 */
export function FaceField({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={["pointer-events-none absolute inset-0 overflow-hidden", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        /* The guarantee, rather than the intention: whatever the ring does at
         * a given width, nothing renders over the middle of the section. */
        maskImage:
          "radial-gradient(ellipse 44% 40% at 50% 46%, transparent 62%, #000 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 44% 40% at 50% 46%, transparent 62%, #000 100%)",
      }}
    >
      {MARKS.map((m) => (
        <span
          key={m.id}
          className="face-drift absolute"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            marginLeft: -m.size / 2,
            marginTop: -m.size / 2,
            color: accentForMood(m.mood),
            opacity: m.opacity,
            "--face-rot": `${m.rotate}deg`,
            "--face-rot-to": `${m.rotate + m.drift.turn}deg`,
            "--face-dx": `${m.drift.x}px`,
            "--face-dy": `${m.drift.y}px`,
            animationDuration: `${m.drift.duration}s`,
            animationDelay: `${m.drift.delay}s`,
          }}
        >
          <Logo mood={m.mood} size={m.size} />
        </span>
      ))}
    </div>
  );
}

/**
 * The closing section's mark — one, enormous, run off the page edge.
 *
 * §7.3 forbids cropping the mark, and this is not that rule being broken but
 * the other side of it. There the face is cut by the *screen's own edge*, a
 * boundary the card draws, so a cut face reads as a rendering fault inside a
 * finished object. Here the boundary is the browser window, which crops
 * everything on every page, so a form running off it reads as a form running
 * off it. The renderer's watermark stays whole; this one bleeds.
 *
 * Static, one mood, and off the **right** edge, because §9.6's content is
 * left-aligned like everything below the hero. Behind the copy it would be a
 * texture under text; in the empty half beside it, it is the section.
 *
 * How much runs off matters more than it sounds. The face has to stay
 * recognisable as a face — that is the whole idea, and it is the thing §7.3
 * records failing twice at large sizes, where the eyes and mouth end up far
 * enough apart to group into nothing. Cropping a third of it off the edge
 * takes an eye and produces three unrelated slabs. A sixth takes the outer cap
 * of one eye and leaves a face running out of frame, which is the intended
 * read; that is what CROP is.
 *
 * Nothing on this section moves. It is the last thing on the page and its job
 * is to hold still while someone types their name.
 */
const CROP = 0.16;

/**
 * Sized in CSS rather than in px, so one mark serves every width.
 *
 * "Enormous" is relative to the window it is in. 820px on a phone is not an
 * enormous mark, it is the only thing on the screen and the claim field is
 * sitting inside its left eye. The floor is where the drawn face still spans
 * most of a narrow viewport; the ceiling is the size asked for.
 */
export function FaceCrop({ mood = "thinking", size = 820, min = 420, className = "" }) {
  const colour = useMemo(() => accentForMood(mood), [mood]);
  const box = `clamp(${min}px, 72vw, ${size}px)`;

  return (
    <div
      aria-hidden="true"
      className={["pointer-events-none absolute inset-0 overflow-hidden", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className="absolute"
        style={{
          width: box,
          height: box,
          right: `calc(${box} * ${-CROP})`,
          top: "50%",
          marginTop: `calc(${box} / -2)`,
          color: colour,
          opacity: 0.1,
        }}
      >
        {/* Stroke set by hand: Logo reads it off a px `size` this no longer
          * has, and 3 is §8's figure for anything at or above 24px. */}
        <Logo mood={mood} width="100%" height="100%" strokeWidth={3} />
      </span>
    </div>
  );
}
