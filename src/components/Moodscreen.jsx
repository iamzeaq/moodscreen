/**
 * <Moodscreen> — CLAUDE.md §7. This is the product.
 *
 * ONE component renders both the on-screen preview and the exported image.
 * There is no second layout in the export path and there must never be one;
 * if the export re-implemented this, the two would drift and you would be
 * fixing it forever.
 *
 * The trick that makes that hold: the card always lays out at exactly
 * 360x450 CSS pixels. `width` scales it for display with a transform, which
 * changes nothing about the layout. Export captures the same 360x450 node at
 * pixelRatio 3, giving the 1080x1350 the spec asks for. So the character-count
 * font ladder is exact, and "identical to the preview" is true by
 * construction rather than by inspection.
 *
 * The only two things `forExport` changes are named in the spec: the mood
 * fill goes back to full chroma, and a die-cut border appears so the image
 * reads as a sticker when it lands on a photo in stories.
 *
 * The theme arrives as data. Adding a theme must never require editing this
 * file — see src/themes/index.js.
 */
import { useEffect, useRef, useState } from "react";
import MoodGlyph from "./MoodGlyph.jsx";
import { getMood, MOODS } from "../lib/moods.js";
import { statementSize } from "../lib/statementFit.js";
import { getTheme } from "../themes/index.js";
import { resolveSurface } from "../themes/surface.js";

/** The card's one true size. Export is this at 3x. */
export const BASE_WIDTH = 360;
export const BASE_HEIGHT = 450;

const PAD = 24;

/** Ink alpha per tier. The statement and the URL both run at full strength. */
const INK_LABEL = 0.72;
const INK_LOCATION = 0.62;

const GRAIN_OPACITY = 0.08;
const WATERMARK_OPACITY = 0.16;
const CROP_MARK_ALPHA = 0.4;

const FALLBACK_MOOD = MOODS[0];

function withAlpha(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${a})`;
}

/**
 * Moment 1 of the motion budget: a mood change cross-fades the colour and
 * the glyph over 240ms. The colour is a transition on the card; the glyph
 * has to be two layers, because it is swapped rather than tweened. Holds the
 * outgoing mood for exactly one cross-fade, then drops it.
 */
function useOutgoingMood(moodId, enabled) {
  const [outgoing, setOutgoing] = useState(null);
  const current = useRef(moodId);

  useEffect(() => {
    if (!enabled) {
      current.current = moodId;
      return undefined;
    }
    if (current.current === moodId) return undefined;
    const previous = current.current;
    current.current = moodId;
    setOutgoing(previous);
    const t = window.setTimeout(() => setOutgoing(null), 240);
    return () => window.clearTimeout(t);
  }, [moodId, enabled]);

  return outgoing;
}

/* ------------------------------------------------------------------ layers */

/** Texture move 1 — a tiled PNG, never an SVG filter (exports drop those). */
function Texture({ kind, ink }) {
  if (kind === "none") return null;

  if (kind === "halftone") {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.14,
          backgroundImage: `radial-gradient(${ink} 0.9px, transparent 1px)`,
          backgroundSize: "5px 5px",
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: GRAIN_OPACITY,
        backgroundImage: "var(--grain-url)",
        backgroundSize: "var(--grain-size) var(--grain-size)",
        backgroundRepeat: "repeat",
      }}
    />
  );
}

/**
 * Texture move 2 — 1.5px L-brackets in the card's ink at 40%. Reads as a
 * printed artifact rather than a div.
 */
function CropMarks({ ink }) {
  const line = `1.5px solid ${withAlpha(ink, CROP_MARK_ALPHA)}`;
  const arm = 13;
  const inset = 13;

  const corners = [
    { top: inset, left: inset, borderTop: line, borderLeft: line },
    { top: inset, right: inset, borderTop: line, borderRight: line },
    { bottom: inset, left: inset, borderBottom: line, borderLeft: line },
    { bottom: inset, right: inset, borderBottom: line, borderRight: line },
  ];

  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {corners.map((c, i) => (
        <span key={i} style={{ position: "absolute", width: arm, height: arm, ...c }} />
      ))}
    </div>
  );
}

/**
 * Texture move 3 — the mood glyph, large and cropped by the card edge.
 * Cropping matters: a centred glyph looks like a placeholder.
 */
function Watermark({ moodId, ink, leaving = false }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        right: -74,
        bottom: -66,
        width: 300,
        height: 300,
        color: ink,
        pointerEvents: "none",
        opacity: leaving ? 0 : WATERMARK_OPACITY,
        animation: leaving ? "moodscreen-glyph-out 240ms var(--ease) forwards" : undefined,
      }}
    >
      <MoodGlyph mood={moodId} size="100%" strokeWidth={0.4} />
    </div>
  );
}

/* -------------------------------------------------------------------- card */

export default function Moodscreen({
  mood: moodId = "thinking",
  statement = "",
  name = "",
  location = "",
  username = "",
  theme: themeInput,
  themeId,
  /** Display width in px. Layout is always 360 wide; this only scales it. */
  width = BASE_WIDTH,
  /** Full-chroma fill and the die-cut border. Set by the export surface only. */
  forExport = false,
  id,
  className = "",
  style,
  ...rest
}) {
  const theme = themeInput ?? getTheme(themeId);
  const mood = getMood(moodId) ?? FALLBACK_MOOD;
  const outgoingMoodId = useOutgoingMood(moodId, !forExport && theme.glyph === "watermark");

  const { background, ink } = resolveSurface(theme, mood, { forExport });
  const size = statementSize(statement, theme.font);
  const scale = width / BASE_WIDTH;

  /* The light edge: one pixel, and how dark UI gets dimension without
   * shadows. The export adds the die-cut ring on top of it. */
  const edges = ["inset 0 1px 0 rgb(255 255 255 / 0.28)"];
  if (forExport) edges.push("inset 0 0 0 3px rgb(252 252 250 / 0.95)");

  const url = `moodscreen.live/${(username || "").trim().toLowerCase()}`.replace(/\/$/, "");

  return (
    <div
      className={className}
      style={{ width, height: width * (BASE_HEIGHT / BASE_WIDTH), ...style }}
      {...rest}
    >
      <div
        id={id}
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          overflow: "hidden",
          borderRadius: theme.radius,
          background,
          color: ink,
          boxShadow: edges.join(", "),
          fontFamily: "var(--font-ui)",
          /* Moment 1: the colour cross-fade. Never during a capture. */
          transitionProperty: forExport ? "none" : "background-color, color",
          transitionDuration: "240ms",
          transitionTimingFunction: "var(--ease)",
        }}
      >
        {theme.glyph === "watermark" ? (
          <>
            {outgoingMoodId ? <Watermark moodId={outgoingMoodId} ink={ink} leaving /> : null}
            <Watermark moodId={moodId} ink={ink} />
          </>
        ) : null}

        <Texture kind={theme.texture} ink={ink} />
        <CropMarks ink={ink} />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: PAD,
            boxSizing: "border-box",
          }}
        >
          {/* Tier 2 — the mood, in sentence case beside its glyph. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: withAlpha(ink, INK_LABEL),
              flex: "none",
            }}
          >
            {theme.glyph === "none" ? null : (
              <MoodGlyph mood={moodId} size={17} strokeWidth={1.6} />
            )}
            <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0, lineHeight: 1 }}>
              {mood.label}
            </span>
          </div>

          {/* Tier 1 — the statement. The only thing readable across a room. */}
          <div
            style={{
              flex: "1 1 auto",
              display: "flex",
              alignItems: "center",
              minHeight: 0,
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: theme.font.family,
                fontWeight: theme.font.weight,
                fontSize: size,
                letterSpacing: theme.font.tracking,
                lineHeight: 1.25,
                overflowWrap: "break-word",
                wordBreak: "break-word",
                width: "100%",
              }}
            >
              {statement}
            </p>
          </div>

          {/* Tier 2 and 3 — never joined with middle dots. Stacked and spaced. */}
          <footer
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 12,
              flex: "none",
            }}
          >
            <div style={{ minWidth: 0 }}>
              {name ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </p>
              ) : null}
              {location ? (
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 12,
                    fontWeight: 400,
                    letterSpacing: "0.01em",
                    lineHeight: 1.2,
                    color: withAlpha(ink, INK_LOCATION),
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {location}
                </p>
              ) : null}
            </div>

            {/* The growth mechanism. Full ink, near the name's weight — this
              * is not a footnote, and it has to survive a thumbnail. */}
            <p
              style={{
                margin: 0,
                flex: "none",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              {url}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
