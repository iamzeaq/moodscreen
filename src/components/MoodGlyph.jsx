/**
 * The mood glyph — one of the existing icons in ./icons, brought forward.
 *
 * CLAUDE.md §7 lists the glyph watermark as one of the four texture moves,
 * and notes these icons currently only decorate FloatingBackground. This is
 * the mapping from the ten-mood spectrum onto them.
 *
 * `strokeWidth` is a prop because the same glyph is drawn at 18px beside the
 * mood label and at 260px as a watermark; a 1.5 stroke that reads correctly
 * small turns into a hairline when blown up.
 */
import { BuildingIcon } from "./icons/BuildingIcon.jsx";
import { CodingIcon } from "./icons/CodingIcon.jsx";
import { CurrentIcon } from "./icons/CurrentIcon.jsx";
import { DesigningIcon } from "./icons/DesigningIcon.jsx";
import { LookingIcon } from "./icons/LookingIcon.jsx";
import { ReadingIcon } from "./icons/ReadingIcon.jsx";
import { RestingIcon } from "./icons/RestingIcon.jsx";
import { TalkingIcon } from "./icons/TalkingIcon.jsx";
import { ThinkingIcon } from "./icons/ThinkingIcon.jsx";
import { TravelingIcon } from "./icons/TravelingIcon.jsx";

const GLYPHS = {
  building: BuildingIcon,
  creating: DesigningIcon,
  coding: CodingIcon,
  hiring: LookingIcon,
  thinking: ThinkingIcon,
  available: CurrentIcon,
  speaking: TalkingIcon,
  learning: ReadingIcon,
  traveling: TravelingIcon,
  offline: RestingIcon,
};

export function getMoodGlyph(moodId) {
  return GLYPHS[moodId] ?? ThinkingIcon;
}

export default function MoodGlyph({ mood, size = 18, strokeWidth = 1.5, ...rest }) {
  const Glyph = getMoodGlyph(mood);
  return <Glyph width={size} height={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
}
