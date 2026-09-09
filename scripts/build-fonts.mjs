/**
 * Downloads and subsets the two self-hosted families into public/fonts.
 *
 *   node scripts/build-fonts.mjs
 *
 * CLAUDE.md §4: never a Google Fonts CDN link — html-to-image cannot embed a
 * cross-origin stylesheet, so exports silently fall back to Arial. Everything
 * ships from our own origin as woff2.
 *
 * Sources (fetched once, at build time, never at runtime):
 *   Switzer          — Fontshare, weights 400/500/600/700, the interface family
 *   Instrument Serif — Google Fonts, the `classic` theme
 *   Silkscreen       — Google Fonts, the `nokia` theme
 *   Bebas Neue       — Google Fonts, the `impact` theme
 *   JetBrains Mono   — Google Fonts, the `terminal` theme and all card metadata
 *
 * All OFL or Fontshare, all free to embed in a commercial product. Each is
 * then subset to the glyph set below with harfbuzz (subset-font).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "fonts");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

/**
 * Kept deliberately wide. These faces render user-authored statements, so a
 * tight subset would show tofu the moment someone types an accent or a curly
 * quote. Basic Latin + Latin-1 + Latin Extended-A + the punctuation and
 * currency people actually type.
 */
const CHARSET = [
  range(0x0020, 0x007e),
  range(0x00a0, 0x00ff),
  range(0x0100, 0x017f),
  "‐‑‒–—―",
  "‘’‚‛“”„",
  "†‡•…‰′″",
  "‹›‽",
  "₡₦₩₫€₱₹₺₽₾₿",
  "™℗←→−×÷",
].join("");

/**
 * For faces that simply do not have the wider coverage. Subsetting a pixel
 * font against accents it never drew produces a smaller file and identical
 * tofu, so there is no point pretending otherwise.
 */
const BASIC_LATIN = range(0x0020, 0x007e);

function range(from, to) {
  let s = "";
  for (let c = from; c <= to; c += 1) s += String.fromCodePoint(c);
  return s;
}

async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res;
}

async function emit(name, source, charset = CHARSET) {
  const before = source.length;
  const subset = await subsetFont(source, charset, { targetFormat: "woff2" });
  await writeFile(path.join(OUT, name), subset);
  const pct = Math.round((1 - subset.length / before) * 100);
  console.log(
    `${name.padEnd(28)} ${String(before).padStart(6)} B  ->  ${String(subset.length).padStart(6)} B  (-${pct}%)`,
  );
}

/** Pull the woff2 url + weight out of every upright @font-face in a stylesheet. */
function uprightFaces(css) {
  return [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)]
    .map(([, body]) => {
      const weight = Number((body.match(/font-weight:\s*(\d+)/) || [])[1]);
      const style = (body.match(/font-style:\s*([a-z]+)/) || [])[1] || "normal";
      const src = [...body.matchAll(/url\((["']?)(.*?)\1\)\s*format\((["']?)(.*?)\3\)/g)];
      const woff2 = src.find((s) => s[4] === "woff2");
      if (!weight || style !== "normal" || !woff2) return null;
      const url = woff2[2].startsWith("//") ? `https:${woff2[2]}` : woff2[2];
      return { weight, url };
    })
    .filter(Boolean);
}

await mkdir(OUT, { recursive: true });

/* ---------- Switzer — the interface family ---------- */
const switzerCss = await (
  await get("https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap")
).text();

const switzer = uprightFaces(switzerCss);
if (switzer.length !== 4) throw new Error(`expected 4 Switzer weights, got ${switzer.length}`);

for (const face of switzer) {
  const buf = Buffer.from(await (await get(face.url)).arrayBuffer());
  await emit(`Switzer-${face.weight}.woff2`, buf);
}

/* ---------- The Google-hosted faces ----------
 *
 * Silkscreen, Bebas Neue and JetBrains Mono, all OFL and all free to embed in
 * a commercial product. Fetched here at build time and served from our own
 * origin — the CDN link itself is what §4 forbids, not the foundry.
 *
 * Silkscreen is the one exception to the shared charset: it is a pixel face
 * with no Latin Extended coverage at all, so it is subset against whatever it
 * actually has rather than against a list it would mostly miss.
 */
const GOOGLE_FACES = [
  { file: "InstrumentSerif-400.woff2", family: "Instrument Serif", weight: 400 },
  { file: "Silkscreen-400.woff2", family: "Silkscreen", weight: 400, charset: BASIC_LATIN },
  { file: "BebasNeue-400.woff2", family: "Bebas Neue", weight: 400 },
  { file: "JetBrainsMono-400.woff2", family: "JetBrains Mono", weight: 400 },
  { file: "JetBrainsMono-500.woff2", family: "JetBrains Mono", weight: 500 },
];

for (const face of GOOGLE_FACES) {
  const query = `family=${face.family.replace(/ /g, "+")}:wght@${face.weight}`;
  const css = await (await get(`https://fonts.googleapis.com/css2?${query}&display=swap`)).text();

  const latin = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([\s\S]*?)\}/g)].find(
    ([, subset]) => subset === "latin",
  );
  if (!latin) throw new Error(`no \`latin\` slice in the ${face.family} stylesheet`);

  const url = (latin[2].match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
  if (!url) throw new Error(`no woff2 url in the ${face.family} \`latin\` slice`);

  const buf = Buffer.from(await (await get(url)).arrayBuffer());
  await emit(face.file, buf, face.charset);
}
