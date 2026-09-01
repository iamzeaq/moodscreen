/**
 * Generates public/textures/grain.png — the tiled grain layer (CLAUDE.md §7).
 *
 * A PNG tile, deliberately not an SVG filter: html-to-image does not reliably
 * capture SVG filters, so filter-based grain vanishes from exports.
 *
 * Seeded, so re-running produces a byte-identical file.
 *
 *   node scripts/build-grain.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "textures", "grain.png");

const SIZE = 128;
const SEED = 0x6d6f6f64; // "mood"

/* ---------- PNG encoder (RGBA, 8-bit, no filtering) ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- grain ---------- */

function mulberry32(a) {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(SEED);
const px = Buffer.alloc(SIZE * SIZE * 4);

for (let i = 0; i < SIZE * SIZE; i += 1) {
  // Half the specks lift, half sink — so the tile works on any surface
  // lightness without tinting it.
  const light = rnd() < 0.5;
  // Gamma-biased alpha: mostly near-transparent, occasional bright speck.
  const alpha = Math.round(rnd() ** 1.7 * 255);
  const v = light ? 255 : 0;
  px[i * 4] = v;
  px[i * 4 + 1] = v;
  px[i * 4 + 2] = v;
  px[i * 4 + 3] = alpha;
}

await mkdir(path.dirname(OUT), { recursive: true });
const png = encodePng(SIZE, SIZE, px);
await writeFile(OUT, png);
console.log(`grain.png  ${SIZE}x${SIZE}  ${png.length} bytes  ->  ${path.relative(ROOT, OUT)}`);
