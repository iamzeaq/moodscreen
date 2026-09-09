/**
 * Supabase `profiles` row — username, location, last_active for routing + presence.
 */
import { supabase } from "../lib/supabaseClient.js";
import { normalizeUsernameSlug } from "../lib/profileUtils.js";
import { FALLBACK_MOOD_ID } from "../lib/moodscreenModel.js";
import { upsertMoodscreenForUser } from "./moodscreenDataService.js";

function notConfigured() {
  return { data: null, error: new Error("Supabase is not configured.") };
}

/**
 * Create or update last_active only (does not clear username / location).
 * @param {string} userId
 */
export async function syncProfileOnLogin(userId) {
  if (!supabase || !userId) return notConfigured();
  const now = new Date().toISOString();
  const { data: row } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (row) {
    const { error } = await supabase.from("profiles").update({ last_active: now }).eq("id", userId);
    if (error) return { data: null, error };
  } else {
    const { error } = await supabase.from("profiles").insert({ id: userId, last_active: now });
    if (error) return { data: null, error };
  }
  return fetchProfileByUserId(userId);
}

/** @returns {Promise<{ data: object | null, error: Error | null }>} */
export async function fetchProfileByUserId(userId) {
  if (!supabase || !userId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, location, last_active, created_at")
    .eq("id", userId)
    .maybeSingle();
  return { data: data ?? null, error };
}

/** Public read — anon key allowed when RLS permits */
export async function fetchProfileByUsername(username) {
  if (!supabase || !username) return { data: null, error: null };
  const slug = normalizeUsernameSlug(username);
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, location, last_active, created_at")
    .eq("username", slug)
    .maybeSingle();
  return { data: data ?? null, error };
}

/**
 * @param {string} userId
 * @param {{ username: string, location: string, statusText: string }} fields
 */
export async function completeOnboarding(userId, fields) {
  if (!supabase || !userId) return { error: new Error("Not signed in") };
  const username = normalizeUsernameSlug(fields.username);
  const location = typeof fields.location === "string" ? fields.location.trim() : "";
  const statusText = typeof fields.statusText === "string" ? fields.statusText.trim() : "";
  if (!username || !location || !statusText) {
    return { error: new Error("Fill all fields.") };
  }

  const now = new Date().toISOString();
  const { error: e1 } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username,
      location,
      last_active: now,
    },
    { onConflict: "id" },
  );

  if (e1) {
    return { error: e1 };
  }

  const displayName = username
    .split("_")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ")
    .trim() || username;

  const { error: e2 } = await upsertMoodscreenForUser(
    userId,
    {
      name: displayName,
      location,
      /* Onboarding asks one question and it is the statement. The mood is the
       * other of §7.2's two choices and is picked on the strip, so a first
       * Moodscreen starts on the default rather than having one guessed for
       * it from the words. */
      mood: FALLBACK_MOOD_ID,
      statement: statusText,
      link: "",
      avatarUrl: null,
    },
    {},
  );

  return { error: e2 ?? null };
}
