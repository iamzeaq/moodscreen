/**
 * Display helpers for Supabase Auth user (OAuth metadata varies by provider).
 */

/**
 * OAuth provider slug, e.g. `google`, `twitter` (Supabase naming).
 */
export function getAuthProvider(user) {
  if (!user) return null;
  const identities = user.identities;
  if (!Array.isArray(identities) || identities.length === 0) {
    const p = user.app_metadata?.provider;
    return typeof p === "string" && p.length > 0 ? p.toLowerCase() : null;
  }
  const email = (user.email || "").toLowerCase();
  const linked = identities.find(
    (i) =>
      i.identity_data &&
      typeof i.identity_data.email === "string" &&
      i.identity_data.email.toLowerCase() === email,
  );
  const chosen = linked ?? identities[0];
  const p = chosen?.provider;
  if (typeof p === "string" && p.length > 0) return p.toLowerCase();
  return null;
}

/** Email, or @username / name when OAuth did not return an email */
export function getAccountDisplayIdentifier(user) {
  if (!user) return "";
  if (user.email) return user.email;
  const m = user.user_metadata || {};
  const u = m.user_name || m.preferred_username || m.name;
  return typeof u === "string" ? u : "";
}

export function getUserAvatarUrl(user) {
  if (!user) return null;
  const m = user.user_metadata || {};
  const fromMeta = m.avatar_url || m.picture;
  if (typeof fromMeta === "string" && fromMeta.length > 0) return fromMeta;
  const idData = user.identities?.[0]?.identity_data;
  if (idData && typeof idData.avatar_url === "string" && idData.avatar_url.length > 0) {
    return idData.avatar_url;
  }
  if (idData && typeof idData.picture === "string" && idData.picture.length > 0) {
    return idData.picture;
  }
  return null;
}

export function getUserDisplayName(user) {
  if (!user) return "";
  const m = user.user_metadata || {};
  const name = m.full_name || m.name || m.user_name;
  if (typeof name === "string" && name.trim()) return name.trim();
  const email = user.email;
  if (typeof email === "string" && email.includes("@")) {
    return email.split("@")[0] || "";
  }
  return "";
}

export function getUserInitials(user) {
  const name = getUserDisplayName(user);
  if (!name) {
    const e = user?.email;
    if (typeof e === "string" && e.length >= 1) return e.slice(0, 2).toUpperCase();
    return "?";
  }
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
