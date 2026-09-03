# Claude Code session prompts

Run these one at a time. Commit between each. If a session goes wrong you
throw away one piece, not the site.

`CLAUDE.md` is read automatically at the start of every session, so none of
these prompts repeat the design system.

**Every new PowerShell session, before npm:**

```powershell
cd C:\dev\moodscreen
$env:ComSpec = "C:\Windows\System32\cmd.exe"
```

Work happens on `redesign`.

---

## Status

| Session | State |
|---|---|
| 1 — Tokens and primitives | done, `fb51b22` |
| 2 — The Moodscreen renderer | done, `bde899c` |
| 2b — Renderer rework for the new §7 | done |
| 3 — Hero | done |
| 4 — Pulse and wall | next |
| 5 — Remaining sections and the public page | ahead |

§7 was rewritten after session 2 shipped (`d087307`). Sessions 1 and 2 are
history and are recorded below as what was built, not as work to do. The gap
between what they built and what §7 now says is session 2b, and only 2b.

---

## Session 1 — Tokens and primitives *(done, `fb51b22`)*

Built: token layer as CSS variables in `src/styles/tokens.css`; Switzer and
Instrument Serif self-hosted as subset woff2 in `/public/fonts`; the grain
tile at `/public/textures/grain.png` applied once at app root; `<Button>`
with all six states; `<Input>` with the inline `moodscreen.live/` prefix;
`<Logo mood>` and the wordmark lockup in `src/components/brand/`;
`HomePage.jsx` deleted; `/kitchen-sink` route.

Still true, nothing here is superseded.

---

## Session 2 — The Moodscreen renderer *(done, `bde899c`)*

Built: theme schema in `src/themes/` with `classic` and `sharp`;
`StatusCard.jsx` rebuilt as `<Moodscreen>`, one component for preview and
export at a 360×450 base; grain, crop marks, glyph watermark from
`src/components/icons/`, and the light edge; `statementFit` as a px ladder
capped at 180 characters; the export path with `document.fonts.load()` plus
`document.fonts.ready`, 3× scale, and a die-cut border; the two-tap share
fixed with a pre-rendered blob.

**The single-component rule and the export path survive the rework. The
geometry, the texture set, the surface model and the theme schema do not** —
see 2b.

---

## Session 2b — Renderer rework for the new §7

> Read CLAUDE.md §7 in full. This reworks the renderer that session 2 built;
> it does not start it over. `<Moodscreen>` stays one component rendering
> both preview and export, and the export path's font loading, cached
> `getFontEmbedCSS`, debounced pre-render and `moodscreen-{username}.png`
> filename all stay as they are.
>
> 1. **Shape.** Replace the 360×450 rounded rectangle with the 540×540
>    screen. Draw the §7.1 path on a `0 0 400 400` viewBox, use it as the
>    fill and as a `clipPath` for every layer inside it, and inset content
>    13% on all sides. `border-radius` goes.
> 2. **Surface moves to the user.** `resolveSurface` already handles
>    colour, ink and paper — take the choice out of the theme object and
>    put it in user state, and derive all three ink values in OKLCH from
>    the mood's hue rather than reading `mood.ink`. Paper is `#F4F2EC`.
> 3. **Night tint.** `resolveSurface` takes the timestamp alongside mood
>    and surface, and shifts lightness by the §7.4 bands. Automatic, no
>    toggle.
> 4. **Layers.** Build the §7.3 stack bottom to top. Crop marks and the
>    light edge are gone; the vignette and the scanlines are new. Scanline
>    opacity is per surface — colour 13%, ink 12%, paper 7%. Grain stays a
>    PNG tile, never an SVG filter.
> 5. **The face mark becomes the glyph.** One component with a `mood` prop
>    at three sizes: 17px in the lockup, 24px beside the mood label, 300px
>    as the watermark. It replaces the `src/components/icons/` glyph in the
>    renderer; leave that icon set in the repo for other uses.
> 6. **Content.** Rebuild the layout to §7.5: timestamp alone top-right;
>    the centre stack of 30px avatar with live dot, name, mood label,
>    statement; the lockup centred at the bottom. The mood label sits
>    directly above the statement.
> 7. **Statement.** `statementFit` returns an index, not a size, on the
>    §7.6 breaks. The renderer reads `theme.font.scale[index]`. Hard cap
>    drops from 180 to 100 characters — clamp existing statements on read.
> 8. **Themes own type only.** Reshape the schema to §7.7 and ship the five
>    free themes: `nokia`, `terminal`, `impact`, `classic`, `clean`.
>    `sharp` goes. Self-host each display face as subset woff2, loaded
>    lazily per theme. No CDN links.
> 9. **Export.** Two modes: `default` at 1620×1620 with the screen centred
>    on `#08080A` at a 7% margin, and `sticker` at 1620×1620 transparent
>    outside the path. Default is the backdrop one. The die-cut border goes.
>
> Update `/kitchen-sink` to show all thirty mood × surface combinations,
> the five themes, and both export modes.

Check: a theme change touches no file in `src/components/`; the exported PNG
matches the preview; a 100-character statement fits at the smallest step; a
card timestamped 3am is visibly darker than the same card at noon; the
vignette is invisible as an effect; the word "card" appears in code only.

---

## Session 3 — Hero

> Read CLAUDE.md §9 and §7.9.
>
> Build the hero: headline, subhead, and a live editor where typing updates
> the Moodscreen in real time and choosing a mood cross-fades its colour and
> glyph over 240ms. No create button — the CTA is the claim field.
>
> **The editor is a single statement field, the mood control, and the
> surface control. Nothing else.** The mood category picker and the
> suggestion list come out — mood is now picked on the §7.9 control, and
> surface is the second of the two user choices, so it belongs beside it in
> the editor rather than anywhere else. Web gets the horizontal strip, not
> the wheel; same data and same component, different control. The surface
> control is the three small squares.
>
> Wire it to the existing guest localStorage path so anyone can make and
> share without an account. The nav logo takes the currently selected mood,
> and `--accent` follows it too.
>
> Centred — this is the only centred section on the site.

Check: type a sentence and the Moodscreen updates with no lag; change mood
and the logo and buttons change colour with it; the card updates during the
strip drag, not on release; three taps get you a finished Moodscreen.

**Shipped**, plus four things the prompt above does not mention and CLAUDE.md
now does — read those sections before touching any of them:

1. The primary button is the screen in miniature, not a pill — §10.
2. Section dividers are the screen's edge, alternating direction. No horizontal
   rules anywhere — §9.7.
3. Face-mark backgrounds on exactly two sections, the hero and the close, and
   the size limits that keep the mark reading as a face — §9.8 and §8.1.
4. Storage moved to payload v3, `mood` + `statement`, with v2 and v1 read
   through `normalizeStoredMoodscreen` — §11.

Also built here because the hero needed them: `SiteNav`, `ClaimField` (with the
claim stashed across the sign-in redirect and prefilled into onboarding), and
the §9.6 close, since a closing section had to exist to carry the background.
Session 5 keeps the rest of its list.

The three light-ground sections between the hero and the close are still
pre-redesign and are what sessions 4 and 5 replace. They were put on `--canvas`
and had their §2 and §12 breaks fixed so the page reads as one product in the
meantime; nothing about them is finished work. `ColorEnergySection` in
particular is cut back to the shape §9.2's pulse will fill.

---

## Session 4 — Pulse and wall

> Read CLAUDE.md §9 sections 2 and 3.
>
> 1. **Pulse.** One cached aggregate query counting live Moodscreens by mood.
>    Big total, breakdown as a mood-coloured bar beneath. Digit roll on
>    change, 180ms. Hide the entire section below 200 live Moodscreens.
> 2. **Wall.** Full-bleed, breaking the content container. Two rows of real
>    public Moodscreens scrolling opposite directions, `mask-image` fading
>    both ends, each linking to its live page. Respect the public visibility
>    flag, default off. Handle the empty state by hiding the section.
> 3. Scroll-link the hero Moodscreen so it scales down and joins the wall.
>    Disable this under `prefers-reduced-motion`.
>
> Seed 30 example Moodscreens, spread across moods, surfaces and themes so
> the wall shows the range rather than thirty of the same look.

Check: wall scrolls smoothly on a mid-range Android, edges fade rather than
clip, reduced-motion disables the scroll effect.

---

## Session 5 — Remaining sections and the public page

> Read CLAUDE.md §9, §7.10 and §11.
>
> 1. How it works — three steps, numbered, since this is a real sequence.
> 2. Themes — horizontal scroller of real Moodscreens in each of the five
>    free themes, with Pro ones marked. No pricing table.
> 3. Closing claim field.
> 4. Rebuild the public profile page using the same `<Moodscreen>`
>    component, and collapse its two sequential Supabase queries into one.
>    Per §7.10 it is for strangers with no context: big avatar, name,
>    location, the Moodscreen smaller, `updated 20 minutes ago`, one
>    optional link. It must never read as static.
> 5. Make sure the app view is the §7.10 one — a single Moodscreen and two
>    actions, Share and Change it. No list, no feed, no second link.
> 6. Audit every user-facing string against the vocabulary table in §2. The
>    word "card" must not appear anywhere a user can read it.

Check: read the whole page top to bottom on a phone. Anything that could have
come from a one-line prompt gets revised.

---

## Not in these sessions

Deliberately deferred, in rough priority order:

- **Per-user OG images.** Your biggest growth leak — every shared link
  currently previews as nothing. Needs a server-rendered route, so it is its
  own project.
- The mood wheel proper. Session 3 ships the web strip; the wheel with
  detents and haptics is a mobile control and waits for the app.
- Moving `/:username` to `/u/:username`.
- Server-side rate limiting.
- Splitting `MoodscreenContext.jsx`.
- Pro tier and payments, including the free-hue wheel, the extra themes, and
  the mobile app.
