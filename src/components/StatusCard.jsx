/**
 * StatusCard — Live identity card: Twitter-adjacent layout, iOS-widget softness.
 * Max 420px, minimal typography, optional light mode.
 */

/** Card-only stack (preview); not global */
const CARD_FONT =
  '-apple-system, BlinkMacSystemFont, "Inter", sans-serif';

/** Display + href for subtle profile link (export-safe; lives inside #moodscreen-card) */
function getPublicSiteParts() {
  const raw =
    typeof import.meta !== "undefined" && typeof import.meta.env?.VITE_PUBLIC_SITE_URL === "string"
      ? import.meta.env.VITE_PUBLIC_SITE_URL.trim()
      : "";
  let base = "https://moodscreen.live";
  if (raw) {
    try {
      const u = raw.startsWith("http") ? raw : `https://${raw}`;
      base = new URL(u).origin.replace(/\/$/, "");
    } catch {
      /* keep default */
    }
  }
  let host = "moodscreen.live";
  try {
    host = new URL(base).hostname.replace(/^www\./, "");
  } catch {
    /* keep */
  }
  return { base, host };
}

/** Legacy "emoji label: quote" strings → structured rows */
function parseLegacyMoodLines(moodLines) {
  if (!Array.isArray(moodLines)) return [];
  const rows = [];
  for (const line of moodLines) {
    const s = String(line).trim();
    if (!s) continue;
    const idx = s.indexOf(": ");
    if (idx === -1) {
      rows.push({ category: "", quote: s });
    } else {
      rows.push({
        category: s.slice(0, idx).trim(),
        quote: s.slice(idx + 2).trim(),
      });
    }
  }
  return rows.filter((r) => (r.quote || "").trim() || (r.category || "").trim());
}

export default function StatusCard({
  name = "Name",
  avatar = null,
  initials = null,
  location = "",
  /** Preferred: [{ category: "🧠 in my mind", quote: "…" }] */
  moodRows = null,
  /** Legacy demos: "label: value" strings */
  moodLines = null,
  /** Legacy: single block */
  moodText = "",
  footerText = "",
  activeWithin48h = true,
  darkMode = true,
  /** Studio preview only — sets id for PNG export target (inner article) */
  isExportTarget = false,
  /** Public profile slug — shows `→ host/slug` when set (e.g. from profile or /:username) */
  profileUsername = null,
}) {
  const displayInitials = initials ?? (name || "?").slice(0, 2).toUpperCase();

  const dotColor = activeWithin48h ? "bg-[#22c55e]" : "bg-[#6b7280]";

  /* Solid backgrounds (no backdrop-blur) */
  const shell = darkMode
    ? "border border-white/[0.06] bg-black text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    : "border border-black/[0.08] bg-[#faf9f7] text-neutral-900 shadow-[0_8px_30px_rgba(0,0,0,0.08)]";

  const nameCls = "truncate text-[0.9375rem] font-semibold leading-tight tracking-[-0.02em]";
  const locCls = darkMode ? "mt-0.5 text-[0.8125rem] text-white/55" : "mt-0.5 text-[0.8125rem] text-neutral-500";
  const avatarRing = darkMode ? "ring-1 ring-white/[0.1]" : "ring-1 ring-black/[0.08]";
  const initialsCls = darkMode
    ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 text-[0.6875rem] font-semibold tracking-tight text-white"
    : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-zinc-200 to-zinc-400 text-[0.6875rem] font-semibold tracking-tight text-neutral-900";

  const categoryCls = darkMode
    ? "text-[13px] font-medium leading-snug tracking-[0.01em] text-white/60"
    : "text-[13px] font-medium leading-snug tracking-[0.01em] text-black/60";

  const quoteCls = darkMode
    ? "text-[16px] font-medium leading-[1.45] text-white/[0.9]"
    : "text-[16px] font-medium leading-[1.45] text-[rgba(0,0,0,0.9)]";

  const hasFooter = Boolean((footerText || "").trim());

  const identitySlug =
    typeof profileUsername === "string" && profileUsername.trim()
      ? profileUsername.trim().toLowerCase()
      : "";

  const { base, host } = getPublicSiteParts();
  const brandHref = identitySlug
    ? `${base}/${encodeURIComponent(identitySlug)}`
    : base;
  const brandLabel = identitySlug ? `${host}/${identitySlug}` : host;

  let resolvedRows = [];
  if (Array.isArray(moodRows) && moodRows.length) {
    resolvedRows = moodRows
      .map((r) => ({
        category: (r?.category || "").trim(),
        quote: (r?.quote || "").trim(),
      }))
      .filter((r) => r.quote || r.category);
  } else {
    const fromLines = parseLegacyMoodLines(moodLines);
    if (fromLines.length) {
      resolvedRows = fromLines;
    } else if ((moodText || "").trim()) {
      resolvedRows = [{ category: "", quote: (moodText || "").trim() }];
    }
  }

  return (
    <div className="status-card-root mx-auto min-w-0 w-full max-w-[420px]">
      <article
        id={isExportTarget ? "moodscreen-card" : undefined}
        className={[
          "status-card-ios relative min-w-0 w-full max-w-full rounded-[22px] p-5 transition-transform duration-200 ease-out hover:-translate-y-0.5",
          shell,
        ].join(" ")}
        style={{ fontFamily: CARD_FONT }}
      >
        {/* Top row — avatar, name + status dot, location */}
        <div className="flex items-start gap-3">
          <div className="relative h-11 w-11 shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                crossOrigin={
                  typeof avatar === "string" && /^https?:\/\//i.test(avatar)
                    ? "anonymous"
                    : undefined
                }
                className={`h-11 w-11 rounded-full object-cover ${avatarRing}`}
              />
            ) : (
              <div className={initialsCls} aria-hidden>
                {displayInitials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex min-w-0 max-w-full items-center gap-1">
              <h2 className={`${nameCls} min-w-0 shrink truncate`}>{name}</h2>
              <span
                className={`h-[7px] w-[7px] shrink-0 rounded-full ${dotColor}`}
                role="img"
                aria-label={activeWithin48h ? "Active in the last 48 hours" : "Inactive"}
              />
            </div>
            {(location || "").trim() ? (
              <p className={`mood-location ${locCls}`}>{location.trim()}</p>
            ) : null}
          </div>
        </div>

        {/* Mood entries — one unit per row: subtle label + main quote */}
        <div className="mt-2.5 min-w-0 w-full space-y-[14px]">
          {resolvedRows.length ? (
            resolvedRows.map((row, i) => (
              <div key={i} className="flex min-w-0 flex-col">
                {row.category ? (
                  <p className={`mood-category ${categoryCls}`}>{row.category}</p>
                ) : null}
                <p
                  className={[
                    "mood-text",
                    quoteCls,
                    row.category ? "mt-1" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {row.quote || "—"}
                </p>
              </div>
            ))
          ) : (
            <p className={`mood-text ${quoteCls}`}>—</p>
          )}
        </div>

        {/* Single brand line: host/username when slug set, else site host only (demos) */}
        <div className="moodscreen-link mt-3 pt-0.5">
          <a href={brandHref} target="_blank" rel="noopener noreferrer">
            {brandLabel}
          </a>
        </div>

        {hasFooter ? (
          <p
            className={
              darkMode
                ? "mood-footer mt-2.5 border-t border-white/[0.06] pt-2.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.14em] text-zinc-500"
                : "mood-footer mt-2.5 border-t border-black/[0.06] pt-2.5 text-center text-[0.625rem] font-medium uppercase tracking-[0.14em] text-zinc-500"
            }
          >
            {footerText}
          </p>
        ) : null}
      </article>
    </div>
  );
}
