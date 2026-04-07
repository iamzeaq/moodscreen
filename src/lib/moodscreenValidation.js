/**
 * Client-side validation for mood rows before persist (lightweight).
 */

import { getCategoryById, MOOD_ENTRY_MAX_SLOTS, normalizeMoodEntries } from "./moodCategories.js";

export const MOOD_TEXT_MIN = 1;
export const MOOD_TEXT_MAX = 80;

/** Trim + cap length for UI / storage */
export function sanitizeMoodEntries(raw) {
  const n = normalizeMoodEntries(raw);
  return n.map((r) => ({
    categoryId: typeof r.categoryId === "string" ? r.categoryId : "",
    text: typeof r.text === "string" ? r.text.slice(0, MOOD_TEXT_MAX) : "",
  }));
}

/**
 * Returns rows that are safe to show on card / include in `entries`.
 * Skips incomplete rows (no category or text out of range when category set).
 */
export function validateMoodEntriesForPersist(moodEntries) {
  const list = normalizeMoodEntries(moodEntries);
  const errors = [];
  const validRows = [];

  if (list.length > MOOD_ENTRY_MAX_SLOTS) {
    errors.push(`At most ${MOOD_ENTRY_MAX_SLOTS} status lines.`);
  }

  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    const id = row.categoryId || "";
    const text = (row.text || "").trim();
    const cat = getCategoryById(id);

    if (!id && !text) continue;
    if (!id && text) {
      errors.push(`Line ${i + 1}: pick a category.`);
      continue;
    }
    if (id && !cat) {
      errors.push(`Line ${i + 1}: invalid category.`);
      continue;
    }
    if (id && cat && text.length < MOOD_TEXT_MIN) {
      errors.push(`Line ${i + 1}: text must be at least ${MOOD_TEXT_MIN} character.`);
      continue;
    }
    if (id && cat && text.length > MOOD_TEXT_MAX) {
      errors.push(`Line ${i + 1}: text must be at most ${MOOD_TEXT_MAX} characters.`);
      continue;
    }
    if (id && cat && text.length >= MOOD_TEXT_MIN) {
      validRows.push({ categoryId: id, text });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    validRows,
  };
}
