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
import Logo, { MARK_INK_BOTTOM, MARK_VIEWBOX } from "./brand/Logo.jsx";
import { getMood, MOODS } from "../lib/moods.js";
import { safeInset, safeSideInset, screenPathAt, screenTop } from "../lib/screen.js";
import { statementSize } from "../lib/statementFit.js";
import { applyCase, getTheme } from "../themes/index.js";
import { DEFAULT_SURFACE, resolveSurface } from "../themes/surface.js";

/** The card's one true size. Export is this at 3x. */
export const BASE_SIZE = 540;

/**
 * §7.1 — the corners curve inward, so content sits further in than on a rect.
 *
 * Vertically that is one number. Horizontally it is not, and assuming it was is
 * what put the timestamp half off the card: the shape is ~30 units narrower at
 * the height of the top row than it is at the middle, so a square inset that
 * fits the statement does not fit the row above it. Each of the three groups
 * therefore measures its own side inset off the path, over the band of heights
 * it actually occupies — see safeSideInset.
 */
const SAFE_V = safeInset(BASE_SIZE);

/** Row heights, so the bands below are the ones the layout really produces. */
const TIMESTAMP_H = 12; /* 12px mono, line-height 1 */
const LOCKUP_H = 18; /* the 17px mark, which is taller than its 15px text */

const BAND_TOP = [SAFE_V, SAFE_V + TIMESTAMP_H];
const BAND_BOTTOM = [BASE_SIZE - SAFE_V - LOCKUP_H, BASE_SIZE - SAFE_V];
const BAND_MIDDLE = [BAND_TOP[1], BAND_BOTTOM[0]];

const PAD_TOP = safeSideInset(...BAND_TOP, BASE_SIZE);
const PAD_MIDDLE = safeSideInset(...BAND_MIDDLE, BASE_SIZE);
const PAD_BOTTOM = safeSideInset(...BAND_BOTTOM, BASE_SIZE);

/**
 * Where the lockup sits, and the frame the centre stack is centred in.
 *
 * The three groups used to be a flex column, which sounds right and is not.
 * A column makes the timestamp a *row*: 12px of full-width layout at the top
 * of the card, which pushes everything below it down and, more to the point,
 * moves the whole reference frame down with it. So the timestamp and the
 * lockup are positioned, not stacked, and reserve no height.
 *
 * What is left is the question of what the stack should centre *in*, and the
 * answer is not the gap between those two marks. Centring in [drawn edge,
 * lockup] is geometrically honest and reads wrong every time: it leaves a deep
 * band under the statement with the top pulled tight. The two boundaries are
 * nothing like each other in weight. The top is the card's own drawn edge, a
 * hard full-contrast boundary where the surface stops. The bottom is one 15px
 * line with its domain half at 60% opacity — a light mark the eye reads
 * through rather than stops at. A heavy boundary repels; a light one does not,
 * so the perceived field runs on past the lockup to the bottom edge.
 *
 * Which makes the target the card's own middle. The timestamp and the lockup
 * are marks in the margins, not walls, and the stack centres on the object
 * they sit on. That is a ~23px drop from the geometric answer, and it falls
 * out of a frame symmetric about the centre rather than a tuned constant — so
 * it stays true if the safe inset or the lockup's height ever move.
 */
const LOCKUP_TOP = BASE_SIZE - SAFE_V - LOCKUP_H;
const STACK_TOP = screenTop(BASE_SIZE);
const STACK_HEIGHT = BASE_SIZE - 2 * STACK_TOP;

/** Baked once: the clip every layer inside the screen is cut to. */
const CLIP = `path("${screenPathAt(BASE_SIZE)}")`;

/**
 * §7.3 — texture strength per surface.
 *
 * §7.3 gives the principle as: a light field needs it dialled back. It states
 * that for `paper`, and the same principle with the sign flipped governs `ink`,
 * which the spec's own numbers missed — there the line is drawn in the
 * surface's ink, a *lightened* tone of the mood, on a near-black field, so it
 * is a light stroke on a dark ground at close to full contrast, and 12% reads
 * as distinct stripes rather than as texture.
 *
 * `paper` in turn is lower than the 7% first written, for the same reason
 * carried further: on bone, a 2.2px line every 6px stops reading as a CRT
 * artefact and starts reading as woven cloth. That is worst under `nokia`,
 * though nothing about it is nokia's — the layer is per *surface* and every
 * scanline theme draws it identically. What nokia adds is a beat: Silkscreen's
 * own pixel rows land near 4.75px against the 6px pitch, and the two grids
 * interfere into a visible weave. Dropping the contrast is what breaks the
 * beat, since the pitch is §7.3's and stays.
 */
const SCANLINE_OPACITY = { colour: 0.13, ink: 0.055, paper: 0.04 };
const VIGNETTE_OPACITY = { colour: 0.14, ink: 0.1, paper: 0.07 };

const GRAIN_OPACITY = 0.07;

/**
 * §7.3 layer 6 — the mood's face, **whole**.
 *
 * Whole is the whole point. The first two attempts blew the face up and cropped
 * it against the screen edge, and a cropped three-stroke face does not read as
 * a face partly out of frame; it reads as a rendering fault. Worse, the crop
 * that layer wanted cannot be drawn: taking the face's ink box as 0..1 the eyes
 * sit at 0.196..0.326 and 0.674..0.804, while the widest mouths — `coding`,
 * `creating`, `learning`, round caps included — run 0.217..0.783. The mouth
 * overlaps both eyes horizontally, so any cut that takes an eye takes those
 * mouths with it, at any scale, because these are fractions.
 *
 * Small and entire solves both. At 70px the strokes are 5px and the features
 * sit close enough to group into a face at a glance, where at 186px they were
 * 24px bars 89px apart that grouped into nothing. It takes the card's ink via
 * `currentColor` and sits low, in the band the centred stack leaves between the
 * statement and the lockup — an area with room precisely because the stack now
 * centres on the card rather than on that gap.
 */
const WATERMARK_SIZE = 106;
const WATERMARK_OPACITY = 0.13;

/**
 * Why 106 and not the 186 the spec used to name.
 *
 * The mark is sized so the *drawn face* clears the statement above it and the
 * lockup below it, and that band is the whole budget. Measured across the three
 * glyph themes and the §7.6 ladder, the statement bottoms out at 386.3
 * (`classic`, a four-line statement) and the lockup starts at 476: 89.7px, and
 * that is all there is.
 *
 * A whole mark at Logo size 186 draws a face 107x121; at 186px of *face* it is
 * 186x210. Neither fits in 89.7, so "186, whole, inside the path, clear of the
 * statement" is not a tuning problem — the four cannot hold at once. 106 is the
 * largest size that leaves ~10px of air top and bottom in the worst case, and
 * it still draws a face half again the size of the 70px version.
 *
 * To go materially bigger, something else has to give: let the mark run behind
 * the lockup (the band to the bottom edge is 136px, which does fit ~185) and
 * accept the wordmark sitting across its mouth, or move the centre stack back
 * up and give up the §7.5 centring.
 */

/**
 * Anchored by the face's own bottom against the lockup, not by the element box.
 * The 40-unit viewBox is mostly margin, so an element-box offset would leave the
 * visible gap wrong by ~14px. The lockup is fixed and the statement is not, so
 * this is the end that can be guaranteed; the statement clearance is then
 * verified against the worst case above.
 */
const WATERMARK_GAP = 10;
const WATERMARK_FACE_BOTTOM = (MARK_INK_BOTTOM / MARK_VIEWBOX) * WATERMARK_SIZE;
const WATERMARK_TOP = LOCKUP_TOP - WATERMARK_GAP - WATERMARK_FACE_BOTTOM;

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

/**
 * The avatar's own fill and edge, per surface.
 *
 * One pair of alphas cannot serve all three. On `colour` and `paper` the ink is
 * a dark tone on a lighter field, and a 14% wash of it darkens the disc plainly
 * enough to read as an object. On `ink` the relationship inverts — a lightened
 * mood tone on a near-black field — and the same 14% lands about nineteen
 * levels above the background, which the vignette then eats into at exactly the
 * radius the avatar sits at. The disc is a signature (§7.5) and it has to be
 * legible as one, so `ink` takes the alpha it needs rather than the alpha the
 * other two happen to want.
 */
const AVATAR_FILL = { colour: 0.14, ink: 0.26, paper: 0.14 };
const AVATAR_EDGE = { colour: 0.22, ink: 0.44, paper: 0.22 };
const AVATAR_INITIAL = { colour: 0.75, ink: 0.9, paper: 0.75 };

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
 * Layer 6 — the mood's face, whole, low, and faint.
 *
 * Centred rather than pushed into a corner. A corner is where you put a mark
 * you are apologising for; this one is meant to be seen, just second. It sits
 * on the same axis as the lockup below it, so the two read as one column of
 * brand rather than as a stray glyph beside a footer.
 */
function Watermark({ moodId, leaving = false }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: WATERMARK_TOP,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
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
function Avatar({ src, name, ink, live, surface }) {
  const initial = String(name || "").trim().charAt(0).toUpperCase();

  return (
    <div style={{ position: "relative", width: 30, height: 30, flex: "none" }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          overflow: "hidden",
          background: withAlpha(ink, AVATAR_FILL[surface]),
          border: `1px solid ${withAlpha(ink, AVATAR_EDGE[surface])}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-ui)",
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          color: withAlpha(ink, AVATAR_INITIAL[surface]),
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
          {/* A guest has no handle yet, and `.live/` with nothing after it
            * reads as a broken string rather than as a domain. §1 is
            * guest-first and guests export from the hero, so this is the
            * common case, not an edge one: no handle, no slash. */}
          {handle ? `.live/${handle}` : ".live"}
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

  /**
   * Who the statement belongs to.
   *
   * The handle first: it is the one identity the card can be checked against,
   * because the lockup underneath points at the page it names. The display
   * name is the fallback, so a Moodscreen made before a page was claimed is
   * still attributed rather than anonymous.
   */
  const byline = String(username || "").trim().toLowerCase() || String(name || "").trim();

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
        <Vignette ink={ink} surface={resolved.surface} />
        {theme.texture === "scanline" ? (
          <Scanlines ink={ink} surface={resolved.surface} />
        ) : null}
        <Grain />

        {/* Layer 6, and in §7.3's order this time: above the grain, below the
          * content. The previous version sat under the vignette, which meant
          * the corner shading fell across the very thing it was darkening. */}
        {theme.texture === "glyph" ? (
          <>
            {outgoingMoodId ? <Watermark moodId={outgoingMoodId} leaving /> : null}
            <Watermark moodId={moodId} />
          </>
        ) : null}

        {/* Each group sets its own side inset, measured off the drawn path at
          * the heights it occupies, because a single square inset cannot clear
          * the corners and leave the statement its width. */}

        {/* §7.5 — the timestamp, top-right, and nothing else up there. A mark
          * in the corner rather than a row: see STACK_TOP on why a row here
          * drags the centre stack down with it. */}
        <div
          style={{
            position: "absolute",
            top: SAFE_V,
            right: PAD_TOP,
            height: TIMESTAMP_H,
            display: "flex",
            alignItems: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.02em",
            lineHeight: 1,
            color: withAlpha(ink, alphaFor(INK_TIMESTAMP, resolved.surface)),
          }}
        >
          {formatTime(at)}
        </div>

        {/* §7.5 — the centre, as one stack, optically centred between the
          * drawn top edge and the lockup.
          *
          * Left-aligned, not centred. The byline has to sit at the point the
          * statement starts or it is not a byline — a name centred over a
          * block of text is a header, and a header is the one thing §7.5 says
          * the avatar must not become. Once the byline is flush left the
          * statement has to be too, or "where the statement begins" is a
          * different place on every line and the attribution points at
          * nothing.
          *
          * The lockup and the watermark stay centred (§7.3, §7.5). That is the
          * composition: what the person said sits left on the card, and the
          * brand sits centred under it. */}
        <div
          style={{
            position: "absolute",
            top: STACK_TOP,
            height: STACK_HEIGHT,
            left: 0,
            right: 0,
            boxSizing: "border-box",
            paddingLeft: PAD_MIDDLE,
            paddingRight: PAD_MIDDLE,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            textAlign: "left",
          }}
        >
          {/* The attribution.
            *
            * The avatar sits on its own line above the byline rather than
            * beside it, and that is the whole point of the change: inline, the
            * avatar's 30px plus its gap push the name 40px inboard, so the
            * byline no longer begins where the statement begins and stops
            * being an attribution to it. Stacked, every row in this block
            * starts at the same left edge. */}
          <Avatar
            src={avatarUrl}
            name={name}
            ink={ink}
            surface={resolved.surface}
            live={live && !forExport}
          />

          {byline ? (
            <p
              style={{
                margin: "10px 0 0",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                /* Lighter than the mood label below it, deliberately. The two
                 * sit close together in the same mono face and would otherwise
                 * read as one run of metadata; §7.5 gives the label the
                 * emphasis because it is half of an utterance with the
                 * statement, and this is only a signature. */
                fontWeight: 400,
                lineHeight: 1.2,
                color: withAlpha(ink, alphaFor(INK_NAME, resolved.surface)),
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {byline}
            </p>
          ) : null}

          {/* The mood label sits directly above the statement, never in a
            * corner — label and statement are one utterance and must read
            * as a pair. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
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
                /* Heavier than the byline — see the note on its weight. */
                fontWeight: 600,
                letterSpacing: "0.25em",
                /* No textIndent here any more. It existed to cancel the
                 * trailing letterspace on the last glyph so a *centred* label
                 * looked centred; flush left it would push the label a quarter
                 * of an em right of the statement's edge, which is exactly the
                 * alignment this layout is for. */
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

        <div
          style={{
            position: "absolute",
            top: LOCKUP_TOP,
            height: LOCKUP_H,
            left: 0,
            right: 0,
            boxSizing: "border-box",
            paddingLeft: PAD_BOTTOM,
            paddingRight: PAD_BOTTOM,
            display: "flex",
            alignItems: "center",
            /* §7.5 — the lockup is centred; a corner reads as a watermark
             * someone forgot to remove. */
            justifyContent: "center",
          }}
        >
          <Lockup moodId={moodId} username={username} ink={ink} />
        </div>
      </div>
    </div>
  );
}
