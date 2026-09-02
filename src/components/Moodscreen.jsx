/**
 * <Moodscreen> — CLAUDE.md §7. This is the product.
 *
 * ONE component renders both the on-screen preview and the exported image.
 * There is no second layout in the export path and there must never be one; if
 * the export re-implemented this, the two would drift and you would be fixing
 * it forever. That rule survived the §7 rewrite unchanged and is the reason
 * the export modes live in MoodscreenExportSurface as wrappers around this
 * component rather than as a second renderer.
 *
 * The trick that makes it hold: the card always lays out at exactly 540x540
 * CSS pixels. `width` scales it for display with a transform, which changes
 * nothing about the layout. Export captures the same node at pixelRatio 3,
 * giving the 1620x1620 §7.8 asks for. So the character-count ladder is exact
 * and "identical to the preview" is true by construction, not by inspection.
 *
 * What this component does *not* decide: the colour (the mood owns it), the
 * arrangement (the user owns it, via `surface`), or the hour (the timestamp
 * owns it). All three arrive as data and meet in resolveSurface.
 */
import { useEffect, useRef, useState } from "react";
import Logo from "./brand/Logo.jsx";
import { getMood, MOODS } from "../lib/moods.js";
import { SAFE_INSET, screenPathAt } from "../lib/screen.js";
import { statementSize } from "../lib/statementFit.js";
import { applyCase, getTheme } from "../themes/index.js";
import { DEFAULT_SURFACE, resolveSurface } from "../themes/surface.js";

/** The card's one true size. Export is this at 3x. */
export const BASE_SIZE = 540;

/** §7.1 — the corners curve inward, so content sits further in than a rect. */
const SAFE = Math.round(BASE_SIZE * SAFE_INSET);

/** Baked once: the clip every layer inside the screen is cut to. */
const CLIP = `path("${screenPathAt(BASE_SIZE)}")`;

/**
 * §7.3 — texture strength per surface. Dark texture on a light field reads
 * much stronger, so `paper` needs both of these dialled back hard.
 */
const SCANLINE_OPACITY = { colour: 0.13, ink: 0.12, paper: 0.07 };
const VIGNETTE_OPACITY = { colour: 0.14, ink: 0.1, paper: 0.07 };

const GRAIN_OPACITY = 0.07;
const WATERMARK_OPACITY = 0.16;

/**
 * The watermark's size and offsets — and why it is not cropped.
 *
 * §7.3 asks for the face cropped by the screen edge. That works for a glyph
 * with mass to spare at its edges. This mark has none: it is three thin
 * strokes around a lot of empty space, and its extremities *are* its features,
 * so a crop deep enough to read as a crop takes an eye with it. Cropping 15%
 * of the ink width removed 70% of the right eye and left the two stray bars
 * that read as a rendering fault. There is no offset that crops this face and
 * keeps it a face.
 *
 * So it sits whole, low and right — off-centre enough not to read as the
 * placeholder §7.5 warns a centred glyph becomes, and large enough at 161 x
 * 247px to be a deliberate mark rather than an artifact. If it has to be
 * cropped, the mark needs a filled variant to crop into; that is a drawing
 * job, not an offset.
 */
const WATERMARK_SIZE = 460;
const WATERMARK_RIGHT = -138;
const WATERMARK_BOTTOM = -28;

/** §7.5 — ink alphas for the three quiet tiers. */
const INK_TIMESTAMP = 0.7;
const INK_NAME = 0.7;
const INK_LABEL = 0.72;

/**
 * A multiplier on those alphas, per surface.
 *
 * `colour` is where ink and field sit closest together: the saturated hues
 * cannot reach 4.5:1 with a same-hue ink at any hour (see themes/surface.js),
 * and 70% of an ink that is already at 3.3:1 is not readable at 12px. The
 * statement is large enough not to care. This small metadata is not, so it
 * gives most of that alpha back on `colour` and keeps §7.5's values on the two
 * neutral fields, where the ink has all the contrast it needs.
 */
const META_ALPHA = { colour: 1.25, ink: 1, paper: 1 };

const alphaFor = (base, surface) => Math.min(base * META_ALPHA[surface], 1);

const FALLBACK_MOOD = MOODS[0];

function withAlpha(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${a})`;
}

/** §7.5 — the timestamp, in the hour the card is *of*. */
function formatTime(at) {
  const d = at instanceof Date ? at : new Date(at ?? Date.now());
  if (Number.isNaN(d.valueOf())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Moment 1 of the motion budget: a mood change cross-fades the colour and the
 * glyph over 240ms. The colour is a transition on the card; the glyph has to
 * be two layers, because it is swapped rather than tweened.
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

/**
 * Layer 3 — the vignette.
 *
 * It must stay invisible as an effect: if you can point at it, it is too
 * strong. It exists to make the screen read as convex and to push attention to
 * the middle. The grain sitting above it also dithers away the banding JPEG
 * would otherwise show in the corners.
 */
function Vignette({ ink, surface }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `radial-gradient(circle at 50% 50%, transparent 60%, ${withAlpha(
          ink,
          VIGNETTE_OPACITY[surface],
        )} 100%)`,
      }}
    />
  );
}

/** Layer 4 — scanlines, 6px pitch, 2.2px line. */
function Scanlines({ ink, surface }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: SCANLINE_OPACITY[surface],
        background: `repeating-linear-gradient(to bottom, ${ink} 0 2.2px, transparent 2.2px 6px)`,
      }}
    />
  );
}

/** Layer 5 — a tiled PNG, never an SVG filter (§7.3: exports drop those). */
function Grain() {
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
 * Layer 6 — the mood's own face, blown up and cropped by the screen edge.
 *
 * Cropping matters: a centred glyph looks like a placeholder. This is the
 * §8 mark rather than anything from src/components/icons/ — those are
 * primitive single-path geometry that does not survive being blown up to
 * 300px at 16%, and the face means something at every size.
 */
function Watermark({ moodId, leaving = false }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        right: WATERMARK_RIGHT,
        bottom: WATERMARK_BOTTOM,
        width: WATERMARK_SIZE,
        height: WATERMARK_SIZE,
        pointerEvents: "none",
        opacity: leaving ? 0 : WATERMARK_OPACITY,
        animation: leaving ? "moodscreen-glyph-out 240ms var(--ease) forwards" : undefined,
      }}
    >
      <Logo mood={moodId} size={WATERMARK_SIZE} />
    </div>
  );
}

/* ----------------------------------------------------------------- content */

/**
 * §7.5 — the avatar is a signature, not a header. It stays at 30px: a larger
 * one costs the statement four points of size and makes the layout generic.
 * In a story the poster's real face is already above the card in the
 * platform's own chrome, so this is a mark, not a portrait.
 */
function Avatar({ src, name, ink, live }) {
  const initial = String(name || "").trim().charAt(0).toUpperCase();

  return (
    <div style={{ position: "relative", width: 30, height: 30, flex: "none" }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          overflow: "hidden",
          background: withAlpha(ink, 0.14),
          border: `1px solid ${withAlpha(ink, 0.22)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-ui)",
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          color: withAlpha(ink, 0.75),
          boxSizing: "border-box",
        }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            width={30}
            height={30}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          initial
        )}
      </div>

      {/* Moment 2 of the motion budget — the live dot breathes, 2.4s. */}
      {live ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: ink,
            animation: "moodscreen-breathe 2400ms var(--ease) infinite",
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * §7.5 — the lockup. The mark takes the card's mood: on a thinking card the
 * little face is thinking. Centred, not corner-aligned; a corner reads as a
 * watermark someone forgot to remove.
 */
function Lockup({ moodId, username, ink }) {
  const handle = String(username || "").trim().toLowerCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-ui)",
        fontSize: 15,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: ink,
      }}
    >
      <Logo mood={moodId} size={17} />
      {/* One run of text, not two flex children. `moodscreen.live/name` is a
        * single string and a gap in the middle of it makes the domain read as
        * a separate label; the only space in the lockup is after the mark. */}
      <span style={{ marginLeft: 6 }}>
        <span style={{ fontWeight: 700 }}>moodscreen</span>
        <span style={{ fontWeight: 500, opacity: 0.6, letterSpacing: "-0.01em" }}>
          .live/{handle}
        </span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------- card */

export default function Moodscreen({
  mood: moodId = "thinking",
  statement = "",
  name = "",
  username = "",
  avatarUrl = "",
  /**
   * Accepted and deliberately unused. §7.5 took location off the card — it
   * belongs to the public page (§7.10), where a stranger arriving from a story
   * has a reason to want it. Callers still hand over whole stored objects, so
   * this is caught here rather than left to land on a DOM node.
   */
  location: _location,
  /** §7.2 — the user's second choice: 'colour' | 'ink' | 'paper'. */
  surface = DEFAULT_SURFACE,
  /** §7.4 — the hour the card is of. The night tint is derived from this. */
  at,
  theme: themeInput,
  themeId,
  /** Display width in px. Layout is always 540 wide; this only scales it. */
  width = BASE_SIZE,
  /** Full chroma rather than the site's −6%. Set by the export surface only. */
  forExport = false,
  live = true,
  id,
  className = "",
  style,
  ...rest
}) {
  const theme = themeInput ?? getTheme(themeId);
  const mood = getMood(moodId) ?? FALLBACK_MOOD;
  const outgoingMoodId = useOutgoingMood(moodId, !forExport && theme.texture === "glyph");

  const resolved = resolveSurface({ mood, surface, at, forExport });
  const { background, ink } = resolved;

  const size = statementSize(statement, theme.font);
  const scale = width / BASE_SIZE;

  return (
    <div
      className={className}
      style={{ width, height: width, ...style }}
      {...rest}
    >
      <div
        id={id}
        style={{
          width: BASE_SIZE,
          height: BASE_SIZE,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          /* §7.1 — the screen. Every layer inside is cut to this, including
           * the watermark, which is what crops it against the edge. */
          clipPath: CLIP,
          background,
          color: ink,
          fontFamily: "var(--font-ui)",
          /* Moment 1: the colour cross-fade. Never during a capture. */
          transitionProperty: forExport ? "none" : "background-color, color",
          transitionDuration: "240ms",
          transitionTimingFunction: "var(--ease)",
        }}
      >
        {theme.texture === "glyph" ? (
          <>
            {outgoingMoodId ? <Watermark moodId={outgoingMoodId} leaving /> : null}
            <Watermark moodId={moodId} />
          </>
        ) : null}

        <Vignette ink={ink} surface={resolved.surface} />
        {theme.texture === "scanline" ? (
          <Scanlines ink={ink} surface={resolved.surface} />
        ) : null}
        <Grain />

        <div
          style={{
            position: "absolute",
            inset: SAFE,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* §7.5 — the timestamp, and nothing else in the top row. */}
          <div
            style={{
              flex: "none",
              display: "flex",
              justifyContent: "flex-end",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.02em",
              lineHeight: 1,
              color: withAlpha(ink, alphaFor(INK_TIMESTAMP, resolved.surface)),
            }}
          >
            {formatTime(at)}
          </div>

          {/* §7.5 — the centre, as one stack. */}
          <div
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Avatar src={avatarUrl} name={name} ink={ink} live={live && !forExport} />

            {name ? (
              <p
                style={{
                  margin: "10px 0 0",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  lineHeight: 1.2,
                  color: withAlpha(ink, alphaFor(INK_NAME, resolved.surface)),
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </p>
            ) : null}

            {/* The mood label sits directly above the statement, never in a
              * corner — label and statement are one utterance and must read
              * as a pair. */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                margin: "18px 0 0",
                color: withAlpha(ink, alphaFor(INK_LABEL, resolved.surface)),
              }}
            >
              <Logo mood={moodId} size={24} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  letterSpacing: "0.25em",
                  /* The tracking is trailing whitespace on the last letter;
                   * without this the pair reads as off-centre. */
                  textIndent: "0.25em",
                  lineHeight: 1,
                  textTransform: "lowercase",
                }}
              >
                {mood.label}
              </span>
            </div>

            {/* The statement — the largest thing on the card by a wide margin. */}
            <p
              style={{
                margin: "12px 0 0",
                fontFamily: theme.font.family,
                fontWeight: theme.font.weight,
                fontSize: size,
                letterSpacing: theme.font.tracking,
                lineHeight: theme.font.lineHeight,
                overflowWrap: "break-word",
                wordBreak: "break-word",
                width: "100%",
              }}
            >
              {applyCase(statement, theme)}
            </p>
          </div>

          <div style={{ flex: "none" }}>
            <Lockup moodId={moodId} username={username} ink={ink} />
          </div>
        </div>
      </div>
    </div>
  );
}
