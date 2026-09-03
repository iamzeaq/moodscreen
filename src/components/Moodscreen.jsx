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
import Logo from "./brand/Logo.jsx";
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
 * The frame the centre stack is centred in: the drawn top edge down to the top
 * of the lockup.
 *
 * The three groups used to be a flex column, which sounds right and is not.
 * A column makes the timestamp a *row*: 12px of full-width layout at the top
 * of the card, which pushes the stack below it down by half that and, more to
 * the point, moves the whole reference frame down with it. The stack then
 * centres in the space below the timestamp while the eye centres it in the
 * space below the card's edge, and the two disagree by the 29px that read as
 * a void above the avatar.
 *
 * The timestamp is a corner mark — §7.5 gives it the top-right and nothing
 * else — so it is positioned, not stacked, and reserves no height. The stack
 * then owns the whole field from the edge to the lockup, which is the space
 * the eye was measuring all along.
 */
const LOCKUP_TOP = BASE_SIZE - SAFE_V - LOCKUP_H;
const STACK_TOP = screenTop(BASE_SIZE);
const STACK_HEIGHT = LOCKUP_TOP - STACK_TOP;

/**
 * The optical half of "optically centred".
 *
 * Geometric centring in that frame leaves the stack looking a shade low,
 * because the frame is not symmetric in weight: its top boundary is an empty
 * drawn edge and its bottom boundary is the lockup, which is ink. Mass at the
 * bottom pulls the perceived centre down, so the stack is lifted back off it.
 * Applied as bottom padding on a centred flex box, which shifts the content up
 * by half — hence the doubling at the point of use.
 */
const OPTICAL_LIFT = 6;

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
 * There is no glyph watermark layer, and §7.3's layer 6 is gone with it.
 *
 * It asked for the mood's face blown up and *cropped by the screen edge*, on
 * the test that what remains still reads as a face. Those two cannot both
 * hold, and the reason is in the mark's own proportions rather than in any
 * choice of size or position. Taking the face's ink box as 0..1: the eyes sit
 * at 0.196..0.326 and 0.674..0.804, while the widest mouths — `coding`,
 * `creating`, `learning`, round caps included — run 0.217..0.783. The mouth
 * overlaps both eyes horizontally. Any cut that takes an eye takes those
 * mouths with it, on either side, at any scale, because these are fractions.
 *
 * Uncropped it fared no better. At 186px the strokes are 24px thick, the eyes
 * stand 89px apart and the mouth hangs 80px below them, and at 14% opacity the
 * eye cannot group three marks that far apart: it read as two vertical bars
 * and a detached blob, which is what it was.
 *
 * The card also carries this face twice already — 24px beside the mood label,
 * 17px in the lockup — both at full ink, both legible. A third copy, huge and
 * faint and clipped, was never adding a mood cue the card lacked.
 *
 * So themes now carry `texture: 'scanline' | 'none'`. Grain and vignette are
 * unconditional and still do the work layer 6 was sharing.
 */

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
        <Vignette ink={ink} surface={resolved.surface} />
        {theme.texture === "scanline" ? (
          <Scanlines ink={ink} surface={resolved.surface} />
        ) : null}
        <Grain />

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
          * drawn top edge and the lockup. */}
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
            paddingBottom: OPTICAL_LIFT * 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Avatar
            src={avatarUrl}
            name={name}
            ink={ink}
            surface={resolved.surface}
            live={live && !forExport}
          />

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
