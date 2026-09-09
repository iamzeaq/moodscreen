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
 * Embedding @font-face costs ~120kB of base64, so it is computed once and
 * handed to html-to-image thereafter. Without it, a Moodscreen re-rendered on
 * every keystroke would re-inline every woff2 each time.
 *
 * Keyed by display face, and that key is the whole point. `getFontEmbedCSS`
 * inlines the faces the node is *currently using*, so a single cached result
 * is only correct for the theme that happened to be active on the first
 * capture. Every other theme then exported with that theme's font embedded and
 * its own missing, and the statement — the one thing on the card set in the
 * display face — came back in Arial while the mono chrome, embedded on every
 * pass because every theme uses it, looked perfectly fine. That combination is
 * what makes this worth a comment: the symptom points at the statement, and
 * the cause is a cache that does not know themes exist.
 */
const fontEmbedCssByFace = new Map();

function getFontEmbedCss(node, faceFamily) {
  const key = faceFamily || "default";

  if (!fontEmbedCssByFace.has(key)) {
    fontEmbedCssByFace.set(
      key,
      import("html-to-image")
        .then((m) => m.getFontEmbedCSS(node))
        .catch((e) => {
          console.warn("moodscreen export: could not pre-embed fonts", e);
          fontEmbedCssByFace.delete(key);
          return undefined;
        }),
    );
  }

  return fontEmbedCssByFace.get(key);
}

/**
 * @param {HTMLElement} node the 540x540 export node, unscaled
 * @param {{ pixelRatio?: number, theme?: object }} [options] the active theme,
 *   so the embedded @font-face set is the one this card actually draws with
 * @returns {Promise<Blob>}
 */
export async function captureMoodscreenBlob(node, { pixelRatio = 3, theme } = {}) {
  if (!node) throw new Error("No Moodscreen to export.");

  const width = node.offsetWidth || BASE_SIZE;
  const height = node.offsetHeight || BASE_SIZE;
  if (width < 4 || height < 4) throw new Error("The Moodscreen has no layout yet.");

  /* The face has to be loaded before the CSS that embeds it is built, or the
   * cache stores a result with nothing in it for this theme. */
  await ensureMoodscreenFontsReady(theme);

  const { toBlob } = await import("html-to-image");
  const fontEmbedCSS = await getFontEmbedCss(node, theme?.font?.faceFamily);

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
