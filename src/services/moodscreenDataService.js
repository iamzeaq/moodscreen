/**
 * Guest localStorage + authenticated Supabase persistence.
 * Canonical key: moodscreen_data (legacy moodscreen_guest_v1 still read + migrated).
 */
import { legacyToMoodEntries, normalizeMoodEntries } from "../lib/moodCategories.js";
import {
  MOODSCREEN_PAYLOAD_VERSION,
  normalizeStoredMoodscreen,
  standardEntriesFromMoodEntries,
} from "../lib/moodscreenPayload.js";
import { sanitizeMoodEntries } from "../lib/moodscreenValidation.js";
import { DEFAULT_THEME_ID, isThemeId } from "../themes/index.js";
import { supabase } from "../lib/supabaseClient.js";

/** Primary guest key (launch) */
export const MOODSCREEN_DATA_KEY = "moodscreen_data";
/** Legacy — read + migrate, then remove */
export const LEGACY_GUEST_STORAGE_KEY = "moodscreen_guest_v1";

/** @deprecated use MOODSCREEN_DATA_KEY */
export const GUEST_STORAGE_KEY = MOODSCREEN_DATA_KEY;

const TABLE = "moodscreens";

/**
 * Serialize app state for storage / Supabase `data` JSON.
 * Non-breaking: keeps moodEntries + adds normalized `entries` + timestamps.
 */
export function serializeMoodscreenState(state, meta = {}) {
  if (!state || typeof state !== "object") return {};
  const moodEntries = Array.isArray(state.moodEntries)
    ? sanitizeMoodEntries(state.moodEntries)
    : sanitizeMoodEntries(legacyToMoodEntries(state));

  const createdAt =
    meta.createdAt ||
    (typeof state.created_at === "string" ? state.created_at : null) ||
    new Date().toISOString();
  const updatedAt = new Date().toISOString();

  return {
    version: MOODSCREEN_PAYLOAD_VERSION,
    name: typeof state.name === "string" ? state.name : "",
    location: typeof state.location === "string" ? state.location : "",
    moodEntries,
    entries: standardEntriesFromMoodEntries(moodEntries),
    link: typeof state.link === "string" ? state.link : "",
    themeId: isThemeId(state.themeId) ? state.themeId : DEFAULT_THEME_ID,
    avatarUrl:
      typeof state.avatarUrl === "string" && !state.avatarUrl.startsWith("blob:")
        ? state.avatarUrl
        : null,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function parseRawLocalStorage(raw) {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Read guest moodscreen: prefers moodscreen_data, falls back to legacy key.
 */
export function readGuestMoodscreen() {
  if (typeof window === "undefined") return null;
  try {
    const primary = window.localStorage.getItem(MOODSCREEN_DATA_KEY);
    if (primary) {
      const parsed = parseRawLocalStorage(primary);
      if (parsed) return normalizeStoredMoodscreen(parsed);
    }
    const legacy = window.localStorage.getItem(LEGACY_GUEST_STORAGE_KEY);
    if (legacy) {
      const parsed = parseRawLocalStorage(legacy);
      if (parsed) {
        const normalized = normalizeStoredMoodscreen(parsed);
        try {
          writeGuestMoodscreenInternal(normalized);
          window.localStorage.removeItem(LEGACY_GUEST_STORAGE_KEY);
        } catch {
          /* ignore migration write failure */
        }
        return normalized;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function writeGuestMoodscreenInternal(normalizedLike) {
  const payload = serializeMoodscreenState(normalizedLike, {
    createdAt:
      typeof normalizedLike.created_at === "string" ? normalizedLike.created_at : undefined,
  });
  window.localStorage.setItem(MOODSCREEN_DATA_KEY, JSON.stringify(payload));
}

export function writeGuestMoodscreen(state, meta = {}) {
  if (typeof window === "undefined") return;
  try {
    const moodEntries = Array.isArray(state?.moodEntries)
      ? normalizeMoodEntries(state.moodEntries)
      : legacyToMoodEntries(state || {});
    const base = {
      ...state,
      moodEntries,
      created_at:
        meta.createdAt ||
        (typeof state?.created_at === "string" ? state.created_at : undefined),
    };
    const payload = serializeMoodscreenState(base, {
      createdAt: base.created_at,
    });
    window.localStorage.setItem(MOODSCREEN_DATA_KEY, JSON.stringify(payload));
    try {
      window.localStorage.removeItem(LEGACY_GUEST_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  } catch {
    // quota / private mode
  }
}

export function clearGuestMoodscreen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(MOODSCREEN_DATA_KEY);
    window.localStorage.removeItem(LEGACY_GUEST_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Load moodscreen row for user. Returns normalized flat object or null.
 */
export async function fetchMoodscreenForUser(userId) {
  if (!supabase || !userId) return { data: null, error: null };
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("data, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return { data: null, error };
    if (!data?.data) return { data: null, error: null };
    const normalized = normalizeStoredMoodscreen(data.data);
    return { data: normalized, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

/**
 * Upsert JSON payload for user (one row per user).
 */
export async function upsertMoodscreenForUser(userId, state, meta = {}) {
  if (!supabase || !userId) return { error: new Error("No client or user") };
  try {
    const data = serializeMoodscreenState(state, meta);
    const { error } = await supabase.from(TABLE).upsert(
      {
        user_id: userId,
        data,
        updated_at: data.updated_at,
      },
      { onConflict: "user_id" },
    );
    return { error };
  } catch (e) {
    return { error: e };
  }
}

/**
 * After login: push guest localStorage to Supabase, then clear local guest keys.
 */
export async function migrateGuestStorageToUser(userId) {
  if (!userId) return { migrated: false, error: null };
  const guest = readGuestMoodscreen();
  if (!guest) {
    return { migrated: false, error: null };
  }
  const createdAt =
    typeof guest.created_at === "string" ? guest.created_at : new Date().toISOString();
  const { error } = await upsertMoodscreenForUser(userId, { ...guest, created_at: createdAt }, {
    createdAt,
  });
  if (error) return { migrated: false, error };
  clearGuestMoodscreen();
  return { migrated: true, error: null };
}

