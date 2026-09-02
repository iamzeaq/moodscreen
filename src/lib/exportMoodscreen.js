/**
 * PNG export — CLAUDE.md §7.
 *
 * The old path cloned the live card and re-styled the clone: it re-declared
 * the background, the type colours, the borders and the font stack, which is
 * exactly the drift §7 forbids. None of that is here.
 *
 * Instead there is a second <Moodscreen> mounted off-screen with
 * `forExport`, and this module photographs it. Same component, same layout,
 * same 360x450 box — captured at pixelRatio 3 for the 1080x1350 the spec
 * asks for. The only differences are the two the spec names, and they live
 * in the renderer, not here.
 *
 * The background is left transparent so the rounded corners stay cut. With
 * the die-cut border that makes the file read as a sticker when it lands on
 * a photo in stories.
 */
import { BASE_HEIGHT, BASE_WIDTH } from "../components/Moodscreen.jsx";

const CAPTURE_TIMEOUT_MS = 20000;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

/**
 * Wait for the faces the card actually draws with.
 *
 * `document.fonts.ready` alone is not enough and this is the single most
 * common cause of a broken export: a face that no node has requested yet is
 * not pending, so `ready` resolves immediately and the capture happens in
 * Arial. `load()` is what forces the request; `ready` then waits for it.
 */
export async function ensureMoodscreenFontsReady(theme) {
  if (typeof document === "undefined" || !document.fonts) return;

  const face = theme?.font;
  const wanted = [
    face ? `${face.weight} 34px "${face.faceFamily}"` : null,
    '400 12px "Switzer"',
    '500 13px "Switzer"',
    '600 15px "Switzer"',
  ].filter(Boolean);

  await Promise.allSettled(wanted.map((f) => document.fonts.load(f)));

  try {
    await document.fonts.ready;
  } catch {
    /* A failed `ready` is not a reason to abandon the capture. */
  }
}

/**
 * Embedding @font-face costs ~120kB of base64 and is identical on every
 * capture, so it is computed once and handed to html-to-image thereafter.
 * Without it, a Moodscreen re-rendered on every keystroke would re-inline
 * every woff2 each time.
 */
let fontEmbedCssPromise = null;

function getFontEmbedCss(node) {
  if (!fontEmbedCssPromise) {
    fontEmbedCssPromise = import("html-to-image")
      .then((m) => m.getFontEmbedCSS(node))
      .catch((e) => {
        console.warn("moodscreen export: could not pre-embed fonts", e);
        fontEmbedCssPromise = null;
        return undefined;
      });
  }
  return fontEmbedCssPromise;
}

/**
 * @param {HTMLElement} node the 360x450 card node, unscaled
 * @returns {Promise<Blob>}
 */
export async function captureMoodscreenBlob(node, { pixelRatio = 3 } = {}) {
  if (!node) throw new Error("No Moodscreen to export.");

  const width = node.offsetWidth || BASE_WIDTH;
  const height = node.offsetHeight || BASE_HEIGHT;
  if (width < 4 || height < 4) throw new Error("The Moodscreen has no layout yet.");

  const { toBlob } = await import("html-to-image");
  const fontEmbedCSS = await getFontEmbedCss(node);

  /* Two frames, so a just-changed statement has actually been painted. */
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const blob = await withTimeout(
    toBlob(node, {
      pixelRatio,
      width,
      height,
      /* Transparent, so the die-cut corners are really cut. */
      backgroundColor: undefined,
      cacheBust: false,
      skipFonts: false,
      fontEmbedCSS,
      type: "image/png",
    }),
    CAPTURE_TIMEOUT_MS,
    "PNG capture",
  );

  if (!blob || blob.size === 0) throw new Error("The capture came back empty.");
  return blob;
}

/** `moodscreen-{username}.png` — CLAUDE.md §7. */
export function exportFilename(username, name) {
  const slug = String(username || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  if (slug) return `moodscreen-${slug}.png`;

  const fromName = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);
  return fromName ? `moodscreen-${fromName}.png` : "moodscreen.png";
}
