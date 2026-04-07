/**
 * Single Supabase client — import from here only inside service layers
 * (authService, moodscreenDataService). UI must not import this file.
 */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when env is set (guest mode still works when false). */
export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase = isSupabaseConfigured()
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    })
  : null;
