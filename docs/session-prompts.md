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
| 4 — Pulse and wall | done |
| 5 — Remaining sections and the public page | done |

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

**Shipped**, with four decisions the prompt above does not settle:

1. **No freshness rule yet.** The wall shows the most recent public Moodscreens
   with no expiry, and the pulse counts every Moodscreen rather than only recent
   ones. What makes one stale is an open product question; it is deliberately
   not guessed at. When it is settled it lands in two constants —
   `WALL_WINDOW_HOURS` and `PULSE_WINDOW_HOURS` in `wallService.js`, and the
   `window_hours` argument `pulse_by_mood` already takes — and no query shape
   moves.
2. **The pulse is built but will not draw yet.** §9's 200 threshold is real and
   seeds are not counted towards it — padding the number with examples to clear
   the bar that exists to stop a small number being advertised would be
   advertising a false one. So the section is dead until there are 200 real
   Moodscreens, which is correct and worth knowing.
3. **`wall_public` is a new column on `profiles`, separate from the username.**
   Claiming a page publishes that page; appearing on the front page is a second
   ask. The old policy gating public reads on `username IS NOT NULL` is
   unchanged, so the public profile still works exactly as before.
4. **Seeds are their own table.** `moodscreens.user_id` is a foreign key to
   `auth.users`, so seeding it would have meant thirty fabricated accounts.
   `src/lib/wallSeeds.js` is the authored source, `supabase/seed-wall.sql` is
   generated from it by `npm run seed:wall`, and the app falls back to the JS
   list when Supabase is not configured — which is how the wall draws in local
   development at all. `PublicProfilePage` serves seed pages from the same list
   so no tile on the wall links into a dead end. Drop the table when real
   Moodscreens fill the rows.

Also here: `WallOptIn` on `/create`, since a flag nobody can set is not opt-in,
it is off. It is placed outside `GeneratorPanel` so §7.10's app view can take it
whole. `ColorEnergySection` is gone. `LandingPage` now builds its section list
at render time, because §9.7's alternating dividers cannot be written by hand
once two sections hide themselves.

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

**Shipped**, with five decisions the prompt above does not settle:

1. **The public page keeps location, and drops everything else.** The build
   order was the session's own brief: avatar, name and handle small at the top;
   the Moodscreen large; `updated N minutes ago` with the live dot directly
   under it; the one optional link; a quiet "Make your own Moodscreen" last.
   Location is not in that list but §7.10 names it, so it sits with the identity
   block as a third small line rather than being dropped or promoted.
2. **The single query is a view, not a client-side join.** `moodscreens` has no
   foreign key to `profiles` — both point at `auth.users` — so PostgREST cannot
   embed one in the other and no amount of client work makes it one request.
   `public_moodscreens` in `schema.sql` does the join, exactly as session 4's
   `wall_moodscreens` already did for the wall. It is a LEFT JOIN: claiming a
   page and writing a Moodscreen are two acts, and an inner join would answer
   "this page doesn't exist" to someone who claimed it a minute ago.
3. **`useFittedWidth` exists because §7's `width` is not a CSS width.** It is
   the number the transform's scale is computed from, so `max-w-full` caps the
   box and lets the drawn card run past it. That was already true of the hero at
   360 (clipped by the section's `overflow-hidden` on a 360px phone) and would
   have been a sideways-scrolling page on the two new views. The hook measures
   the column and the card follows; the hero, the app and the public page all
   use it.
4. **The themes scroller shows real seeds, not specimens.** §9.5 asks for "real
   Moodscreens in each theme", and §9.3's seed list already carries one of every
   free theme because its mood, surface and theme cycles are run against each
   other. So the section is a lookup over `WALL_SEEDS`, not a new fixture, and
   each tile is exactly what that seed's own page renders. The cost is that the
   five statements differ, which isolates the typeface less cleanly than five
   identical sentences would — the label under each tile carries that instead.
5. **`GeneratorPanel` is gone, not hidden behind a flag.** §7.10's app view is
   one Moodscreen and two actions, so the studio's two-column layout had nowhere
   to be. The editor is not deleted — `StatusForm` is intact behind "Change it",
   with every field it had including the single link. Copy link and Save the
   image went with it: `sharePng` already opens the share sheet where there is
   one and saves the file where there is not, so one button is the whole of
   "get this out of here" and two would be how a view ends up with four.

The vocabulary audit found the word "card" only in code — Tailwind's `bg-card`,
`--app-card`, element ids, comments — which §2 permits. What it did find was the
banned phrase itself: `SignupWidget` shipped `"create yours"` as the nav label on
every page. Also fixed: "Open studio →" (§12's appended arrow, plus a word §2
does not have), "Save your moodscreen" lowercase in the auth modal, and
onboarding's "Finish setup" / "Status" / "What you're up to". Onboarding's
username field also took §10's `moodscreen.live/` prefix in place of a bare `/`.

`/kitchen-sink` still says "card" in its notes and is left alone deliberately: it
is an internal reference that quotes CLAUDE.md's own reasoning, and it is not
linked from anything a user reads.

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
