/**
 * PNG export — off-screen clone of #moodscreen-card with export-only styling (UI card unchanged).
 *
 * Uses html-to-image (not html2canvas) so Tailwind v4 / oklab() colors do not break the parser.
 * Remote profile photos are inlined as data URLs on the live card before cloning so CORS/taint is avoided.
 */

/** Match StatusCard dark shell — pure black for sharp export */
const EXPORT_BG = "#000000";
const EXPORT_FONT =
  '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
const EXPORT_TEXT_PRIMARY = "rgba(255, 255, 255, 0.92)";
const EXPORT_TEXT_SECONDARY = "rgba(255, 255, 255, 0.6)";
const EXPORT_TEXT_MUTED = "rgba(255, 255, 255, 0.45)";

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      window.setTimeout(() => reject(new Error(`${label} timed out`)), ms),
    ),
  ]);
}

export function waitForImages(root) {
  if (!root?.querySelectorAll) return Promise.resolve();
  const imgs = root.querySelectorAll("img");
  return Promise.all(
    [...imgs].map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          setTimeout(done, 5000);
        }),
    ),
  );
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

async function waitImageReady(img) {
  if (img.decode) {
    try {
      await img.decode();
      return;
    } catch {
      /* fall through */
    }
  }
  if (img.complete && img.naturalWidth > 0) return;
  await new Promise((resolve) => {
    const done = () => resolve();
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    setTimeout(done, 8000);
  });
}

/**
 * Replace remote <img> sources with same-pixel data URLs so export is not CORS/taint-blocked.
 * Returns a function that restores original attributes (call in finally).
 */
async function inlineRemoteImagesForExport(root) {
  const imgs = [...root.querySelectorAll("img")];
  const snapshots = [];

  for (const img of imgs) {
    const raw = img.getAttribute("src");
    if (!raw || raw.startsWith("data:")) continue;

    let url;
    try {
      url = new URL(raw, document.baseURI).href;
    } catch {
      continue;
    }

    try {
      const res = await fetch(url, {
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
      });
      if (!res.ok) continue;
      const blob = await res.blob();
      if (!blob || blob.size === 0) continue;
      const dataUrl = await blobToDataUrl(blob);

      snapshots.push({
        img,
        srcAttr: img.getAttribute("src"),
        srcsetAttr: img.getAttribute("srcset"),
      });
      img.removeAttribute("srcset");
      img.src = dataUrl;
      await waitImageReady(img);
    } catch (e) {
      console.warn("png export: could not inline image (CORS or network)", url, e);
    }
  }

  return () => {
    for (const s of snapshots) {
      if (s.srcsetAttr != null) s.img.setAttribute("srcset", s.srcsetAttr);
      else s.img.removeAttribute("srcset");
      if (s.srcAttr != null) s.img.setAttribute("src", s.srcAttr);
      else s.img.removeAttribute("src");
    }
  };
}

function replaceHttpLinksWithSpans(root) {
  root.querySelectorAll('a[href^="http"]').forEach((a) => {
    const span = document.createElement("span");
    span.textContent = a.textContent;
    span.className = a.className;
    a.replaceWith(span);
  });
}

function stripInnerBordersForExport(clone) {
  clone.querySelectorAll('[class*="border-t"]').forEach((el) => {
    el.style.borderTop = "none";
    el.style.borderTopWidth = "0";
  });
}

/** Export-only shell: sharp rectangle, deep black, no border/shadow/glow (does not affect live DOM). */
function applyExportShellStyles(clone, widthPx) {
  const el = clone;
  el.style.margin = "0";
  el.style.borderRadius = "0";
  el.style.overflow = "hidden";
  el.style.background = EXPORT_BG;
  el.style.boxShadow = "none";
  el.style.border = "none";
  el.style.outline = "none";
  el.style.transform = "none";
  el.style.transition = "none";
  el.style.boxSizing = "border-box";
  el.style.width = `${widthPx}px`;
  el.style.maxWidth = `${widthPx}px`;
  el.style.height = "auto";
  el.style.fontFamily = EXPORT_FONT;
  el.style.lineHeight = "normal";
  el.style.webkitFontSmoothing = "antialiased";

  el.querySelectorAll("img").forEach((img) => {
    img.style.boxShadow = "none";
    img.style.outline = "none";
  });
}

/** Twitter/X-style contrast on the clone only (primary / secondary / muted). */
function applyExportTypography(clone) {
  clone.querySelectorAll("h2").forEach((el) => {
    el.style.setProperty("color", EXPORT_TEXT_PRIMARY, "important");
  });

  clone.querySelectorAll("p").forEach((el) => {
    const c = typeof el.className === "string" ? el.className : "";
    const isSecondary =
      c.includes("text-white/55") ||
      c.includes("text-white/60") ||
      c.includes("text-black/60") ||
      c.includes("text-neutral-500") ||
      c.includes("text-zinc-500");
    el.style.setProperty(
      "color",
      isSecondary ? EXPORT_TEXT_SECONDARY : EXPORT_TEXT_PRIMARY,
      "important",
    );
  });

  clone.querySelectorAll("a").forEach((el) => {
    el.style.setProperty("color", EXPORT_TEXT_MUTED, "important");
  });

  clone.querySelectorAll("div").forEach((el) => {
    const c = typeof el.className === "string" ? el.className : "";
    if (
      c.includes("rounded-full") &&
      c.includes("font-semibold") &&
      el.children.length === 0 &&
      (el.textContent || "").trim().length <= 3
    ) {
      el.style.setProperty("color", EXPORT_TEXT_PRIMARY, "important");
    }
  });
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b && b.size > 0) resolve(b);
        else reject(new Error("Empty PNG blob."));
      },
      "image/png",
      1,
    );
  });
}

/**
 * @returns {Promise<Blob>}
 */
export async function captureMoodscreenCardToPngBlob() {
  const liveCard = document.getElementById("moodscreen-card");
  if (!liveCard) {
    throw new Error("Card not found.");
  }

  const w = Math.ceil(liveCard.offsetWidth);
  const h = Math.ceil(liveCard.offsetHeight);
  if (w < 4 || h < 4) {
    throw new Error("Card has no layout.");
  }

  await waitForImages(liveCard);
  const restoreLiveImages = await inlineRemoteImagesForExport(liveCard);

  try {
    const clone = liveCard.cloneNode(true);
    clone.removeAttribute("id");
    applyExportShellStyles(clone, w);
    applyExportTypography(clone);
    stripInnerBordersForExport(clone);
    replaceHttpLinksWithSpans(clone);

    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    /* line-height must not be 0 — it breaks flex/text metrics vs on-screen layout */
    host.style.cssText =
      "position:fixed;left:-99999px;top:0;margin:0;padding:0;border:0;background:transparent;line-height:normal;z-index:-1;overflow:visible;";
    host.style.fontFamily = EXPORT_FONT;
    host.appendChild(clone);
    document.body.appendChild(host);

    try {
      await waitForImages(clone);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const wh = Math.ceil(clone.offsetHeight);
      const ww = Math.ceil(clone.offsetWidth);

      const captureOpts = {
        pixelRatio: 2,
        backgroundColor: EXPORT_BG,
        cacheBust: true,
        /* Must embed @font-face (Inter) or metrics differ from the live preview */
        skipFonts: false,
        width: ww || w,
        height: wh || h,
      };

      const { toCanvas, toBlob } = await import("html-to-image");

      try {
        const canvas = await withTimeout(
          toCanvas(clone, captureOpts),
          25000,
          "PNG capture (toCanvas)",
        );
        if (canvas.width && canvas.height) {
          return await canvasToPngBlob(canvas);
        }
      } catch (e) {
        console.warn("html-to-image toCanvas failed:", e);
      }

      try {
        const blob = await withTimeout(
          toBlob(clone, {
            ...captureOpts,
            type: "image/png",
          }),
          25000,
          "PNG capture (toBlob)",
        );
        if (blob && blob.size > 0) return blob;
      } catch (e) {
        console.warn("html-to-image toBlob failed:", e);
      }

      throw new Error(
        "Could not export the card. If you use a profile photo, its host must allow cross-origin access (or try initials only).",
      );
    } finally {
      host.remove();
    }
  } finally {
    restoreLiveImages();
  }
}
