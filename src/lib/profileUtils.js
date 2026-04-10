/** Reserved URL segments — must not be treated as public profile slugs */
export const RESERVED_USERNAMES = new Set([
  "create",
  "onboarding",
  "auth",
  "login",
  "logout",
  "api",
  "settings",
  "studio",
  "oauth",
  "callback",
  "admin",
  "about",
  "help",
  "terms",
  "privacy",
  "moodscreen",
  "www",
  "null",
  "undefined",
]);

export function isReservedUsername(slug) {
  if (!slug || typeof slug !== "string") return true;
  return RESERVED_USERNAMES.has(slug.toLowerCase());
}

/** @returns {string} lowercase trimmed slug */
export function normalizeUsernameSlug(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function isUsernameSlugValid(slug) {
  if (!slug || typeof slug !== "string") return false;
  return /^[a-z0-9_]{3,30}$/.test(slug) && !isReservedUsername(slug);
}

/** @param {string | null | undefined} iso */
export function isActiveWithin48h(iso) {
  if (!iso || typeof iso !== "string") return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 48 * 60 * 60 * 1000;
}

export function getInitialsFromName(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase();
}
