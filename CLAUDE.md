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

1. Mood change cross-fades the Moodscreen's colour and glyph — 240ms. The glyph
   is the §7.3 watermark; the small marks beside the label and in the lockup are
   at full ink and simply swap.
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
6  glyph watermark     mood face, whole, 106px, 13%, low and centred
7  content             §7.5
```

**Layer 6 is whole, never cropped.** Two earlier passes blew the face up and cut
it against the screen edge, and the result does not read as a face running out of
frame — it reads as a rendering fault, which is the one thing a brand mark must
never look like.

It also cannot be drawn as specified, so do not try again. Taking the face's ink
box as 0..1, the eyes occupy 0.196-0.326 and 0.674-0.804 while the widest mouths
(`coding`, `creating`, `learning`, round caps included) run 0.217-0.783. The
mouth overlaps both eyes horizontally, so any cut that removes an eye also cuts
those mouths, from either side, at any size — these are fractions, and scaling
does not move them.

**Its size is set by the band, not by taste.** The mark sits in the gap between
the statement and the lockup, centred horizontally, whole and clear of both, and
that gap is the entire budget. Measured across the three glyph themes and the
§7.6 ladder, the statement bottoms out at 386.3 — `classic`, a four-line
statement — and the lockup starts at 476. **89.7px, and that is all there is.**

Which is why 186 keeps failing and must not be tried a third time. A whole mark
at Logo size 186 draws a face 107×121; at 186px of *face* it is 186×210. Neither
fits in 89.7, so "186, whole, inside the path, clear of the statement" is not a
tuning problem — the four cannot hold at once, at any opacity or position. **106
is the largest size that leaves ~10px of air above and below in the worst case**,
and it draws a face half again the size of the 70px version that preceded it.

To go materially bigger, something else has to give, and both costs are real:
let the mark run behind the lockup (the band down to the bottom edge is 136px,
which does fit ~185) and accept the wordmark sitting across its mouth, which is
the "blob behind the logo" the cropped versions were rejected for; or move the
centre stack back up and give up the centring above.

It takes the card's ink via `currentColor` and is centred on the same axis as the
lockup, so the two read as one column of brand. Centred, not cornered — a corner
is where you put a mark you are apologising for.

Anchor it by the **face's own bottom** against the lockup, not by the element
box: the 40-unit viewBox is mostly margin, so an element-box offset leaves the
visible gap wrong by ~14px. Use `MARK_INK_BOTTOM`, which is set by `speaking`'s
circle — the deepest mouth of any mood — so every mood clears. The lockup is
fixed and the statement is not, so that is the end that can be guaranteed; check
the statement end against the worst case above, not against a comfortable one.

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

**Centre, as one stack, flush left:**

- Avatar, 30px circle, with the live dot tucked against it
- Byline, 12px mono, weight 400, ink at 70%
- Mood label, 13px mono, weight 600, letterspaced `0.25em`, ink at 72%
- The statement — the largest thing on the card by a wide margin

**Left-aligned, not centred**, and every row starts on the same edge. The
byline is an attribution to the statement, so it has to begin where the
statement begins; centred over a block of text it is a header, which is the one
thing the avatar must not become. Once the byline is flush left the statement
has to be too, or "where the statement begins" is a different place on every
line and the attribution points at nothing.

Three consequences worth writing down, because each was got wrong once:

- **The avatar sits above the byline, not beside it.** Inline, its 30px plus
  the gap push the name 40px inboard and the alignment is gone.
- **The mood label loses its `text-indent`.** That existed to cancel the
  trailing letterspace so a *centred* label looked centred; flush left it
  pushes the label a quarter of an em off the edge.
- **The lockup and the watermark stay centred** (§7.3). That is the
  composition: what the person said sits left, the brand sits centred below it.

The byline shows the **handle**, falling back to the display name. The handle
is the one identity the card can be checked against, because the lockup beneath
it points at the page it names; the name is the fallback so a Moodscreen made
before a page was claimed is still attributed rather than anonymous.

The mood label is **heavier than the byline** — 600 against 400. They sit close
together in the same mono face at almost the same size, and at equal weight
they read as one run of metadata. The label earns the emphasis because it is
half of an utterance with the statement (below); the byline is only a signature.

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

**The live dot is preview-only.** It breathes in the app and on the public page
and must never appear in an export — a still image of a live indicator is a
claim the file cannot keep, since the PNG is the same three seconds later and
three weeks later. The renderer gates it on `forExport`, which covers both
§7.8 modes; nothing else needs to know.

**The avatar can be set without an account.** §1 is guest-first and that has to
include the face on the card, so the picture is chosen locally, drawn down to a
128px square, re-encoded, and stored as a `data:` URL in the same guest object
as everything else. Three rules it must keep:

- **A data URL, never `blob:`.** A blob URL dies with the page, is rejected by
  the persistence layer for that reason, and exports as a broken image because
  html-to-image cannot fetch a revoked object URL.
- **Small.** localStorage is a few megabytes for the whole origin and a phone
  photo is several on its own; one would evict the Moodscreen it belongs to.
  128px square is 3× the 30px the export ever samples, and nothing above that
  buys a pixel anyone sees.
- **Cover-cropped, centred, EXIF-oriented.** The card clips to a circle, so
  anything that does not fill the square shows the ground through the disc.

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

One component, three sizes: 17px in the lockup, 24px beside the mood label, and
106px as the §7.3 watermark. Eyes stay fixed; only the mouth path changes per
mood, so adding a mood is one path rather than a new drawing. The existing icon
set stays in the repo for other uses.

### Vertical placement

The three groups are **positioned, not stacked**. The timestamp is a corner
mark and the lockup is a footer, so neither belongs in a column with the centre
stack: as a flex row the 12px timestamp takes full-width layout at the top and
drags the whole reference frame down with it.

**The centre stack centres on the card's own middle** — a frame symmetric about
the centre, running from the drawn top edge (the bow carries it above the safe
inset, so measure it off the path) to its mirror at the bottom.

It is tempting to centre it in the gap between the timestamp and the lockup
instead. That is geometrically honest and reads wrong every time: it leaves a
deep band under the statement with the top pulled tight. The two boundaries are
nothing like each other in weight — the top is the card's own drawn edge, a hard
full-contrast boundary, while the bottom is one 15px line with its domain half
at 60% opacity, a light mark the eye reads through rather than stops at. A heavy
boundary repels and a light one does not, so the perceived field runs past the
lockup to the bottom edge. The timestamp and the lockup are marks in the
margins, not walls, and the stack centres on the object they sit on.

That lands the stack about 23px below the geometric answer, and it falls out of
the symmetric frame rather than a tuned constant — so it stays true if the safe
inset or the lockup's height ever move. Check any change to it against a short,
a medium and a 100-character statement; the longest has the least room to give.

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
  texture: 'scanline' | 'glyph',
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

The stop is picked from where the pointer is over the track, so the snap is the
geometry rather than a rounding step afterwards. **Do not gate the moves on
`hasPointerCapture`.** Capture is worth requesting — it is what keeps a drag
alive when a thumb slides off the strip vertically, which on a phone is most
drags — but when it is also the gate, a failed `setPointerCapture` silently
turns the scrub into a tap: the first stop commits and every move after it is
dropped. Track the drag in a ref and treat capture as the enhancement.

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

### 8.1 The mark at scale

It is drawn for small sizes and it stops reading as a face at large ones. The
strokes and the gaps scale together, so past roughly **200px the eyes and the
mouth are far enough apart that they group into nothing** — three separate
bars rather than a face. §7.3 records this failing twice inside the renderer;
it is the same limit anywhere the mark is drawn.

That sets the ceiling for the §9.1 scatter, whose marks run 60–190px and are
sized *down* as they move outward so none is cut by an edge.

The one deliberate exception is the §9.6 crop, which runs 420–820px and is
meant to be too big to take in at once. It reads as large soft shapes rather
than as a face, and that is accepted knowingly for one instance on the page.
**Do not "fix" it by shrinking it, and do not copy it anywhere else.**

Cropping the mark is governed by what does the cutting. Cut by the *screen's
own edge* it reads as a rendering fault inside a finished object, which §7.3
forbids outright. Cut by the **viewport** it reads as a form running off the
page, because the window crops everything. Even then, keep the cut under a
fifth: take a third and it takes an eye, and what is left is slabs.

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

### 9.7 Dividers — the screen's edge, never a rule

**No horizontal rules anywhere on the site.** Sections are separated by one
shallow bezier: §7.1's first cubic with its ends pinned to the box, drawn at
`--line`, spanning the content column.

`up` is the top edge, so the section under it begins like a screen; `down` is
the bottom edge, so the section above it ends like one. **Alternate them down
the page** — one direction throughout reads as a row of arcs, not a stack of
screens.

Two numbers are fixed and neither is taste:

- **Container width, not viewport.** An arc is judged by its rise against its
  own width. Edge to edge at 1440px the same curve reads as a line somebody
  failed to level.
- **Depth 44px**, which puts the visible rise at 33px — the card's own 2.88%
  across a 1120px column, since a cubic reaches three quarters of its control
  offset at the midpoint.

The same curve at `depth 14`, uncontained, is the ornament under a heading. A
dot-line-dot rule is a horizontal rule wearing a hat; it does not come back.

### 9.8 Face-mark backgrounds — two sections, not six

**Exactly two sections carry one, and they are the hero and the close.** The
pulse needs a clean field for its numbers and the wall already shows real
Moodscreens; a texture on every section stops being a texture and becomes the
background colour. In both, the headline and the content stay clearly dominant.

- **Hero** — around twenty marks, 60–190px (see §8.1), slight rotations, each
  a different mood colour at 8–14%. Laid out on a jittered ring and masked
  clear of the middle, so the headline and editor sit on empty ground at any
  viewport. Very slow drift, `transform` only, tens of seconds a leg. This is
  the one place the four §6 durations do not apply — it is ambient, not a
  response to anything. Cancel it outright under `prefers-reduced-motion`;
  the blanket rule in `base.css` parks an animation at its *end* state, which
  for the drift is a different drawing rather than the still one.
- **Close** — one mark, 420–820px, single mood, static, bleeding off the
  **right** edge, opposite the left-aligned content. See §8.1 for what this
  costs and why it is accepted here and nowhere else.

---

## 10. Components

**Button** — six states, all specified: rest, hover, active, focus-visible,
disabled, loading. Most builds ship two and it shows.

Secondary 36px, radius 10px. Hover **lightens the fill**; it does not scale.
Active `translateY(1px)` at 80ms. Focus-visible is a 2px accent ring at 40%
alpha with 2px offset — never removed.

One primary action per view. No gradient fills, no glow.

**The primary button is the screen in miniature, not a pill.** §7.1's outline
is the brand; a rounded rectangle beside it is the one shape on the page that
could have come from anywhere. So the primary action is a Moodscreen: the same
path fitted to a wide box, a mood colour from §3, and the §8 face mark beside
the label. Around **210 × 68**, left-aligned, never full width.

It reuses `screenPathBox` and `<Logo>`. Nothing about it is new geometry, and
if it ever needs a private copy of either it has stopped being the product's
own shape.

Two states are drawn differently for reasons the shape forces:

- **Hover** steps to the next mood round the §7.9 hue ring over 180ms, and
  each hover advances one more, so hovering repeatedly walks the ring. That is
  the same promise as "hover lightens the fill, never a scale", kept in the
  currency this button trades in — and it is §3's accent rule turned into an
  invitation, since this is the thing whose colour you are about to choose.
- **Focus-visible** cannot be an `outline`: an outline round a screen is a
  rectangle round a screen. It is a second copy of the path, stroked at 2px,
  fitted to a box 4px larger on each axis — which is what "2px offset" means
  on a shape whose sides are bowed, there being no single direction to push a
  curved edge in.

The 44px primary in the first paragraph is what a screen-shaped button
replaces, not something that also exists. The old `<Button variant="primary">`
stays for dense contexts — pickers, the studio's toolbar — where a 68px screen
would be the loudest thing in a row of controls.

**Input** — 44px, `--panel` background, `--line` border, `--line-strong` on
hover, accent border plus tint on focus. The username field shows
`moodscreen.live/` as a fixed prefix inside the field, not as a label above it.

---

## 11. Repo facts

Vite + React 19 + Tailwind v4 + Supabase + `html-to-image` + React Router v7.

### What a Moodscreen is stored as

Payload **v3**: `mood`, `statement`, `surface`, `themeId`, plus name, location,
link, avatar and the two timestamps. Nothing else, and in particular no second
copy of the mood.

Two older shapes exist in the wild and are read, never written:

- **v2** kept up to two `{ categoryId, text }` rows drawn from a list of 34
  emoji categories, a vocabulary that competed with §3's ten moods for saying
  what a Moodscreen was about.
- **v1** kept four loose top-level strings.

`normalizeStoredMoodscreen` is the only place that knows this, and
`moodscreenModel.js` exists solely to map the old categories onto moods. A
record migrates the first time its owner opens the site. Delete either file and
every pre-redesign Moodscreen comes back blank.

Known problems to fix rather than work around:

- `MoodscreenContext.jsx` is 574 lines doing form state, export, share, and
  sync. Split it.
- `legacy.css` is 600 hand-written lines running alongside Tailwind v4. Pick
  one. Tokens in CSS variables, everything else Tailwind. The legacy aliases at
  the bottom of `tokens.css` die with it.
- `/:username` sits at the root, so every future top-level route collides with
  the username space. `isReservedUsername` is a list you maintain forever.
  Move public profiles to `/u/:username` with a redirect from the old shape,
  or accept the maintenance cost knowingly.
- The public profile does two sequential Supabase round-trips. Join them —
  this is the page shared links land on.
- The save rate-limit is in localStorage, so it is a politeness guard, not
  security. Enforce server-side.

**A cooldown may delay a write. It must never drop one.** The persist effect
runs on form change and nothing else, so an early `return` inside it loses the
*last* edit of any burst permanently — there is nothing left to retry. It read
as an avatar that would not stick, because choosing a picture tends to be the
last thing done and lands a second or so after the statement that triggered the
previous save; it applied to every field. Compute the wait up front instead:
the debounce, or whatever is left of the cooldown, whichever is longer.

Environment: Windows, PowerShell, nvm. Run
`$env:ComSpec = "C:\Windows\System32\cmd.exe"` before npm commands in each
new session or `npm install` fails with `spawn EPERM`.

When the nvm shim itself breaks — `npm run build` dying in
`node:internal/modules/cjs/loader` with `Invalid or unexpected token`, which is
node being handed its own binary as a script — skip npm and call the tool
directly. **Absolute paths for both arguments**, or the same failure comes back
from the other end: a relative script path resolves against the shim's idea of
the working directory rather than yours, and what node then reads is `node.exe`.

```powershell
& "$env:LOCALAPPDATA\nvm\v24.16.0\node.exe" C:\dev\moodscreen\node_modules\vite\bin\vite.js build
& "$env:LOCALAPPDATA\nvm\v24.16.0\node.exe" C:\dev\moodscreen\node_modules\vite\bin\vite.js --port 5177 --strictPort
```

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
- A horizontal rule, anywhere — §9.7
- A pill-shaped primary action — §10

The test before shipping any screen: could this have been generated from a
one-line prompt? If yes, something specific to Moodscreen is missing.
