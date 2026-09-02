/**
 * PNG export — CLAUDE.md §7.
 *
 * The old path cloned the live card and re-styled the clone: it re-declared
 * the background, the type colours, the borders and the font stack, which is
 * exactly the drift §7 forbids. None of that is here.
 *
 * Instead there are <Moodscreen>s mounted off-screen with `forExport`, and
 * this module photographs one of them. Same component, same layout, same
 * 540x540 box — captured at pixelRatio 3 for the 1620x1620 §7.8 asks for. The
 * only differences are the ones the spec names, and they live in the renderer
 * and its export wrappers, not here.
 *
 * Two modes, and the default is the one with a backdrop. That is a
 * deliverability decision rather than an aesthetic one: WhatsApp converts to
 * JPEG, which has no transparency, so a transparent file comes back with
 * blocks where the bow should be. `sticker` is for IG and Snap, where
 * transparency survives and the screen genuinely sits on the person's photo.
 */
import { BASE_SIZE } from "../components/Moodscreen.jsx";
import { EXPORT_NODE_IDS } from "../components/MoodscreenExportSurface.jsx";

/** §7.8 — `default` carries the backdrop, `sticker` is cut to the path. */
export const DEFAULT_EXPORT_MODE = "default";

export function exportNodeId(mode = DEFAULT_EXPORT_MODE) {
  return EXPORT_NODE_IDS[mode] ?? EXPORT_NODE_IDS[DEFAULT_EXPORT_MODE];
}

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
    /* §7.5 sets the timestamp, the name and the mood label in mono, so the
     * card draws with this face on every theme, not just `terminal`. */
    '400 12px "JetBrains Mono"',
    '600 13px "Switzer"',
    '700 15px "Switzer"',
    '500 15px "Switzer"',
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
 * @param {HTMLElement} node the 540x540 export node, unscaled
 * @returns {Promise<Blob>}
 */
export async function captureMoodscreenBlob(node, { pixelRatio = 3 } = {}) {
  if (!node) throw new Error("No Moodscreen to export.");

  const width = node.offsetWidth || BASE_SIZE;
  const height = node.offsetHeight || BASE_SIZE;
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
      /* Left transparent either way. In `default` the backdrop is a real
       * element inside the captured node, so it paints itself; in `sticker`
       * transparency outside the screen path is the entire point. */
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
