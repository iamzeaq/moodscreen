/**
 * Moment 4 of §6's motion budget — "the hero Moodscreen scales down and joins
 * the wall on scroll — scroll-linked, the one heavy effect on the page."
 *
 * It is the only effect on the site that is allowed to cost something, and it
 * still spends that budget on `transform` and `opacity` alone. Nothing here
 * reads layout during a scroll: the two endpoints are measured once in
 * *document* coordinates and re-measured only when the document actually
 * changes shape, so a scroll frame is arithmetic and one style write.
 *
 * What it is not: a claim that the visitor's Moodscreen has been published. The
 * wall is real public Moodscreens (§9.3) and a guest's is not one of them, so
 * the card flies down to tile size and dissolves into the stream at the row's
 * leading edge rather than taking a slot in it. That is what makes the gesture
 * honest and it is also what makes it cheap — the target is a still anchor, not
 * a tile inside a track that is itself moving.
 *
 * Disabled outright under `prefers-reduced-motion`. base.css cannot do it: CSS
 * has no view of a scroll listener that JavaScript started, which is exactly the
 * caveat written into that file's own reduced-motion block.
 */
import { useEffect, useRef } from "react";
import Moodscreen from "../Moodscreen.jsx";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion.js";
import { useMoodscreen } from "../../context/MoodscreenContext.jsx";

/**
 * How much scrolling the flight takes, as a fraction of the viewport.
 *
 * Just under one screen. Shorter and the card snaps down; longer and it is
 * still travelling while the wall is already settled, which reads as a stray
 * element rather than as an arrival.
 */
const TRAVEL = 0.9;

/** The dissolve at the end, as a fraction of the flight. */
const FADE_OUT_FROM = 0.84;

/** And at the start, so a short page never pops it into view at full size. */
const FADE_IN_TO = 0.06;

/**
 * The width the clone is rendered at, and the divisor for every scale below.
 *
 * The hero's own card is drawn at 360 but its box is `max-w-full`, so on a
 * narrow phone the element on screen is narrower than that. Scaling from the
 * *measured* width over this constant rather than from 1 means the flight
 * starts at whatever size the hero card actually is, instead of jumping to 360
 * on exactly the screens where the difference shows.
 */
const CLONE_WIDTH = 360;

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const lerp = (a, b, t) => a + (b - a) * t;

/** Eased, so the card settles into the wall rather than arriving at speed. */
const smooth = (t) => t * t * (3 - 2 * t);

function measure(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return {
    x: r.left + window.scrollX,
    y: r.top + window.scrollY,
    w: r.width,
    h: r.height,
  };
}

export default function HeroJoin({ sourceRef, targetRef }) {
  const reduced = usePrefersReducedMotion();
  const { moodscreenProps } = useMoodscreen();
  const cloneRef = useRef(null);
  const boxRef = useRef({ from: null, to: null });

  useEffect(() => {
    if (reduced) return undefined;
    if (typeof window === "undefined") return undefined;

    const clone = cloneRef.current;
    const source = sourceRef?.current;
    const target = targetRef?.current;
    if (!clone || !source || !target) return undefined;

    let frame = 0;

    const remeasure = () => {
      boxRef.current = { from: measure(source), to: measure(target) };
    };

    const draw = () => {
      frame = 0;
      const { from, to } = boxRef.current;
      if (!from || !to) return;

      const vh = window.innerHeight;
      const end = Math.max(0, to.y + to.h / 2 - vh / 2);
      const start = Math.max(0, end - vh * TRAVEL);
      const span = end - start;

      const p = span <= 0 ? 0 : clamp01((window.scrollY - start) / span);

      /* Off at both ends: before the flight the hero card is simply itself, and
       * after it the wall is. Nothing is painted in either state. */
      if (p <= 0 || p >= 1) {
        clone.style.visibility = "hidden";
        source.style.opacity = "";
        return;
      }

      const e = smooth(p);
      const scale = lerp(from.w, to.w, e) / CLONE_WIDTH;
      const x = lerp(from.x, to.x, e);
      const y = lerp(from.y, to.y, e) - window.scrollY;

      const opacity =
        p < FADE_IN_TO
          ? p / FADE_IN_TO
          : p > FADE_OUT_FROM
            ? 1 - (p - FADE_OUT_FROM) / (1 - FADE_OUT_FROM)
            : 1;

      clone.style.visibility = "visible";
      clone.style.opacity = String(opacity);
      clone.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

      /* The original hands over rather than doubling: for most of the flight it
       * is above the viewport anyway, but on a short page or a wide one the two
       * would otherwise overlap. Written to a wrapper the hero itself never
       * styles, so a re-render cannot fight this. */
      source.style.opacity = "0";
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(draw);
    };

    const onResize = () => {
      remeasure();
      onScroll();
    };

    remeasure();
    draw();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    /* The page grows as fonts land and the wall's tiles size themselves, and
     * both endpoints move when it does. */
    const ro = new ResizeObserver(onResize);
    ro.observe(document.documentElement);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      if (source) source.style.opacity = "";
    };
  }, [reduced, sourceRef, targetRef]);

  if (reduced) return null;

  return (
    <div
      ref={cloneRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        /**
         * Behind the hero's own content, in front of everything else.
         *
         * The page is centred at the top and the wall is directly under it, so
         * there is no column the card can descend without crossing the claim
         * field and the CTA — on a 900px viewport the two are barely 300px
         * apart. Passing over them reads as a bug: a full-strength card parked
         * on the primary action with a button poking out from behind it.
         *
         * The hero's content sits at z-10 and the hero has no background of its
         * own, so a positioned layer at 5 flies *behind* the headline, the
         * editor and the CTA while still painting over every section below,
         * whose backgrounds are unpositioned. The card passes under the thing
         * you are being asked to do rather than over it, and nothing has to be
         * timed around anything.
         */
        zIndex: 5,
        pointerEvents: "none",
        visibility: "hidden",
        transformOrigin: "top left",
        willChange: "transform, opacity",
      }}
    >
      {/* The visitor's own Moodscreen. `live` is off: the breathing dot is the
        * one thing on the card that is already moving, and a second motion
        * inside something that is itself flying reads as a glitch. */}
      <Moodscreen {...moodscreenProps} width={CLONE_WIDTH} live={false} />
    </div>
  );
}
