/**
 * The bridge between what the editor still stores and what the renderer
 * needs.
 *
 * The pre-redesign editor holds up to two rows of `{ categoryId, text }`
 * drawn from the 34 emoji categories in moodCategories.js. A Moodscreen is
 * one mood from the ten-mood spectrum and one statement. Until the hero
 * editor is rebuilt, mood and statement are derived here rather than stored,
 * so there is no second copy of the same fact to keep in sync.
 *
 * When the editor becomes one mood picker and one statement field, these
 * become real persisted fields and this file shrinks to the migration.
 */
import { getCategoryById } from "./moodCategories.js";
import { DEFAULT_ACCENT, getMood, MOOD_IDS } from "./moods.js";
import { clampStatement } from "./statementFit.js";

/** 34 categories onto 10 moods. Anything unmapped falls back to `thinking`. */
const CATEGORY_TO_MOOD = {
  building: "building",
  coding: "coding",
  "working-on": "building",
  fixing: "coding",
  shipping: "building",

  thinking: "thinking",
  "in-mind": "thinking",
  speaking: "speaking",
  reflecting: "thinking",
  processing: "thinking",

  "status-location": "traveling",
  "currently-in": "traveling",
  at: "traveling",
  traveling: "traveling",

  listening: "learning",
  watching: "learning",
  reading: "learning",
  playing: "creating",
  recording: "creating",

  drinking: "available",
  eating: "available",
  sleeping: "offline",
  resting: "offline",
  training: "available",
  relaxing: "offline",

  writing: "creating",
  designing: "creating",
  shooting: "creating",
  producing: "creating",
  editing: "creating",

  "talking-about": "speaking",
  "obsessed-with": "thinking",
  "looking-at": "thinking",
  following: "learning",
};

export const FALLBACK_MOOD_ID = "thinking";

export function moodIdForCategory(categoryId) {
  return CATEGORY_TO_MOOD[categoryId] ?? FALLBACK_MOOD_ID;
}

export function isMoodId(id) {
  return typeof id === "string" && MOOD_IDS.includes(id);
}

/** The first row with text is the Moodscreen; the rest has nowhere to go. */
function firstFilledEntry(moodEntries) {
  if (!Array.isArray(moodEntries)) return null;
  return (
    moodEntries.find((e) => typeof e?.text === "string" && e.text.trim().length > 0) ?? null
  );
}

export function deriveMoodId(moodEntries) {
  const entry = firstFilledEntry(moodEntries);
  if (!entry) return FALLBACK_MOOD_ID;
  const category = getCategoryById(entry.categoryId);
  return category ? moodIdForCategory(category.id) : FALLBACK_MOOD_ID;
}

export function deriveStatement(moodEntries) {
  const entry = firstFilledEntry(moodEntries);
  return clampStatement(entry ? entry.text.trim() : "");
}

/** The accent the site should be wearing for a given Moodscreen. */
export function accentFor(moodId) {
  return getMood(moodId)?.color ?? DEFAULT_ACCENT;
}
