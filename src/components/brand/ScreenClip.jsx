/**
 * The screen outline as a resolution-independent clip.
 *
 * `<Moodscreen>` clips with a literal px `path()` and must keep doing so:
 * html-to-image serialises the card into a foreignObject and every reference
 * to an SVG def by id is one more thing that can fail to survive that trip
 * (§7.3 already had to ban filter-based grain for the same reason). The card
 * also only ever lays out at one size, so baking px in costs it nothing.
 *
 * Site chrome is the opposite case. Nothing here is ever captured, and the
 * elements that want the outline — the mood strip's ten stops, most of all —
 * are fluid, so a px path would have to be re-derived at every width. One
 * `objectBoundingBox` def, mounted once at the app root, clips any box to the
 * screen at any size.
 *
 * `SCREEN_PATH_UNIT` is the same coordinates as the card's, scaled rather than
 * transcribed, so the two cannot drift.
 */
import { SCREEN_PATH_UNIT } from "../../lib/screen.js";

export const SCREEN_CLIP_ID = "moodscreen-screen-clip";

/** The value to hand `clip-path`. */
export const SCREEN_CLIP = `url(#${SCREEN_CLIP_ID})`;

export default function ScreenClipDef() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <clipPath id={SCREEN_CLIP_ID} clipPathUnits="objectBoundingBox">
          <path d={SCREEN_PATH_UNIT} />
        </clipPath>
      </defs>
    </svg>
  );
}
