/**
 * Auth abstraction — swap implementation here without touching UI.
 * All OAuth/session logic goes through these functions.
 */
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

function notConfigured() {
  return { data: null, error: new Error("Supabase is not configured (missing env vars).") };
}

/**
 * @returns {Promise<{ data: import('@supabase/supabase-js').OAuthResponse | null, error: Error | null }>}
 */
export async function loginWithGoogle() {
  if (!supabase) return notConfigured();
  const redirectTo = `${window.location.origin}/`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  return { data, error };
}

/**
 * X / Twitter — enable provider in Supabase Dashboard (Authentication → Providers).
 */
export async function loginWithTwitter() {
  if (!supabase) return notConfigured();
  const redirectTo = `${window.location.origin}/`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "twitter",
    options: { redirectTo },
  });
  return { data, error };
}

export async function logout() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
}

/** @returns {Promise<import('@supabase/supabase-js').User | null>} */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/** Synchronous snapshot from current session (may be null before hydration). */
export async function getSession() {
  if (!supabase) return { session: null, error: null };
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session ?? null, error };
}

/**
 * @param {(event: string, session: import('@supabase/supabase-js').Session | null) => void} callback
 * @returns {{ unsubscribe: () => void }}
 */
export function onAuthStateChange(callback) {
  if (!supabase) {
    return { unsubscribe: () => {} };
  }
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return { unsubscribe: data.subscription.unsubscribe };
}

export { isSupabaseConfigured };
