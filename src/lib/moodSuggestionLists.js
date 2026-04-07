/**
 * Static autocomplete lists for specific mood categories (no network).
 * Keys match MOOD_CATEGORY_GROUPS category ids: listening, watching, reading.
 */

export const MOOD_TEXT_SUGGESTIONS = {
  listening: [
    "Drake",
    "Frank Ocean",
    "Burna Boy",
    "Rema",
    "Tems",
    "Travis Scott",
    "SZA",
  ],
  watching: [
    "Breaking Bad",
    "Game of Thrones",
    "Top Boy",
    "The Bear",
    "Narcos",
  ],
  reading: [
    "Deep Work",
    "Atomic Habits",
    "The Alchemist",
    "Zero to One",
  ],
};

const SUPPORTED = new Set(Object.keys(MOOD_TEXT_SUGGESTIONS));

export function categorySupportsSuggestions(categoryId) {
  return typeof categoryId === "string" && SUPPORTED.has(categoryId);
}

/** Case-insensitive substring match; returns at most `max` items. */
export function filterMoodSuggestions(categoryId, query, max = 6) {
  if (!categorySupportsSuggestions(categoryId)) return [];
  const raw = typeof query === "string" ? query : "";
  const q = raw.trim().toLowerCase();
  if (!q) return [];

  const list = MOOD_TEXT_SUGGESTIONS[categoryId];
  return list.filter((item) => item.toLowerCase().includes(q)).slice(0, max);
}
