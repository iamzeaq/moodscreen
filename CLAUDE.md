# Moodscreen — project guide

Read this fully before any work. Every rule here overrides your defaults.

---

## 1. What this is

Moodscreen lets someone say what they're on right now, turns it into a
beautiful shareable image, and hosts it live at `moodscreen.live/username`.

Three surfaces, one object:

- **Web app** — make, update, share. Currently the only surface.
- **The Moodscreen** — an exported image, posted to IG stories, WhatsApp, X, Snap.
- **The live page** — `moodscreen.live/username`, always showing the current state.

The image is the product. The site exists to make it and to catch people
who tap through from it.

**Guest-first.** Anyone can make and share a Moodscreen with no account.
Sign-in (Google, IG) is only for persistence and personalisation.

**Business model.** Free tier ships a small set of themes. Pro sells
aesthetics — more themes, more typefaces, more textures. This is why the
card renderer must be theme-driven from day one.

### Not building

Not a link directory. Not a website builder. Not a social network — no
follows, no feed, no comments. One optional link per Moodscreen, maximum.
Resist every request that adds a second link field.

---

## 2. Vocabulary — enforced

The object is **a Moodscreen**. Never "card" in user-facing text. `card` is
fine in code and filenames; it must never render on screen.

| Use | Never |
|---|---|
| Make a Moodscreen | Create card / Create yours |
| Say what you're on | Enter your status |
| Drop your Moodscreen | Share card |
| Claim moodscreen.live/yourname | Sign up |

Headline, fixed: **What are you on right now?**
Subhead: **Say what you're on. Post it anywhere. It stays live.**

Sentence case everywhere. Active voice. No exclamation marks.

---

## 3. Colour

### Canvas — neutral by design

The site is a gallery wall. Ten saturated mood colours need somewhere quiet
to sit, so the chrome carries almost no hue of its own.

```
--canvas:      #08080A   /* page background */
--raised:      #101013   /* cards, panels on canvas */
--panel:       #17171B   /* inputs, menus */
--overlay:     #1F1F24   /* modals, popovers */
```

Never pure `#000` — it smears on OLED during scroll and leaves nothing
darker for depth.

### Text

```
--text:        #F2F2F4
--text-muted:  #A0A0A8
--text-faint:  #66666E
```

Never pure white on near-black; the edges vibrate.

### Borders — alpha, not hex

```
--line:        rgba(255,255,255,0.06)
--line-strong: rgba(255,255,255,0.11)
```

Alpha borders adapt to whatever surface sits behind them. Solid greys don't.

### Accent — dynamic, not fixed

**There is no fixed brand accent colour.** The accent is the mood colour
currently in focus: the Moodscreen being edited, or the one under the
cursor on the wall. It drives the logo fill, the primary button, focus
rings, and the caret.

```
--accent:       <current mood hue>
--accent-hover: <same, lightness +8%>
--accent-press: <same, lightness -8%>
--accent-tint:  <same at 14% alpha>
```

Default before any mood is chosen: `#8B7BFF`.

Derive hover and press by lightness in OKLCH, not by opacity — opacity
muddies against a dark canvas.

### Mood spectrum — cards only

These never appear in site chrome except as the dynamic accent above.

```
building    #FF8A00     creating    #FF5FA2
coding      #00C08B     hiring      #FFD029
thinking    #8B7BFF     available   #2ED47A
speaking    #FF4D6D     learning    #00BFC7
traveling   #3DA5F5     offline     #6E7480
```

Each mood also declares an `ink` colour — a very dark tone from its own
hue family, used for all text on that card. Never black, never white.
Example: building ink `#4A2C05`, thinking ink `#221C55`.

Large saturated fills bloom on dark screens. Drop card saturation ~6% when
rendered on the site; keep it full in the export.

---

## 4. Type

Two families. Both self-hosted `woff2`, subset, in `/public/fonts`.
Never a Google Fonts CDN link — `html-to-image` cannot embed it and exports
will silently fall back to Arial.

- **Interface:** Switzer — nav, buttons, labels, inputs, body.
- **Display:** per theme (see §7). Used only for the Moodscreen statement.

**Do not use Inter.** It is the single loudest signal of a default build.

### Scale — explicit, not multiplied

```
11  12  13  15  18  24  34  48  64
```

### Tracking — optical, by size

```
≥48px   -0.03em
34px    -0.02em
18-24px -0.01em
13-15px  0
11-12px +0.01em
```

Large type at default tracking is an immediate tell.

### Line height

```
display        1.05
statement      1.25
body           1.55
```

### Fitting the statement

User text is unpredictable length. Step down by character count, don't
truncate and don't overflow:

```
≤ 42 chars   →  34px
≤ 80 chars   →  26px
≤ 130 chars  →  20px
> 130 chars  →  17px  (hard cap input at 180)
```

---

## 5. Spacing, radius, layout

4px base: `4 8 12 16 24 32 48 64 96 128`.

Two rules that do most of the work:

- Space above a heading ≈ 2× the space below it, so headings bind to their
  content instead of floating.
- **Nested radii:** inner radius = outer radius − padding between them. A
  16px card with 16px padding holds a 4px inner element. Concentric corners
  look drawn; parallel ones look glued on.

```
--r-sm: 6px    inputs, pills
--r-md: 10px   buttons
--r-lg: 16px   Moodscreens, panels
```

Content column `max-width: 1120px`. The wall breaks out of it entirely.

**Only the hero is centred.** Everything else is left-aligned or full-bleed.
Uniformly centred sections are a default tell.

---

## 6. Motion

Four durations. Nothing else.

```
120ms  hover
180ms  state change
240ms  enter
320ms  layout
```

Easing: `cubic-bezier(0.2, 0, 0, 1)`.

Animate `transform` and `opacity` only — anything else drops frames on
mid-range Android, which is a large share of the audience.

**Never `transition: all`. Never `hover:scale`.**

**No scroll-triggered stagger reveals on sections.** That is the clearest
generated-page signature. The motion budget is spent on four moments only:

1. Mood change cross-fades the Moodscreen's colour and glyph — 240ms.
2. The live status dot breathes, `scale 1 → 1.15`, 2.4s, infinite.
3. Pulse counters roll their digits vertically when values change — 180ms.
4. The hero Moodscreen scales down and joins the wall on scroll —
   scroll-linked, the one heavy effect on the page.

Honour `prefers-reduced-motion: reduce` — disable 2 and 4, keep 1 and 3
as instant swaps.

---

## 7. The Moodscreen renderer

**One component renders both the on-screen preview and the exported image.**
If the export path re-implements the layout, the two drift and you will be
fixing it forever. This rule is absolute.

### Theme schema

A theme is data, not a component:

```js
{
  id: 'classic',
  tier: 'free' | 'pro',
  font: { family, weight, scale, tracking },
  surface: 'mood' | 'ink' | 'paper',
  texture: 'grain' | 'none' | 'halftone',
  glyph:   'watermark' | 'inline' | 'none',
  radius:  16,
}
```

Adding a theme must never require touching the renderer. If it does, the
abstraction is wrong.

Free: `classic` (Instrument Serif), `sharp` (Clash Display).
Pro: `terminal` (Departure Mono), `pixel` (Silkscreen), `anime` (Bebas Neue).

Pixel fonts render cleanly only at exact multiples of their design grid, so
`pixel` carries its own size scale. This is why scale lives in the theme.

### Layout

Portrait 4:5. Export at 3× (1080×1350).

Top: mood label in sentence case beside its glyph — **not** an all-caps pill.
Middle: the statement, vertically centred, filling the space.
Bottom: name, location, and `moodscreen.live/username`.

The URL is the growth mechanism. It must be legible at thumbnail size —
minimum 11px at 1× and never below 45% contrast against the card. Do not
style it as a footnote.

Hierarchy is three clear tiers. The statement should be the only thing
readable from across a room. Flat hierarchy is why the current card reads
cheap — not the colour.

**Do not join metadata with middle dots** (`name · location`). Stack it or
space it. That pattern is a generated-page tell.

### Texture — canvas and Moodscreens only

Never on buttons, inputs, or nav. The moment texture touches a control it
stops reading as craft and starts reading as a theme.

Maximum four texture moves per surface. Currently:

1. **Grain** — tiled PNG at 6–9% opacity. Must be a **PNG tile, not an SVG
   filter**: `html-to-image` does not reliably capture SVG filters, so a
   filter-based grain vanishes from exports. `pointer-events: none`,
   below interactive layers, never animated.
2. **Crop marks** — 1.5px L-brackets at the four corners in the card's ink
   at 40% alpha. Reads as a printed artifact rather than a div.
3. **Mood glyph watermark** — the existing hand-drawn icons in
   `src/components/icons/`, large, cropped by the card edge, 14–18% opacity
   in ink. Cropping matters: centred glyphs look like placeholders. These
   icons currently only decorate `FloatingBackground` — bring them forward.
4. **Light edge** — `inset 0 1px 0 rgba(255,255,255,0.28)` on the top edge.
   One pixel. This is how dark UI gets dimension without shadows.

Exports get a fifth: a 3px near-white die-cut border, so a Moodscreen reads
as a sticker when it lands on a photo in stories. Export only, never on site.

### Export

- `await document.fonts.ready` **and** `document.fonts.load()` for the
  active theme's family before capture. Skipping this is the single most
  common cause of broken exports.
- Fix the share flow. Today it needs two taps because the async render
  breaks the user-gesture requirement. Pre-render the blob on statement
  change so the share tap has a ready file.
- Filename: `moodscreen-{username}.png`.

---

## 8. Logo

A three-stroke line face. Two vertical strokes for eyes, one for the mouth.
Vertical eyes, not dots — dots plus a curve is a smiley, and smileys are the
most exhausted mark in software.

It is a **component with a `mood` prop**, not a static file. Eyes never move;
only the mouth path changes per mood. Adding a mood is one path, not a new
logo.

```
building   M15 25 Q20 30 25 25
thinking   M15 27 H22
coding     M15 27 H25   (eyes become horizontal: M12 16 H17, M23 16 H28)
speaking   circle cx20 cy27 r3
offline    M15 27 Q20 23 25 27
```

Stroke 3 at 40×40, `stroke-linecap: round`, `currentColor`. Bump to 3.6 below
24px or it thins out. Favicon: fixed `thinking` mouth.

Wordmark: `moodscreen`, lowercase, one word, tracking `-0.03em`, Switzer
Semibold. Lock the mark's height to the wordmark's x-height, not cap height.

---

## 9. Site structure

Rhythm matters as much as content: contained → contained → **full-bleed** →
contained → scroller → contained. The break in the middle gives the page a
spine.

1. **Hero** — centred. Headline, subhead, and a **live editor**: the visitor
   types and the Moodscreen builds in real time, colour changing with the
   mood. No "create" button. The CTA below is `Claim moodscreen.live/yourname`,
   which converts far better because the work is already done.

2. **Pulse** — left-aligned wide band. Big live count, then the breakdown
   beneath it as a mood-coloured bar. The hero asks the question; this
   answers it at scale. Hide the whole section below 200 live Moodscreens —
   a small number advertises emptiness.

3. **Wall** — full-bleed, no max-width. Two rows of real public Moodscreens
   scrolling opposite directions, `mask-image` fading both ends. Every one
   links to its live page. Needs seeded content at launch; an empty wall is
   worse than no wall. Public visibility is opt-in, default off.

4. **How it works** — three steps. This is a genuine sequence, so numbering
   is legitimate here and only here.

5. **Themes** — horizontal scroller of real Moodscreens in each theme. The
   upsell is aesthetic, so it must be seen, not tabulated. No pricing table.

6. **Close** — the claim field again, one line above it.

---

## 10. Components

**Button** — six states, all specified: rest, hover, active, focus-visible,
disabled, loading. Most builds ship two and it shows.

Primary 44px tall, secondary 36px, radius 10px. Hover **lightens the fill**;
it does not scale. Active `translateY(1px)` at 80ms. Focus-visible is a 2px
accent ring at 40% alpha with 2px offset — never removed.

One primary action per view. No gradient fills, no glow.

**Input** — 44px, `--panel` background, `--line` border, `--line-strong` on
hover, accent border plus tint on focus. The username field shows
`moodscreen.live/` as a fixed prefix inside the field, not as a label above it.

---

## 11. Repo facts

Vite + React 19 + Tailwind v4 + Supabase + `html-to-image` + React Router v7.

Known problems to fix rather than work around:

- `MoodscreenContext.jsx` is 574 lines doing form state, export, share, and
  sync. Split it.
- `design-system.css` is 886 hand-written lines running alongside Tailwind v4.
  Pick one. Tokens in CSS variables, everything else Tailwind.
- `HomePage.jsx` is dead — returns `null`, imported nowhere. Delete it.
- `/:username` sits at the root, so every future top-level route collides with
  the username space. `isReservedUsername` is a list you maintain forever.
  Move public profiles to `/u/:username` with a redirect from the old shape,
  or accept the maintenance cost knowingly.
- The public profile does two sequential Supabase round-trips. Join them —
  this is the page shared links land on.
- The save rate-limit is in localStorage, so it is a politeness guard, not
  security. Enforce server-side.

Environment: Windows, PowerShell, nvm. Run
`$env:ComSpec = "C:\Windows\System32\cmd.exe"` before npm commands in each
new session or `npm install` fails with `spawn EPERM`.

---

## 12. Anti-patterns

Never ship any of these:

- Inter, or any Google Fonts CDN link
- `transition: all`, `hover:scale`, scroll-triggered stagger reveals
- All-caps eyebrow labels above headings
- Metadata joined with middle dots
- Monospace as decoration for small labels
- Gradient text, gradient buttons, glassmorphism, glow
- One radius on every element regardless of hierarchy
- The same soft grey shadow under every panel
- Every section centred in the same max-width container
- The word "card" in anything a user reads
- Numbered markers on content that isn't a sequence
- An arrow appended to link and button text

The test before shipping any screen: could this have been generated from a
one-line prompt? If yes, something specific to Moodscreen is missing.
