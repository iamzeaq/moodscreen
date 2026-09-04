/**
 * The wall — CLAUDE.md §9, section 3.
 *
 * "Full-bleed, no max-width. Two rows of real public Moodscreens scrolling
 * opposite directions, `mask-image` fading both ends. Every one links to its
 * live page."
 *
 * This is the section that gives the page its spine. §9 asks for the rhythm
 * contained → contained → **full-bleed** → contained → scroller → contained,
 * and the break in the middle is this: it is the only thing on the page that
 * ignores the 1120px column entirely, so it has to actually reach both edges of
 * the viewport rather than being a wide container.
 *
 * Two rows and not one, opposite directions and not the same, because a single
 * band reads as a ticker — a thing announcing something — and two bands moving
 * against each other read as a wall you are walking past. The second row is the
 * same tiles rotated half a turn out of phase, so neither row is a copy of the
 * other at any moment and a short list still fills both.
 *
 * There is no visible heading. A caption over a full-bleed band would put a
 * contained element back on top of the one section that breaks out, and the
 * wall is thirty Moodscreens saying what they are — it does not need to be
 * introduced. The label is on the section for anything not looking at it.
 *
 * Visibility is the caller's: §9 hides the wall when it is empty, and the
 * landing page needs that answer before it picks §9.7 divider directions.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Moodscreen from "./Moodscreen.jsx";
import { getMood } from "../lib/moods.js";

/**
 * Tile size by viewport.
 *
 * <Moodscreen> lays out at 540 and scales by transform, so this is a display
 * width and nothing about the card's internals moves with it. Small enough that
 * two rows fit above the fold on a phone without either becoming a strip of
 * unreadable colour.
 */
function tileSizeFor(width) {
  if (width < 640) return 156;
  if (width < 1024) return 184;
  return 208;
}

function useTileSize() {
  const [size, setSize] = useState(() =>
    tileSizeFor(typeof window === "undefined" ? 1280 : window.innerWidth),
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const apply = () => setSize(tileSizeFor(window.innerWidth));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return size;
}

const GAP = 16;

/** Pixels a second. Slow enough to read a tile as it passes. */
const SPEED = 26;

/** Enough tiles that a row is a wall rather than a queue, even with few real ones. */
const MIN_PER_ROW = 12;

function fill(list, min) {
  if (list.length === 0) return [];
  const out = [...list];
  while (out.length < min) out.push(...list);
  return out;
}

function rotate(list, by) {
  if (list.length === 0) return [];
  const n = ((by % list.length) + list.length) % list.length;
  return [...list.slice(n), ...list.slice(0, n)];
}

function Tile({ tile, size }) {
  const mood = getMood(tile.mood);
  const label = `${tile.name || tile.username} is ${
    mood ? mood.label.toLowerCase() : "on something"
  }: ${tile.statement}`;

  return (
    <Link
      to={`/${tile.username}`}
      aria-label={label}
      className="block shrink-0 rounded-[var(--r-lg)] outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      style={{ marginRight: GAP }}
    >
      {/* The same component as the hero preview and the export (§7). A wall
        * tile is a Moodscreen at a smaller display width and nothing else — no
        * reduced variant, or the wall would drift from the product. */}
      <Moodscreen {...tile} width={size} />
    </Link>
  );
}

function Row({ tiles, size, direction, leadRef }) {
  /* Constant speed whatever the row is holding: the track travels one copy's
   * width per cycle, so the duration is that width over the speed. */
  const copyWidth = tiles.length * (size + GAP);
  const duration = Math.max(60, Math.round(copyWidth / SPEED));

  /* `overflow` lives on `.wall-row` in base.css rather than as a utility here,
   * so the reduced-motion block can turn the row into a scroller without
   * fighting Tailwind on specificity. */
  return (
    <div className="wall-row relative w-full">
      <div
        className="wall-track"
        data-direction={direction}
        style={{ "--wall-duration": `${duration}s` }}
      >
        {/* Two copies, which is what makes -50% seamless. The second is hidden
          * from the accessibility tree — it is the same thirty links again. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex" aria-hidden={copy === 1 ? "true" : undefined}>
            {tiles.map((tile, i) => (
              <Tile key={`${copy}-${i}-${tile.username}`} tile={tile} size={size} />
            ))}
          </div>
        ))}
      </div>

      {/* Where the hero's Moodscreen lands (§6, moment 4). An empty box at the
        * row's leading edge, inside the mask's fade, measured rather than drawn
        * — the flight needs a target that does not move with the track. */}
      {leadRef ? (
        <div
          ref={leadRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-[7%] top-0"
          style={{ width: size, height: size }}
        />
      ) : null}
    </div>
  );
}

export default function WallSection({ tiles, joinTargetRef }) {
  const size = useTileSize();

  if (!tiles || tiles.length === 0) return null;

  const rowA = fill(tiles, MIN_PER_ROW);
  const rowB = fill(rotate(tiles, Math.max(1, Math.floor(tiles.length / 2))), MIN_PER_ROW);

  return (
    <section
      /* Full-bleed. Nothing here is inside the content column — that is the
        * point of this section in §9's rhythm. */
      className="relative w-full overflow-hidden py-14 sm:py-20"
      aria-label="Moodscreens people are sharing right now"
    >
      <div className="flex flex-col" style={{ gap: GAP }}>
        <Row tiles={rowA} size={size} direction="forward" leadRef={joinTargetRef} />
        <Row tiles={rowB} size={size} direction="reverse" />
      </div>
    </section>
  );
}
