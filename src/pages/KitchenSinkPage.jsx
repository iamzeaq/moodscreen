/**
 * /kitchen-sink — every primitive, every state, free of page layout.
 *
 * This is a review surface, not a page. It has no hero, no container rhythm
 * and no copy worth reading; if anything here starts looking designed,
 * something has been built in the wrong file.
 */
import { useEffect, useState } from "react";
import Button from "../components/ui/Button.jsx";
import Input, { UsernameInput } from "../components/ui/Input.jsx";
import Logo, { LOGO_MOODS } from "../components/brand/Logo.jsx";
import Wordmark from "../components/brand/Wordmark.jsx";
import { MOODS, DEFAULT_ACCENT, accentForMood } from "../lib/moods.js";
import { accentVars, applyAccent } from "../lib/color.js";

/* ------------------------------------------------------------------ shell */

function Section({ title, note, children }) {
  return (
    <section className="flex flex-col gap-6 border-t border-line pt-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-24 font-semibold text-fg">{title}</h2>
        {note ? <p className="max-w-[64ch] text-13 text-muted">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-11 text-faint">{label}</p>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------- components */

/**
 * All six button states side by side. Hover and active cannot be forced from
 * script, so those two cells pin the exact classes the real states apply —
 * they are a reference, and the live buttons beside them are the truth.
 */
function ButtonStates({ variant }) {
  const hover = {
    primary: "!bg-accent-hover",
    secondary: "!bg-overlay !border-line-strong",
    ghost: "!bg-panel !text-fg",
  }[variant];

  const active = {
    primary: "!bg-accent-press translate-y-px",
    secondary: "!bg-panel translate-y-px",
    ghost: "!bg-raised translate-y-px",
  }[variant];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-11 text-faint">{variant}</p>
      <div className="flex flex-wrap items-start gap-6">
        {[
          ["rest", <Button key="r" variant={variant}>Make a Moodscreen</Button>],
          [
            "hover",
            <Button key="h" variant={variant} className={hover}>
              Make a Moodscreen
            </Button>,
          ],
          [
            "active",
            <Button key="a" variant={variant} className={active}>
              Make a Moodscreen
            </Button>,
          ],
          [
            "focus-visible",
            <Button
              key="f"
              variant={variant}
              style={{ outline: "2px solid var(--accent-ring)", outlineOffset: "2px" }}
            >
              Make a Moodscreen
            </Button>,
          ],
          [
            "disabled",
            <Button key="d" variant={variant} disabled>
              Make a Moodscreen
            </Button>,
          ],
          [
            "loading",
            <Button key="l" variant={variant} loading>
              Make a Moodscreen
            </Button>,
          ],
        ].map(([name, node]) => (
          <div key={name} className="flex flex-col items-start gap-2">
            {node}
            <span className="text-11 text-faint">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Swatch({ name, value, textOn }) {
  return (
    <div className="flex w-40 flex-col gap-2">
      <div
        className="h-16 rounded-md border border-line"
        style={{ background: value, boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.28)" }}
      >
        {textOn ? (
          <span
            className="flex h-full items-center justify-center text-13 font-semibold"
            style={{ color: textOn }}
          >
            Ag
          </span>
        ) : null}
      </div>
      <div className="flex flex-col">
        <span className="text-12 text-fg">{name}</span>
        <span className="text-11 text-faint">{value}</span>
      </div>
    </div>
  );
}

const TYPE_SCALE = [
  { px: 64, cls: "text-64", track: "-0.03em" },
  { px: 48, cls: "text-48", track: "-0.03em" },
  { px: 34, cls: "text-34", track: "-0.02em" },
  { px: 24, cls: "text-24", track: "-0.01em" },
  { px: 18, cls: "text-18", track: "-0.01em" },
  { px: 15, cls: "text-15", track: "0" },
  { px: 13, cls: "text-13", track: "0" },
  { px: 12, cls: "text-12", track: "+0.01em" },
  { px: 11, cls: "text-11", track: "+0.01em" },
];

const DURATIONS = [
  ["hover", "var(--dur-hover)"],
  ["state change", "var(--dur-state)"],
  ["enter", "var(--dur-enter)"],
  ["layout", "var(--dur-layout)"],
];

/* -------------------------------------------------------------------- page */

export default function KitchenSinkPage() {
  const [moodId, setMoodId] = useState("thinking");
  const [claim, setClaim] = useState("");
  const [shifted, setShifted] = useState(false);

  const accent = accentForMood(moodId);

  useEffect(() => {
    applyAccent(document.documentElement, accent);
    return () => applyAccent(document.documentElement, DEFAULT_ACCENT);
  }, [accent]);

  const vars = accentVars(accent);

  return (
    <main className="mx-auto flex max-w-content flex-col gap-12 px-6 py-16">
      <header className="flex flex-col gap-4">
        <Wordmark mood={moodId} size={34} />
        <p className="max-w-[64ch] text-15 text-muted">
          Every primitive in every state. The accent below is live — it drives the mark, the
          buttons, the focus rings and the caret, exactly as a mood in focus will.
        </p>
      </header>

      {/* ---------------------------------------------------------- accent */}
      <Section
        title="Accent"
        note="There is no fixed brand colour. Hover and press are lightness moves in OKLCH, not opacity — opacity muddies against a dark canvas."
      >
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMoodId(m.id)}
              aria-pressed={m.id === moodId}
              className="flex items-center gap-2 rounded-sm border px-3 py-2 text-13 outline-none focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2 aria-pressed:border-accent aria-pressed:bg-[var(--accent-tint)] aria-pressed:text-fg border-line bg-panel text-muted hover:border-line-strong"
              style={{
                transitionProperty: "background-color, border-color, color",
                transitionDuration: "var(--dur-hover)",
                transitionTimingFunction: "var(--ease)",
              }}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: m.siteColor }}
                aria-hidden="true"
              />
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          {Object.entries(vars).map(([name, value]) => (
            <Swatch key={name} name={name} value={value} textOn={undefined} />
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------ logo */}
      <Section
        title="Logo"
        note="Two vertical strokes for eyes, one for the mouth. Eyes never move — except for coding, where they lie down. Adding a mood is one path."
      >
        <Row label="every mood, 40px">
          {LOGO_MOODS.map((m) => (
            <div key={m} className="flex w-24 flex-col items-center gap-2 text-accent">
              <Logo mood={m} size={40} />
              <span className="text-11 text-faint">{m}</span>
            </div>
          ))}
        </Row>

        <Row label="sizes — stroke bumps to 3.6 below 24px">
          {[64, 40, 24, 16].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2 text-fg">
              <Logo mood={moodId} size={s} />
              <span className="text-11 text-faint">{s}px</span>
            </div>
          ))}
        </Row>

        <Row label="lockup — mark height locked to the wordmark x-height">
          {[34, 24, 18, 15].map((s) => (
            <div key={s} className="flex flex-col items-start gap-2">
              <Wordmark mood={moodId} size={s} />
              <span className="text-11 text-faint">{s}px</span>
            </div>
          ))}
        </Row>

        <Row label="on a mood fill">
          {MOODS.slice(0, 5).map((m) => (
            <div
              key={m.id}
              className="flex h-20 w-40 items-center justify-center rounded-lg"
              style={{ background: m.siteColor, color: m.ink }}
            >
              <Wordmark mood={m.id} size={18} tone="current" />
            </div>
          ))}
        </Row>
      </Section>

      {/* --------------------------------------------------------- buttons */}
      <Section
        title="Button"
        note="Primary 44px, secondary 36px, radius 10px. Hover lightens the fill; it never scales. Active is a 1px settle at 80ms. Tab through the live buttons to check the ring."
      >
        <ButtonStates variant="primary" />
        <ButtonStates variant="secondary" />
        <ButtonStates variant="ghost" />

        <Row label="live — one primary action per view">
          <Button>Claim moodscreen.live/yourname</Button>
          <Button variant="secondary">Drop your Moodscreen</Button>
          <Button variant="ghost">Cancel</Button>
        </Row>

        <Row label="as a link">
          <Button as="a" href="#top" variant="secondary">
            Back to top
          </Button>
        </Row>
      </Section>

      {/* ----------------------------------------------------------- input */}
      <Section
        title="Input"
        note="44px, panel fill, line border, line-strong on hover, accent border plus tint on focus. The claim field carries moodscreen.live/ inside the border, not as a label above it."
      >
        <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
          <Input label="Rest" placeholder="Say what you're on" />
          <Input label="With a hint" placeholder="Cape Town" hint="Shown under your statement." />
          <Input
            label="Filled"
            defaultValue="Shipping the renderer"
            hint="Focus it to see the accent tint."
          />
          <Input label="Disabled" placeholder="Say what you're on" disabled />
          <Input
            label="Error"
            defaultValue="!!"
            error="Use letters, numbers, and hyphens only."
          />
          <Input label="With a counter" placeholder="Say what you're on" suffix="0 / 180" />
        </div>

        <Row label="username variant">
          <div className="w-full max-w-md">
            <UsernameInput
              label="Claim your page"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              hint="This is the URL on every Moodscreen you post."
            />
          </div>
        </Row>

        <Row label="username variant — taken">
          <div className="w-full max-w-md">
            <UsernameInput defaultValue="isaac" error="That name is taken." />
          </div>
        </Row>

        <Row label="username variant — disabled">
          <div className="w-full max-w-md">
            <UsernameInput defaultValue="isaac" disabled />
          </div>
        </Row>
      </Section>

      {/* ------------------------------------------------------------ type */}
      <Section
        title="Type"
        note="Switzer for the interface, Instrument Serif for the statement. Explicit scale, optical tracking baked into each step so it cannot be forgotten."
      >
        <div className="flex flex-col gap-4">
          {TYPE_SCALE.map((t) => (
            <div key={t.px} className="flex items-baseline gap-6">
              <span className="w-24 shrink-0 text-11 text-faint">
                {t.px}px · {t.track}
              </span>
              <span className={`${t.cls} font-ui text-fg`}>What are you on right now?</span>
            </div>
          ))}
        </div>

        <Row label="display face — the statement, and only the statement">
          <p className="font-display text-48 text-fg">Shipping the renderer at 2am</p>
        </Row>

        <Row label="weights">
          {[400, 500, 600, 700].map((w) => (
            <span key={w} className="text-18 text-fg" style={{ fontWeight: w }}>
              Switzer {w}
            </span>
          ))}
        </Row>
      </Section>

      {/* ---------------------------------------------------------- colour */}
      <Section
        title="Canvas"
        note="The site is a gallery wall. Ten saturated mood colours need somewhere quiet to sit, so the chrome carries almost no hue of its own. Never pure black."
      >
        <Row label="surfaces">
          <Swatch name="canvas" value="var(--canvas)" />
          <Swatch name="raised" value="var(--raised)" />
          <Swatch name="panel" value="var(--panel)" />
          <Swatch name="overlay" value="var(--overlay)" />
        </Row>

        <Row label="text">
          {[
            ["text", "text-fg"],
            ["text-muted", "text-muted"],
            ["text-faint", "text-faint"],
          ].map(([name, cls]) => (
            <div key={name} className="flex w-40 flex-col gap-1">
              <span className={`text-18 ${cls}`}>Say what you're on</span>
              <span className="text-11 text-faint">{name}</span>
            </div>
          ))}
        </Row>

        <Row label="lines — alpha, so they adapt to whatever sits behind them">
          {["var(--line)", "var(--line-strong)"].map((v) => (
            <div key={v} className="flex w-40 flex-col gap-2">
              <div className="h-16 rounded-md bg-raised" style={{ border: `1px solid ${v}` }} />
              <span className="text-11 text-faint">{v}</span>
            </div>
          ))}
        </Row>
      </Section>

      <Section
        title="Mood spectrum"
        note="Moodscreens only — these never appear in site chrome except as the dynamic accent. Site fills drop ~6% chroma; the export keeps them full."
      >
        <div className="flex flex-wrap gap-4">
          {MOODS.map((m) => (
            <div key={m.id} className="flex w-44 flex-col gap-2">
              <div className="flex h-24 overflow-hidden rounded-lg">
                <div
                  className="flex flex-1 items-end p-3 text-13 font-semibold"
                  style={{ background: m.siteColor, color: m.ink }}
                >
                  site
                </div>
                <div
                  className="flex flex-1 items-end p-3 text-13 font-semibold"
                  style={{ background: m.color, color: m.ink }}
                >
                  export
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-12 text-fg">{m.label}</span>
                <span className="text-11 text-faint">
                  {m.color} · ink {m.ink}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------- radius/spacing */}
      <Section
        title="Radius and spacing"
        note="Nested radii: inner = outer − the padding between them. A 16px panel with 16px padding holds a 4px inner element; concentric corners look drawn, parallel ones look glued on."
      >
        <Row label="radius">
          {[
            ["--r-sm 6px", "rounded-sm"],
            ["--r-md 10px", "rounded-md"],
            ["--r-lg 16px", "rounded-lg"],
          ].map(([name, cls]) => (
            <div key={name} className="flex w-40 flex-col gap-2">
              <div className={`h-16 border border-line bg-panel ${cls}`} />
              <span className="text-11 text-faint">{name}</span>
            </div>
          ))}
        </Row>

        <Row label="nesting — 16px outer, 16px padding, 4px inner">
          <div className="rounded-lg border border-line bg-raised p-4">
            <div className="h-16 w-40 rounded-[4px] bg-panel" />
          </div>
        </Row>

        <Row label="spacing — 4 8 12 16 24 32 48 64 96 128">
          {[4, 8, 12, 16, 24, 32, 48, 64, 96, 128].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className="bg-accent" style={{ width: s, height: 8 }} />
              <span className="text-11 text-faint">{s}</span>
            </div>
          ))}
        </Row>
      </Section>

      {/* ---------------------------------------------------------- motion */}
      <Section
        title="Motion"
        note="Four durations, one easing curve, transform and opacity only. Never transition: all, never hover:scale."
      >
        <Button variant="secondary" onClick={() => setShifted((s) => !s)}>
          {shifted ? "Return" : "Move"}
        </Button>
        <div className="flex flex-col gap-3">
          {DURATIONS.map(([name, dur]) => (
            <div key={name} className="flex items-center gap-6">
              <span className="w-32 shrink-0 text-11 text-faint">
                {name} · {dur}
              </span>
              <div className="h-8 flex-1 rounded-sm bg-panel">
                <div
                  className="h-8 w-8 rounded-sm bg-accent"
                  style={{
                    transform: shifted ? "translateX(220px)" : "translateX(0)",
                    transitionProperty: "transform",
                    transitionDuration: dur,
                    transitionTimingFunction: "var(--ease)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------- grain */}
      <Section
        title="Grain"
        note="A tiled PNG at 7%, mounted once at the app root, pointer-events none, beneath every interactive layer. A PNG tile rather than an SVG filter, because html-to-image drops SVG filters from exports."
      >
        <Row label="the tile, at 1× and at full strength">
          <div
            className="h-32 w-32 rounded-md border border-line"
            style={{
              backgroundImage: "var(--grain-url)",
              backgroundSize: "var(--grain-size) var(--grain-size)",
            }}
          />
          <p className="max-w-[48ch] text-13 text-muted">
            The layer over this whole page is the same tile at{" "}
            <span className="text-fg">7%</span>. If you cannot see it on the panels above, tilt
            the screen — that is the correct amount.
          </p>
        </Row>
      </Section>
    </main>
  );
}
