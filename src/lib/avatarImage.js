/**
 * Turning a chosen file into an avatar the card can carry.
 *
 * §1 is guest-first, so this has to work with no account and no server: the
 * result is stored in the same localStorage object as everything else. That
 * constrains the whole design.
 *
 * - **It must be a data URL, not a `blob:` one.** A blob URL dies with the
 *   page, and the persistence layer rejects them for exactly that reason. It
 *   would also export as a broken image, since html-to-image cannot fetch a
 *   revoked object URL.
 * - **It must be small.** localStorage is a few megabytes for the whole
 *   origin, and a phone camera JPEG is several on its own. One photo would
 *   evict the Moodscreen it was attached to.
 *
 * So the file is drawn down to a square thumbnail and re-encoded. The avatar
 * is 30px on the card and the export runs at 3x, so 90px is the largest size
 * that is ever actually sampled; SIZE is that with room to spare and nothing
 * more, because every pixel above it costs storage the user cannot see.
 */

/** Square edge, in px. 30px avatar x 3 for export, rounded up for headroom. */
const SIZE = 128;

/** Refuse before reading, so a 40MB photo never enters memory. */
export const MAX_FILE_BYTES = 12 * 1024 * 1024;

/**
 * The ceiling for the encoded string. Comfortably under any localStorage
 * budget while leaving the quality ladder somewhere to stop.
 */
const MAX_DATA_URL_BYTES = 96 * 1024;

/** Tried in order; the first the browser actually produces is used. */
const TYPES = ["image/webp", "image/jpeg"];
const QUALITIES = [0.82, 0.7, 0.6, 0.5];

/**
 * Decode to something drawable, honouring EXIF rotation.
 *
 * `createImageBitmap` with `imageOrientation: "from-image"` is the only way to
 * get a portrait phone photo the right way up without parsing EXIF by hand.
 * Where it is missing or refuses the option, an <img> is close enough — modern
 * browsers auto-orient those too.
 */
async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* Safari once threw on the options bag; fall through. */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That file could not be read as an image."));
      img.src = url;
    });
  } finally {
    /* Revoked immediately: the bitmap is already decoded, and the URL must not
     * outlive this function or it ends up somewhere it can be persisted. */
    URL.revokeObjectURL(url);
  }
}

/**
 * @param {File} file
 * @returns {Promise<string>} a `data:` URL, square, at most SIZE px a side
 */
export async function fileToAvatarDataUrl(file) {
  if (!file) throw new Error("No file chosen.");
  if (!/^image\//.test(file.type)) throw new Error("Choose an image file.");
  if (file.size > MAX_FILE_BYTES) throw new Error("That image is too large. Try one under 12MB.");

  const source = await decode(file);
  const sw = source.width;
  const sh = source.height;
  if (!sw || !sh) throw new Error("That image has no size.");

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot process the image.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  /* Cover, centred — the card crops to a circle, so anything that does not
   * fill the square would show the canvas through the disc. */
  const scale = Math.max(SIZE / sw, SIZE / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(source, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);

  if (typeof source.close === "function") source.close();

  let best = null;
  for (const type of TYPES) {
    for (const quality of QUALITIES) {
      const url = canvas.toDataURL(type, quality);
      /* A browser that cannot encode the type silently hands back a PNG, so
       * the prefix is the only honest test of whether it worked. */
      if (!url.startsWith(`data:${type}`)) break;
      if (!best || url.length < best.length) best = url;
      if (url.length <= MAX_DATA_URL_BYTES) return url;
    }
  }

  /* Neither type available — PNG is large but correct, and at 128px square it
   * is still tens of kilobytes rather than megabytes. */
  const png = canvas.toDataURL("image/png");
  if (!best || png.length < best.length) best = png;

  if (best.length > MAX_DATA_URL_BYTES * 4) {
    throw new Error("That image could not be made small enough. Try another.");
  }
  return best;
}
