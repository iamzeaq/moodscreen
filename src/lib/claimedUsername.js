/**
 * The name someone typed into the claim field before they had an account.
 *
 * §9.1's argument for putting the claim after the editor is that the work is
 * already done by the time it is asked for. Losing the name across the sign-in
 * redirect would undo exactly that: they would come back to an empty field and
 * have to decide again, which is the moment a conversion is lost.
 *
 * So it is stashed, and onboarding reads it. A guest who never signs in leaves
 * it behind harmlessly; there is nothing here worth protecting and nothing that
 * identifies anyone.
 */
import { normalizeUsernameSlug } from "./profileUtils.js";

const KEY = "moodscreen_claim";

export function rememberClaim(slug) {
  const clean = normalizeUsernameSlug(slug);
  if (typeof window === "undefined" || !clean) return;
  try {
    window.localStorage.setItem(KEY, clean);
  } catch {
    /* quota / private mode — the field is a convenience, not a requirement */
  }
}

export function readClaim() {
  if (typeof window === "undefined") return "";
  try {
    return normalizeUsernameSlug(window.localStorage.getItem(KEY) || "");
  } catch {
    return "";
  }
}

export function clearClaim() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
