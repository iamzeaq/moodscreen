/**
 * The migration from what the pre-redesign editor stored to what a Moodscreen
 * is.
 *
 * A Moodscreen is one mood from §3's ten and one statement, and since session
 * 3 those are what the editor holds and what gets persisted. The editor before
 * it held up to two rows of `{ categoryId, text }` drawn from the 34 emoji
 * categories in moodCategories.js, and there are saves in the wild — in
 * localStorage and in Supabase — that still look like that.
 *
 * So this file is now one thing only: the read path for those rows.
 * `normalizeStoredMoodscreen` calls it when a record has no `mood`/`statement`
 * of its own, and the next save writes the new shape, which means every record
 * migrates the first time its owner opens the site. Nothing writes a
 * categoryId any more.
 *
 * It can be deleted once the old saves are gone. Until then, deleting it turns
 * every pre-redesign Moodscreen into a blank one.
 */
import { getCategoryById } from "./moodCategories.js";
import { DEFAULT_ACCENT, getMood } from "./moods.js";
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
