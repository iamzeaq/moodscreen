/**
 * The off-screen twins — CLAUDE.md §7.8.
 *
 * Two <Moodscreen>s with `forExport`, mounted for the life of the app and
 * parked outside the viewport, one per export mode. Every capture photographs
 * one of these nodes, so the export path never clones or restyles anything —
 * see src/lib/exportMoodscreen.js.
 *
 * Note what these wrappers do and do not do. They place the card on a
 * backdrop, or on nothing. They never lay it out: the card inside is the same
 * component at the same base size as the one on screen, and the §7 rule that
 * one component renders both is exactly as true after the two modes as before.
 *
 * They are kept in the DOM rather than mounted on demand so the blob can be
 * pre-rendered as the statement changes, which is what makes share a single
 * tap: by the time the user reaches for it, the file already exists.
 */
import Moodscreen, { BASE_SIZE } from "./Moodscreen.jsx";

export const EXPORT_NODE_ID = "moodscreen-export";

/** §7.8 — the screen sits on the backdrop with a 7% margin. */
const MARGIN = 0.07;

export const EXPORT_MODES = ["default", "sticker"];

/**
 * The two node ids for a given surface.
 *
 * Parameterised because more than one of these can be mounted at once —
 * /kitchen-sink puts up its own alongside the app-wide one in
 * MoodscreenContext, and two nodes answering to the same id would have the
 * capture photograph whichever the DOM happened to reach first.
 */
export function nodeIdsFor(prefix = EXPORT_NODE_ID) {
  return { default: prefix, sticker: `${prefix}-sticker` };
}

export const EXPORT_NODE_IDS = nodeIdsFor();

/**
 * §7.8 — the default mode's backdrop is not decoration, it is what makes the
 * file safe. WhatsApp converts images to JPEG, which has no transparency, so a
 * transparent export comes back with black or white blocks where the bow
 * should be. Sending to someone on WhatsApp is a core use, so the safe version
 * is the default and `sticker` is the deliberate choice.
 *
 * Near-black rather than the mood colour, so a shared Moodscreen carries the
 * brand surface with it and the mood stays the thing that pops.
 */
function Backdrop({ id, children }) {
  return (
    <div
      id={id}
      style={{
        width: BASE_SIZE,
        height: BASE_SIZE,
        background: "var(--canvas)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

export default function MoodscreenExportSurface({ idPrefix = EXPORT_NODE_ID, ...props }) {
  const ids = nodeIdsFor(idPrefix);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: -99999,
        top: 0,
        width: BASE_SIZE,
        height: BASE_SIZE * 2,
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <Backdrop id={ids.default}>
        <Moodscreen {...props} forExport width={BASE_SIZE * (1 - MARGIN * 2)} />
      </Backdrop>

      {/* Sticker: no wrapper of its own. The card's clip-path is the edge of
        * the file, which is the whole point of the mode. */}
      <Moodscreen {...props} forExport id={ids.sticker} width={BASE_SIZE} />
    </div>
  );
}
