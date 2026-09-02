/**
 * The off-screen twin.
 *
 * A second <Moodscreen> with `forExport`, mounted for the life of the app and
 * parked outside the viewport. Every capture photographs this node, so the
 * export path never has to clone or restyle anything — see
 * src/lib/exportMoodscreen.js.
 *
 * It is kept in the DOM rather than mounted on demand so the blob can be
 * pre-rendered as the statement changes, which is what makes share a single
 * tap: by the time the user reaches for it, the file already exists.
 */
import Moodscreen, { BASE_HEIGHT, BASE_WIDTH } from "./Moodscreen.jsx";

export const EXPORT_NODE_ID = "moodscreen-export";

export default function MoodscreenExportSurface({ id = EXPORT_NODE_ID, ...props }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: -99999,
        top: 0,
        width: BASE_WIDTH,
        height: BASE_HEIGHT,
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <Moodscreen {...props} forExport id={id} width={BASE_WIDTH} />
    </div>
  );
}
