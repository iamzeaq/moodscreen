/**
 * The width to draw a Moodscreen at, measured rather than guessed.
 *
 * §7 scales the card with a transform on a node that always lays out at 540, so
 * `width` is not a CSS width that can be `100%` — it is the number the scale is
 * computed from. Hand it a number larger than the column it sits in and the
 * scaled node overflows its own box: `max-w-full` caps the *box* and the drawn
 * card runs straight past it. Inside a section with `overflow-hidden` that reads
 * as a card with its right edge sliced off; anywhere else it is a page that
 * scrolls sideways on a phone.
 *
 * So the column is measured and the number follows it, capped at the size the
 * design wants on a screen with room.
 *
 * Measured in a layout effect, before paint, so there is no frame at the wrong
 * size on the way to the right one. The ref is a callback ref rather than a ref
 * object because the node is often inside a branch that only renders once data
 * has arrived — an effect keyed on anything else would run while there is
 * nothing to measure and never run again.
 *
 *   const [ref, width] = useFittedWidth(420);
 *   <div ref={ref} className="w-full" style={{ maxWidth: 420 }}>
 *     <Moodscreen {...props} width={width} />
 *   </div>
 *
 * @param {number} max
 * @returns {[(node: Element | null) => void, number]}
 */
import { useLayoutEffect, useState } from "react";

export default function useFittedWidth(max) {
  const [width, setWidth] = useState(max);
  const [el, setEl] = useState(null);

  useLayoutEffect(() => {
    if (!el) return undefined;
    const measure = () =>
      setWidth(Math.min(max, Math.round(el.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el, max]);

  return [setEl, width];
}
