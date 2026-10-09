/**
 * moodscreen.live/username, with that person's link preview.
 *
 * The app is a client-rendered SPA, and the crawlers that build link previews
 * (WhatsApp, iMessage, X, Slack, Discord) do not run JavaScript. Whatever is in
 * index.html when it leaves the server is the whole preview. So this route
 * serves the same index.html the static rewrite would, with the og: and
 * twitter: tags swapped for this person's: their name, their statement, and
 * the image the app captured and uploaded on their last save (og/{user_id}.jpg,
 * see uploadOgImage).
 *
 * The browser gets the identical SPA either way; only the head differs. Every
 * failure — no row, no image yet, Supabase slow or down — falls back towards
 * the generic preview rather than towards an error, because a broken preview is
 * a link nobody taps and a 500 here is a page nobody sees.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(
  /\/$/,
  "",
);
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

/** Crawlers give up on a slow page; better the generic preview than none. */
const LOOKUP_TIMEOUT_MS = 2500;

const SITE_NAME = "moodscreen";
const DEFAULT_TITLE = "moodscreen — what are you on right now?";
const DEFAULT_DESCRIPTION = "Say what you're on. Post it anywhere. It stays live.";
const DEFAULT_IMAGE_PATH = "/og-default.png";

/** Same rule as isUsernameSlugValid, minus the reserved list: a reserved name
 * can never be claimed, so it simply finds no row. */
const SLUG = /^[a-z0-9_]{3,30}$/;

let templatePromise = null;

/**
 * The built index.html, read once per instance.
 *
 * From disk first — vercel.json's includeFiles ships dist/index.html with the
 * function. Fetched from the deployment's own static files as a fallback, with
 * the visitor's cookies passed along so a protected preview deployment lets
 * the request through.
 */
function loadTemplate(origin, cookie) {
  if (!templatePromise) {
    templatePromise = readFile(path.join(process.cwd(), "dist", "index.html"), "utf8")
      .catch(async () => {
        const res = await fetch(`${origin}/index.html`, {
          headers: cookie ? { cookie } : {},
        });
        if (!res.ok) throw new Error(`index.html: ${res.status}`);
        return res.text();
      })
      .catch((e) => {
        templatePromise = null;
        throw e;
      });
  }
  return templatePromise;
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The public row for a handle, or null. Never throws.
 *
 * Asks without `user_id` if the first query is refused, so a database that
 * has not had schema.sql's view change applied still gets the name and the
 * statement — only the image falls back.
 */
async function lookup(slug) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  for (const columns of ["user_id,username,data,updated_at", "username,data,updated_at"]) {
    try {
      const url =
        `${SUPABASE_URL}/rest/v1/public_moodscreens` +
        `?select=${columns}&username=eq.${encodeURIComponent(slug)}&limit=1`;
      const res = await fetchWithTimeout(url, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (res.status === 400) continue;
      if (!res.ok) return null;
      const rows = await res.json();
      return Array.isArray(rows) && rows[0] ? rows[0] : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * The uploaded preview's URL, versioned, or null if there is none yet.
 *
 * Versioned by the object's own Last-Modified rather than the row's
 * `updated_at`: that column is the hour the Moodscreen is *of* (§7.4) and does
 * not move when the mood, surface or theme changes — so a link re-shared after
 * a mood change would keep unfurling the old colour from every crawler's
 * cache. The object's timestamp moves on every upload, which is exactly when
 * the picture changes. `updated_at` is the fallback if the header is missing.
 */
async function ogImageUrl(userId, updatedAt) {
  if (!userId) return null;
  const base = `${SUPABASE_URL}/storage/v1/object/public/og/${encodeURIComponent(userId)}.jpg`;
  try {
    const res = await fetchWithTimeout(base, { method: "HEAD" });
    if (!res.ok) return null;
    const modified = Date.parse(res.headers.get("last-modified") || "");
    const version = Number.isNaN(modified) ? Date.parse(updatedAt || "") || "" : modified;
    return version ? `${base}?v=${version}` : base;
  } catch {
    return null;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function headTags({ title, description, image, imageType, url }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = escapeHtml(image);
  const u = escapeHtml(url);
  return [
    `<meta name="description" content="${d}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${u}" />`,
    `<meta property="og:image" content="${i}" />`,
    `<meta property="og:image:type" content="${imageType}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${t}" />`,
    /* Large either way: the generic image is 1200x630 too. */
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${i}" />`,
  ].join("\n    ");
}

/** Swap the shell's description, og: and twitter: tags, and its title. */
function inject(html, tags, title) {
  return html
    .replace(/<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>\s*/g, "")
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace("</head>", `    ${tags}\n  </head>`);
}

function oneLine(s, max) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export default async function handler(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${host}`;

  const raw = String(req.query?.username || "");
  const slug = raw.toLowerCase();

  let html;
  try {
    html = await loadTemplate(origin, req.headers.cookie);
  } catch (e) {
    console.error("og-page: no index.html", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Something went wrong. Reload to try again.");
    return;
  }

  const row = SLUG.test(slug) ? await lookup(slug) : null;
  const image = row ? await ogImageUrl(row.user_id, row.updated_at) : null;

  const data = row?.data && typeof row.data === "object" ? row.data : {};
  const handle = row?.username || slug;
  const name = oneLine(data.name, 70);
  const statement = oneLine(data.statement, 200);

  const title = row ? name || handle : DEFAULT_TITLE;
  const description = row ? statement || DEFAULT_DESCRIPTION : DEFAULT_DESCRIPTION;
  const pageUrl = row ? `${origin}/${handle}` : `${origin}/${raw}`;

  const tags = headTags({
    title,
    description,
    image: image || `${origin}${DEFAULT_IMAGE_PATH}`,
    imageType: image ? "image/jpeg" : "image/png",
    url: pageUrl,
  });
  const pageTitle = row ? `${title} — moodscreen` : "moodscreen";

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  /* Short at the edge: a changed Moodscreen should unfurl as itself within a
   * minute, and stale-while-revalidate keeps the page fast while it does. */
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=600");
  res.end(inject(html, tags, pageTitle));
}
