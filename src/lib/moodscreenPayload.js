/**
 * The persisted shape, and how to read every older one.
 *
 * A Moodscreen is a mood, a statement, a theme, a surface and the hour it was
 * posted (§7.2, §7.4, §7.6, §7.7). Version 3 stores exactly that. Versions
 * before it stored the pre-redesign editor's rows instead, in two different
 * arrangements, and before those there were four loose top-level strings.
 *
 * Everything reads through `normalizeStoredMoodscreen`, so the fallback chain
 * lives in one place and nothing downstream has to know which era a record is
 * from. A record migrates the first time its owner opens the site: it is read
 * through the chain, and the next debounced save writes v3.
 */

import {
  MOOD_CATEGORY_GROUPS,
  getCategoryById,
  legacyToMoodEntries,
  normalizeMoodEntries,
} from "./moodCategories.js";
import { isMoodId } from "./moods.js";
import { deriveMoodId, deriveStatement, FALLBACK_MOOD_ID } from "./moodscreenModel.js";
import { clampStatement } from "./statementFit.js";

/** 3 — mood + statement. 2 — `entries`. 1 and earlier — loose strings. */
export const MOODSCREEN_PAYLOAD_VERSION = 3;

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

/** Restore v2 rows from its `entries` (category string or optional categoryId) */
export function moodEntriesFromStandardEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const rows = [];
  for (const e of entries.slice(0, 2)) {
    const text = typeof e.text === "string" ? e.text.trim().slice(0, 80) : "";
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

/** The four loose strings a v1 record kept its statement in. */
const LEGACY_FIELDS = ["building", "listening", "reading", "moodCategory"];

function hasLegacyFields(raw) {
  return LEGACY_FIELDS.some((k) => typeof raw[k] === "string" && raw[k].trim());
}

/**
 * The one place a stored blob becomes state.
 *
 * `mood` and `statement` are read straight off a v3 record and reconstructed
 * from the rows for anything older — see moodscreenModel.js, which exists only
 * for that. `statement` is clamped on read as well as on write, because §7.6
 * dropped the cap from 180 characters to 100 and there are saves that predate
 * the change.
 */
export function normalizeStoredMoodscreen(raw) {
  const empty = {
    name: undefined,
    location: undefined,
    link: undefined,
    themeId: undefined,
    surface: undefined,
    avatarUrl: null,
    mood: FALLBACK_MOOD_ID,
    statement: "",
    created_at: null,
    updated_at: null,
  };

  if (!raw || typeof raw !== "object") return empty;

  /* v3 first. Only fall back through the older shapes if it is not there —
   * an old record that happens to carry both must not have its rows win. */
  let mood = isMoodId(raw.mood) ? raw.mood : null;
  let statement = typeof raw.statement === "string" ? raw.statement : null;

  if (mood === null || statement === null) {
    let rows = null;
    if (Array.isArray(raw.entries) && raw.entries.length) {
      rows = moodEntriesFromStandardEntries(raw.entries);
    }
    if (!rows && Array.isArray(raw.moodEntries)) {
      rows = normalizeMoodEntries(raw.moodEntries);
    }
    /**
     * Only reach for the v1 shape if the record actually looks like one.
     *
     * `legacyToMoodEntries` answers an empty object with its own seeded
     * default row, which is right when migrating a record that has lost its
     * text and wrong for the case that reaches here far more often: a first
     * visit, where `applyFromObject({})` runs to reset the form. Handing that
     * the seed put a stranger's sentence in the hero's field, so the
     * visitor's first keystroke was a deletion — the one thing §9.1 exists to
     * avoid. No legacy keys, no legacy read.
     */
    if (!rows && hasLegacyFields(raw)) rows = legacyToMoodEntries(raw);

    if (rows) {
      if (mood === null) mood = deriveMoodId(rows);
      if (statement === null) statement = deriveStatement(rows);
    }
  }

  if (mood === null) mood = FALLBACK_MOOD_ID;
  if (statement === null) statement = "";

  return {
    name: typeof raw.name === "string" ? raw.name : undefined,
    location: typeof raw.location === "string" ? raw.location : undefined,
    link: typeof raw.link === "string" ? raw.link : undefined,
    /* Records written before themes existed have no themeId; the caller falls
     * back to the default rather than guessing from cardDarkMode. */
    themeId: typeof raw.themeId === "string" ? raw.themeId : undefined,
    /* §7.2 — the user's second choice. Absent on anything before session 2b. */
    surface: typeof raw.surface === "string" ? raw.surface : undefined,
    avatarUrl:
      typeof raw.avatarUrl === "string" && !String(raw.avatarUrl).startsWith("blob:")
        ? raw.avatarUrl
        : null,
    mood,
    statement: clampStatement(statement),
    created_at: typeof raw.created_at === "string" ? raw.created_at : null,
    /* §7.4 — the hour the card is *of*. Without this the night tint resets to
     * the reader's clock and a 3am card stops looking like one at noon. */
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}
