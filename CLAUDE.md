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

1. Mood change cross-fades the Moodscreen's colour — 240ms. Colour only: the
   glyph that used to cross-fade with it was the §7.3 watermark, which is gone.
   The mark beside the label and the one in the lockup are small and at full
   ink, and swap.
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

The existing approach holds: the card lays out at one fixed size and `width`
scales it with a transform. Only the base size changes.

```
BASE = 540 × 540    export at 3× → 1620 × 1620
```

### 7.1 The shape

Not a rounded rectangle. A **screen** — edges bowing outward, corners pulled
tight, like a Nokia or a CRT. The outline is the brand; it comes straight out
of the product name and nothing else in this category looks like it.

Draw it as one SVG path on a `0 0 400 400` viewBox and let it scale:

```
M75 20 C150 4, 250 4, 325 20 C357 27, 373 43, 380 75
C396 150, 396 250, 380 325 C373 357, 357 373, 325 380
C250 396, 150 396, 75 380 C43 373, 27 357, 20 325
C4 250, 4 150, 20 75 C27 43, 43 27, 75 20 Z
```

Not CSS `border-radius` — the bow can't be expressed that way. Use the path
as fill and as a `clipPath` for every layer inside it.

Because the corners curve inward, content sits further in than on a
rectangle — and not by a constant. The shape is ~30 units narrower at the
height of the top row than at its middle, so one square inset either clips
that row or shrinks the statement. **Measure the side inset off the path, per
row, over the band of heights that row occupies.** The rows nearest the
corners land near 13%; the statement's band is wider.

### 7.2 Two user choices

Every Moodscreen is a combination of exactly two things the user picks.

**Mood → colour.** Ten moods, each owning a hue. This is meaning, not
decoration: violet is always thinking, red is always speaking.

**Surface → arrangement.** Three options for how that colour appears:

| Surface | Card | Text |
|---|---|---|
| `colour` (default) | the mood hue | a dark tone of the same hue |
| `ink` | near-black, lifted clear of `--canvas` | a lightened tone of the mood |
| `paper` | bone `#F4F2EC` | a darkened tone of the mood |

`ink` is near-black *relative to the ground it is seen against*, not in
absolute terms: derived from `--canvas` at +0.15 OKLCH lightness, never
hand-picked. A fixed near-black hex sits at 1.03:1 against the §7.8 backdrop,
which makes the outline — the thing §7.1 calls the brand — invisible in the
export. The bar for the lift is the `colour` surface: a mood fill reads as an
object on the backdrop, and `ink` has to read as one too rather than as a
slightly different black.

Ten moods × three surfaces = thirty looks from two taps.

Surface is chosen by the **user**, not by the theme. `resolveSurface` already
handles these three cases — move the decision out of the theme object and into
user state.

All three ink values are derived in OKLCH from the mood's base hue, never
hand-picked. Same hue, clamped lightness. That way an eleventh mood costs
nothing and the Pro free-hue wheel works with no extra data.

### 7.3 Layers, bottom to top

```
1  surface fill        per §7.2
2  night tint          lightness shift by hour, §7.4
3  vignette            radial, ink at 10-14%, starting at 60% radius
4  scanlines           horizontal, 6px pitch, 2.2px line
5  grain               tiled PNG, 6-9%
6  content             §7.5
```

**There is no glyph watermark layer.** There was one — the mood's face blown up
behind the content and cropped by the screen edge — and it cannot be built,
because the two halves of that brief contradict each other in the mark's own
proportions. Taking the face's ink box as 0..1, the eyes occupy 0.196-0.326 and
0.674-0.804 while the widest mouths (`coding`, `creating`, `learning`, round
caps included) run 0.217-0.783. The mouth overlaps both eyes horizontally, so
any cut that removes an eye also cuts those mouths, from either side, at any
size — these are fractions, and scaling does not move them.

Uncropped it failed differently. At 186px the strokes are 24px thick, the eyes
stand 89px apart and the mouth hangs 80px below them; at 14% nothing groups
three marks that far apart, and it rendered as two vertical bars and a detached
blob. The card also already carries this face twice — 24px beside the mood
label, 17px in the lockup, both at full ink — so the third copy was never
carrying a cue the card lacked. Do not reintroduce it.

Scanline opacity is per surface: `colour` 13%, `ink` 5.5%, `paper` 4%. Dark
texture on a light field reads much stronger, so paper needs it dialled back —
and further than the 7% first written here, because at that strength the bone
surface reads as woven cloth rather than as a CRT. The same principle with the
sign flipped governs `ink`, where the line is a *lightened* tone on a near-black
field and so nearly full contrast. Both are the same failure as dark-on-paper
and want the same answer. Nothing here is per theme: `nokia` looks the heaviest
only because Silkscreen's own pixel rows land near 4.75px against the 6px pitch
and the two grids beat into a weave. The pitch stays; the contrast gives way.

Same principle applies to the vignette.

The vignette must stay invisible as an effect — if you can point at it, it's
too strong. It exists to make the screen read as convex and to push attention
to the middle. The grain sitting above it also dithers away the banding that
JPEG compression would otherwise show in the corners.

Grain must be a **PNG tile, not an SVG filter** — `html-to-image` does not
reliably capture filters, so a filter-based grain vanishes from exports.

### 7.4 Night tint

The card's tone shifts with the hour it was posted. Same hue throughout;
only lightness moves.

```
06:00-17:00   day       base
17:00-22:00   evening   lightness −6%
22:00-06:00   night     lightness −14%, ink lightened to compensate
```

A 3am thought should look like a 3am thought. This is derived from the
timestamp already being stored, so `resolveSurface` takes the timestamp
alongside the mood and surface.

Automatic, no toggle. The card is *of a moment*; it isn't configured.

### 7.5 Content

Three groups, one of them loud.

**Top-right:** the timestamp, mono, ink at 70%. Nothing else in the top row.

**Centre, as one stack:**

- Avatar, 30px circle, with the live dot tucked against it
- Name, 12px mono, ink at 70%
- Mood label, 13px mono, letterspaced `0.25em`, ink at 72%
- The statement — the largest thing on the card by a wide margin

The avatar is a **signature, not a header**. Keep it at 30px. A larger one
costs the statement four points of size and makes the layout generic. In a
story the poster's real face is already above the card in the platform's own
chrome, so this is a mark, not a portrait.

Its fill and edge are **per surface**, and one pair of alphas will not serve all
three. On `colour` and `paper` the ink is a dark tone on a lighter field and a
14%/22% wash reads as an object. On `ink` the relationship inverts — a lightened
mood tone on a near-black field — and the same alphas land about nineteen levels
above the background, which the vignette then eats into at exactly the radius the
avatar sits at, leaving the disc all but invisible. `ink` takes 26%/44% instead.

The mood label sits **directly above the statement**, never in a corner.
Label and statement are one utterance and must read as a pair.

**Bottom, centred:** the lockup — the three-stroke face mark, then
`moodscreen` bold, then `.live/username` at 60% weight and opacity.

The mark takes the card's mood. On a thinking card the little face is
thinking; on a speaking card it's speaking. It is the same component as the
nav logo, at 17px, with the card's ink as `currentColor`. Centred, not
corner-aligned — corner reads as a watermark someone forgot to remove.

**The mood glyph is the three-stroke face from §8**, not the icons in
`src/components/icons/`. Those are primitive single-path geometry — `thinking`
is a bare circle, `offline` a single straight line — and they carry no mood at
small sizes. The face does, and it means something at every size.

One component, two sizes: 17px in the lockup and 24px beside the mood label.
Eyes stay fixed; only the mouth path changes per mood, so adding a mood is one
path rather than a new drawing. The existing icon set stays in the repo for
other uses.

### Vertical placement

The three groups are **positioned, not stacked**. The timestamp is a corner
mark and the lockup is a footer, so neither belongs in a column with the centre
stack: as a flex row the 12px timestamp takes full-width layout at the top and
drags the whole reference frame down with it, and the stack then centres in the
space below the timestamp while the eye centres it in the space below the card's
edge. The two disagree by about 29px, which reads as a void above the avatar.

So the centre stack owns the field from the **drawn top edge** — the bow carries
it above the safe inset, so measure it off the path — down to the top of the
lockup, and is optically centred in it. Optically, not geometrically: the frame's
top boundary is an empty edge and its bottom boundary is the lockup's ink, and
mass at the bottom pulls the perceived centre down, so lift the stack ~6px off it.

### 7.6 The statement

**Hard cap: 100 characters.** Five lines at the smallest step is the ceiling —
beyond that the type drops below what survives WhatsApp's compression and
starts crowding the lockup.

`statementFit` returns an **index, not a size**:

```
≤ 20 chars  → 0
≤ 45 chars  → 1
≤ 75 chars  → 2
≤ 100 chars → 3
```

The renderer reads `theme.font.scale[index]`. Short statements get *bigger* —
this rewards punchiness without ever telling anyone to be punchy.

### 7.7 Theme bundles

A theme owns **type only**. Colour belongs to the mood, surface belongs to
the user, chrome never changes. Getting this boundary right is what lets 40
themes still look like one product.

```js
{
  id: 'nokia',
  name: 'Nokia',
  tier: 'free',
  font: {
    family: 'Silkscreen',
    faceFamily: 'Silkscreen',
    weight: 400,
    case: 'upper',
    tracking: '0.02em',
    lineHeight: 1.35,
    scale: [30, 24, 18, 14],
  },
  texture: 'scanline' | 'none',
}
```

Every field is necessary because typefaces are not interchangeable:

- **`case`** — Silkscreen and Press Start 2P come from displays that only had
  uppercase; caps is native to them. Instrument Serif and Bodoni depend on the
  contrast between capitals and lowercase, so caps destroys them. Pixel and
  mono themes uppercase; serif themes do not.
- **`scale`** — the font-size number sets the em box, not the letters inside
  it. Bebas Neue at 50 and Press Start 2P at 24 occupy the same space. A
  single global ladder would overflow half the themes and shrink the rest.

Adding a theme is adding one object to `src/themes/`. Nobody touches the
renderer. If a new theme requires a renderer change, the abstraction is wrong.

**Free tier — five, one of each kind:**

```
nokia       Silkscreen        upper     [30, 24, 18, 14]
terminal    JetBrains Mono    upper     [31, 25, 20, 16]
impact      Bebas Neue        upper     [50, 40, 30, 24]
classic     Instrument Serif  sentence  [46, 36, 28, 22]
clean       Switzer           sentence  [38, 30, 24, 19]
```

Pro adds from the licence-cleared list — all OFL or Fontshare, all free to
embed in a commercial product. Do not ship Monument Extended or Editorial New;
those need paid licences.

Fonts are self-hosted subset woff2, loaded lazily per theme, subset to the
characters that theme actually renders. Never a Google Fonts CDN link.

### 7.8 Export

**Two modes. The default is the one with a backdrop.**

```
default   1620 × 1620, screen centred on #08080A with a 7% margin
sticker   1620 × 1620, transparent outside the screen path
```

The backdrop is not decoration — it is what makes the file safe. WhatsApp
converts images to JPEG, which has no transparency, so a transparent export
comes back with black or white blocks where the bow should be. Since sending
to someone on WhatsApp is a core use, the safe version is the default.

Sticker mode is for IG and Snapchat story stickers, where transparency is
preserved and the screen genuinely sits on the person's photo.

The backdrop is near-black rather than the mood colour, so a shared Moodscreen
carries the brand surface with it and the mood stays the thing that pops.

Everything else in the existing export path stays: `document.fonts.load()` for
the active theme family followed by `document.fonts.ready`, cached
`getFontEmbedCSS`, pre-rendered blob on a 400ms debounce for one-tap share,
`moodscreen-{username}.png`.

### 7.9 The picker

**Mood wheel.** A ring of ten stops ordered by hue, scrubbed with a thumb. The
centre shows the current mood's glyph and name, both changing as you scrub.
Snap to the nearest stop with a light haptic — free-scrolling feels imprecise;
detents feel like a dial. The card updates live during the drag, not on
release, using the 240ms cross-fade already in the motion budget.

**Surface control.** Three small squares beneath the wheel: colour, ink, paper.

**Web gets a horizontal strip** instead of the wheel — same data, same
component, different control. A wheel needs circular mouse movement and nobody
enjoys that.

**Pro: free hue.** The same wheel with `snap: false` and hue as a float. The
ten stops become detents you feel as you pass them. Constrain lightness and
chroma so the wheel picks only the angle — that guarantees contrast at any
point and keeps every card looking like the same product.

### 7.10 App and page

The two surfaces do different jobs and must not converge.

**The app** shows exactly one Moodscreen — the user's own — and two actions:
Share, and Change it. No list, no feed, no second link. Every competitor opens
onto a list of things; opening onto a single object you either accept or change
is the product. It also means opening the app *is* the prompt to update.

**The page** at `moodscreen.live/username` is for strangers arriving from a
story with no context. Big avatar, name, location, the Moodscreen at a smaller
size, `updated 20 minutes ago`, one optional link.

The page must never read as static. The live dot and the relative timestamp are
the whole difference between this and a link-in-bio page.

---

## 8. Logo

A three-stroke line face. Two vertical strokes for eyes, one for the mouth.
Vertical eyes, not dots — dots plus a curve is a smiley, and smileys are the
most exhausted mark in software.

It is a **component with a `mood` prop**, not a static file. Eyes never move;
only the mouth path changes per mood. Adding a mood is one path, not a new
logo.

```
building   M16 25 Q20 29.5 24 25
thinking   M15 27 H22
coding     M15 27 H25   (eyes become horizontal: M10 12 H19, M21 12 H30)
speaking   circle cx20 cy27 r3
offline    M16 27 Q20 23.5 24 27
```

Stroke 3 at 40×40, `stroke-linecap: round`, `currentColor`. Bump to 3.6 below
24px or it thins out. Favicon: fixed `thinking` mouth.

Eyes are strokes, not dots — but length alone does not get you there, because
an eye must also **stop, clear of the mouth**. Vertical eyes run y 7 to 17: ten
units, about 2.8× the stroke, ending four units above the nearest mouth. Grow
them further and the round cap meets `building`'s mouth stroke, the two fuse,
and the mark renders as a capital U rather than a face.

For the same reason the curved mouths are inset to x 16..24 rather than §8's
original 15..25. Ends sitting directly beneath the eyes read as one continuous
stroke at 17px, where the gap between them is under three pixels and cannot
argue otherwise. The straight mouths need no such help.

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
