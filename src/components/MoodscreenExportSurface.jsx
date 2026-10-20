/**
 * The off-screen twins — CLAUDE.md §7.8.
 *
 * <Moodscreen>s with `forExport`, mounted for the life of the app and parked
 * outside the viewport: one per export mode, plus the link preview and the
 * story frame Share sends. Every capture photographs
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
import { memo } from "react";
import Moodscreen, { BASE_SIZE } from "./Moodscreen.jsx";
import { getMood } from "../lib/moods.js";

export const EXPORT_NODE_ID = "moodscreen-export";

/** §7.8 — the screen sits on the backdrop with a 7% margin. */
const MARGIN = 0.07;

export const EXPORT_MODES = ["default", "sticker"];

/**
 * The link-preview frame: what WhatsApp, iMessage and X draw when someone
 * pastes moodscreen.live/username. 1200x630 is the size every one of them
 * accepts for a large preview, captured at 1x.
 *
 * Not a third export mode — nobody downloads it. It is photographed on save
 * and uploaded, and api/og-page.js points the public page's og:image at it.
 */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * The story frame: 9:16, what Share sends. 540x960 photographed at 2x is
 * 1080x1920, the size IG, WhatsApp and Snap stories are drawn at, so a shared
 * Moodscreen fills the whole story rather than a square band across it.
 *
 * Not a fourth export mode either — nobody picks it. Download stays the §7.8
 * square; this is only what the share sheet is handed.
 */
export const STORY_WIDTH = BASE_SIZE;
export const STORY_HEIGHT = Math.round((BASE_SIZE * 16) / 9);
export const STORY_PIXEL_RATIO = 2;

/**
 * The story's ground: the exact mood colour, full height, on every surface.
 *
 * On `colour` that is the card's own fill, so the screen sits on its colour
 * and reads by its texture, vignette and night tint rather than by contrast
 * at the edge. Chosen knowingly over a deeper tone of the hue.
 */
export function storyBackground(moodId) {
  return (getMood(moodId) ?? getMood("thinking")).color;
}

/**
 * The node ids for a given surface.
 *
 * Parameterised because more than one of these can be mounted at once —
 * /kitchen-sink puts up its own alongside the app-wide one in
 * MoodscreenContext, and two nodes answering to the same id would have the
 * capture photograph whichever the DOM happened to reach first.
 */
export function nodeIdsFor(prefix = EXPORT_NODE_ID) {
  return {
    default: prefix,
    sticker: `${prefix}-sticker`,
    og: `${prefix}-og`,
    story: `${prefix}-story`,
  };
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
function Backdrop({ id, width = BASE_SIZE, height = BASE_SIZE, background = "var(--canvas)", children }) {
  return (
    <div
      id={id}
      style={{
        width,
        height,
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Memoised, and for the same reason the props it is handed are debounced: these
 * two cards are the most expensive thing in the tree and the least urgent. Every
 * unrelated flicker of provider state — a save going from idle to saving, the
 * share blob becoming ready — used to reconcile both of them. Its props are all
 * primitives, so a shallow compare is the whole test.
 */
/**
 * `storyOnly` mounts just the story twin. The public page uses it: it shares a
 * stranger's Moodscreen but never downloads, stickers or previews it, and three
 * more full cards on the page shared links land on would be work nobody sees.
 */
function MoodscreenExportSurface({ idPrefix = EXPORT_NODE_ID, storyOnly = false, ...props }) {
  const ids = nodeIdsFor(idPrefix);
  /* The same card, at the same width, as the square file — the story is a
   * taller frame round it, not a different drawing of it. */
  const cardWidth = BASE_SIZE * (1 - MARGIN * 2);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: -99999,
        top: 0,
        width: BASE_SIZE,
        height: storyOnly ? STORY_HEIGHT : BASE_SIZE * 2 + OG_HEIGHT + STORY_HEIGHT,
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <Backdrop
        id={ids.story}
        width={STORY_WIDTH}
        height={STORY_HEIGHT}
        background={storyBackground(props.mood)}
      >
        <Moodscreen {...props} forExport width={cardWidth} />
      </Backdrop>

      {storyOnly ? null : (
        <>
          <Backdrop id={ids.default}>
            <Moodscreen {...props} forExport width={cardWidth} />
          </Backdrop>

          {/* Sticker: no wrapper of its own. The card's clip-path is the edge
            * of the file, which is the whole point of the mode. */}
          <Moodscreen {...props} forExport id={ids.sticker} width={BASE_SIZE} />

          {/* Link preview: the same backdrop, wider. The screen keeps the 7%
            * margin against the short side and sits centred, so a platform
            * that crops the preview to a square still has the whole screen. */}
          <Backdrop id={ids.og} width={OG_WIDTH} height={OG_HEIGHT}>
            <Moodscreen {...props} forExport width={Math.round(OG_HEIGHT * (1 - MARGIN * 2))} />
          </Backdrop>
        </>
      )}
    </div>
  );
}

export default memo(MoodscreenExportSurface);
