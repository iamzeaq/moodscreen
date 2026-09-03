/**
 * The mood control, web edition — CLAUDE.md §7.9.
 *
 * §7.9 specifies a wheel for the app and a horizontal strip for the web:
 * "same data, same component, different control. A wheel needs circular mouse
 * movement and nobody enjoys that." This is the strip.
 *
 * Three things carry over from the wheel and are not negotiable:
 *
 *   - **Ten stops ordered by hue.** The order comes from the colours
 *     (`MOODS_BY_HUE`), not from the order §3 lists them in, so the strip reads
 *     as a spectrum and dragging it feels like turning a dial.
 *   - **The card updates during the drag, not on release.** Every pointer move
 *     that crosses a stop commits it. Waiting for pointerup would make the
 *     control feel like a form field, and the whole reason it is a scrub is
 *     that choosing a mood is meant to feel like looking, not like answering.
 *   - **Snap to the nearest stop.** Free-scrolling feels imprecise; detents
 *     feel like a dial. The index falls out of the pointer's position over the
 *     track, so it is snapped by construction rather than rounded afterwards.
 *
 * The stops are the screen in miniature — ten tiny Moodscreens — clipped to
 * §7.1's path rather than given a border-radius, because the bow cannot be
 * expressed as a radius and a row of rounded squares is a row of rounded
 * squares.
 */
import { useCallback, useMemo, useRef } from "react";
import Logo from "../brand/Logo.jsx";
import { SCREEN_CLIP } from "../brand/ScreenClip.jsx";
import { MOODS_BY_HUE, MOOD_IDS_BY_HUE, getMood } from "../../lib/moods.js";
import { inkFor } from "../../lib/color.js";

/**
 * The stops are fluid, not fixed: ten 40px chips plus gaps is 454px, which is
 * wider than the phone this is mostly used on. They share the track's width
 * and stop growing at 40, so the strip is the same control at every size.
 */
const STOP_MAX = 40;
const TRACK_MAX = STOP_MAX * 10 + 6 * 9;

/**
 * Unselected stops sit back rather than losing their colour — the strip is a
 * spectrum and a spectrum with eight greys in it is a list. This is far enough
 * back that the chosen one is unmistakable at a glance.
 */
const RESTING_OPACITY = 0.5;

export default function MoodStrip({
  value = "thinking",
  onChange = () => {},
  className = "",
  label = "Mood",
}) {
  const trackRef = useRef(null);
  const current = getMood(value) ?? MOODS_BY_HUE[0];
  const index = Math.max(0, MOOD_IDS_BY_HUE.indexOf(current.id));

  /** Which stop the pointer is over. Integral, so the snap is the geometry. */
  const pick = useCallback(
    (clientX) => {
      const el = trackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width <= 0) return;
      const t = (clientX - r.left) / r.width;
      const i = Math.min(
        MOOD_IDS_BY_HUE.length - 1,
        Math.max(0, Math.floor(t * MOOD_IDS_BY_HUE.length)),
      );
      const next = MOOD_IDS_BY_HUE[i];
      if (next !== value) onChange(next);
    },
    [onChange, value],
  );

  /**
   * Whether a scrub is in progress.
   *
   * Held in a ref rather than read back off `hasPointerCapture`. Capture is
   * still requested — it is what keeps a drag alive when a thumb slides off
   * the strip vertically, which on a phone is most drags — but it is an
   * enhancement, not the gate. `setPointerCapture` can fail (a pointer the
   * browser has already released, a synthetic event) and when the gate *was*
   * the capture, that failure silently turned the scrub into a tap: the first
   * stop committed and every move after it was dropped. Which is the exact
   * failure §7.9 is written against, since a control that only responds on
   * release is a form field with swatches on it.
   */
  const scrubbing = useRef(false);

  const onPointerDown = useCallback(
    (e) => {
      scrubbing.current = true;
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        /* Without capture the drag ends when the pointer leaves the track,
         * which is a smaller loss than not scrubbing at all. */
      }
      pick(e.clientX);
    },
    [pick],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!scrubbing.current) return;
      pick(e.clientX);
    },
    [pick],
  );

  const endScrub = useCallback(() => {
    scrubbing.current = false;
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      const n = MOOD_IDS_BY_HUE.length;
      let next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % n;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + n) % n;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = n - 1;
      if (next === null) return;
      e.preventDefault();
      onChange(MOOD_IDS_BY_HUE[next]);
    },
    [index, onChange],
  );

  const ink = useMemo(() => inkFor(current.siteColor), [current.siteColor]);

  return (
    <div className={["flex flex-col items-center gap-3", className].filter(Boolean).join(" ")}>
      {/* §7.9 — the readout the wheel puts in its centre: glyph and name, both
        * changing as you scrub. */}
      <p className="flex items-center gap-2 text-13 text-muted">
        <span style={{ color: current.siteColor, display: "inline-flex" }}>
          <Logo mood={current.id} size={18} />
        </span>
        <span className="text-fg">{current.label.toLowerCase()}</span>
      </p>

      <div
        ref={trackRef}
        role="radiogroup"
        aria-label={label}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onLostPointerCapture={endScrub}
        onKeyDown={onKeyDown}
        style={{ maxWidth: TRACK_MAX }}
        className={[
          "flex w-full touch-none select-none items-center gap-1.5 rounded-lg",
          "outline-none focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-4",
        ].join(" ")}
      >
        {MOODS_BY_HUE.map((m) => {
          const active = m.id === current.id;
          return (
            <span
              key={m.id}
              role="radio"
              aria-checked={active}
              aria-label={m.label}
              className="relative grid aspect-square min-w-0 flex-1 place-items-center"
              style={{
                clipPath: SCREEN_CLIP,
                background: m.siteColor,
                opacity: active ? 1 : RESTING_OPACITY,
                /* Opacity only — §6 animates transform and opacity, nothing
                 * else, and this control can be scrubbed at sixty frames. */
                transitionProperty: "opacity",
                transitionDuration: "var(--dur-hover)",
                transitionTimingFunction: "var(--ease)",
              }}
            >
              {/* The chosen stop wears its own face, in its own ink. That is
                * what makes it read as the Moodscreen you are making rather
                * than as a checked box. */}
              {active ? (
                <span style={{ color: ink, display: "inline-flex", width: "55%" }}>
                  {/* Sized in per cent because the stop is fluid; the stroke
                    * is set by hand for the same reason, since Logo picks it
                    * off a px `size` it no longer has. Stops top out at 40px,
                    * which is §8's "below 24px" case for the drawn mark. */}
                  <Logo mood={m.id} width="100%" height="100%" strokeWidth={3.6} />
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}
