/**
 * Canonical persisted shape (non-breaking): extends profile fields with
 * `entries` (display strings) + timestamps. Older saves use moodEntries / legacy only.
 */

import {
  MOOD_CATEGORY_GROUPS,
  getCategoryById,
  legacyToMoodEntries,
  normalizeMoodEntries,
} from "./moodCategories.js";

export const MOODSCREEN_PAYLOAD_VERSION = 2;

export function findCategoryIdByDisplayString(display) {
  const t = (display || "").trim();
  if (!t) return null;
  for (const g of MOOD_CATEGORY_GROUPS) {
    for (const c of g.categories) {
      if (`${c.emoji} ${c.label.toLowerCase()}` === t) return c.id;
    }
  }
  return null;
}

/** Standard `entries` for storage (max 2, valid rows only) */
export function standardEntriesFromMoodEntries(moodEntries) {
  const normalized = normalizeMoodEntries(moodEntries);
  const out = [];
  for (const e of normalized) {
    const cat = getCategoryById(e.categoryId);
    const text = (e.text || "").trim().slice(0, 80);
    if (!cat || text.length < 1) continue;
    out.push({
      category: `${cat.emoji} ${cat.label.toLowerCase()}`,
      text,
    });
  }
  return out.slice(0, 2);
}

/** Restore moodEntries from standard entries (category string or optional categoryId) */
export function moodEntriesFromStandardEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const rows = [];
  for (const e of entries.slice(0, 2)) {
    const text =
      typeof e.text === "string" ? e.text.trim().slice(0, 80) : "";
    let id =
      typeof e.categoryId === "string" && getCategoryById(e.categoryId)
        ? e.categoryId
        : null;
    if (!id && typeof e.category === "string") {
      id = findCategoryIdByDisplayString(e.category);
    }
    if (id && text.length >= 1) rows.push({ categoryId: id, text });
  }
  return rows.length ? normalizeMoodEntries(rows) : null;
}

/**
 * Normalize any persisted / API blob into fields applyFromObject expects.
 */
export function normalizeStoredMoodscreen(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      name: undefined,
      location: undefined,
      link: undefined,
      themeId: undefined,
      avatarUrl: null,
      moodEntries: legacyToMoodEntries({}),
      created_at: null,
    };
  }

  let moodEntries = null;
  if (Array.isArray(raw.entries) && raw.entries.length) {
    moodEntries = moodEntriesFromStandardEntries(raw.entries);
  }
  if (!moodEntries && Array.isArray(raw.moodEntries)) {
    moodEntries = normalizeMoodEntries(raw.moodEntries);
  }
  if (!moodEntries) {
    moodEntries = legacyToMoodEntries(raw);
  }

  return {
    name: "name" in raw && typeof raw.name === "string" ? raw.name : undefined,
    location: "location" in raw && typeof raw.location === "string" ? raw.location : undefined,
    link: "link" in raw && typeof raw.link === "string" ? raw.link : undefined,
    /* Records written before themes existed have no themeId; the context
     * falls back to the default rather than guessing from cardDarkMode. */
    themeId: typeof raw.themeId === "string" ? raw.themeId : undefined,
    avatarUrl:
      typeof raw.avatarUrl === "string" && !String(raw.avatarUrl).startsWith("blob:")
        ? raw.avatarUrl
        : null,
    moodEntries,
    created_at: typeof raw.created_at === "string" ? raw.created_at : null,
  };
}
