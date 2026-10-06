/**
 * The app — CLAUDE.md §7.10.
 *
 * "The app shows exactly one Moodscreen — the user's own — and two actions:
 * Share, and Change it. No list, no feed, no second link. Every competitor opens
 * onto a list of things; opening onto a single object you either accept or
 * change is the product. It also means opening the app *is* the prompt to
 * update."
 *
 * That last sentence is what the shape below is protecting. A studio — the
 * editor open, every field visible, the preview beside it — asks you to review
 * eight controls before you have decided whether anything needs changing. This
 * asks one question by showing you one object: is that still what you are on? If
 * it is, you share it and leave. If it is not, one tap opens the editor.
 *
 * So the editor is not gone, it is *closed*. Everything the studio had —
 * statement, mood, surface, theme, photo, name, location, the one link — is
 * behind "Change it", which is the second of the two actions rather than a
 * different page. §1's single link stays single; there is nowhere here for a
 * second one to be added.
 *
 * **Two actions, not four.** Copy link and Save the image are gone from the top
 * level. Share is not a narrower thing than download: `sharePng` opens the OS
 * sheet where there is one and saves the file where there is not (see
 * MoodscreenContext), so one button is the whole of "get this out of here" on
 * every device. Two buttons for one intention is how a view ends up with four.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthBar from "../components/AuthBar.jsx";
import Moodscreen from "../components/Moodscreen.jsx";
import StatusForm from "../components/StatusForm.jsx";
import WallOptIn from "../components/WallOptIn.jsx";
import Wordmark from "../components/brand/Wordmark.jsx";
import ScreenButton from "../components/brand/ScreenButton.jsx";
import Button from "../components/ui/Button.jsx";
import useFittedWidth from "../hooks/useFittedWidth.js";
import { useMoodscreen } from "../context/MoodscreenContext.jsx";

/** Bigger than the hero's 360 — this view has nothing to share the row with. */
const CARD_MAX = 400;

export default function CreatePage() {
  const {
    formValue,
    handleFormChange,
    moodscreenProps,
    sharePng,
    isExporting,
    shareReady,
    downloadError,
    storageNotice,
    storageHydrated,
  } = useMoodscreen();

  const [editing, setEditing] = useState(false);
  const [cardRef, cardWidth] = useFittedWidth(CARD_MAX);

  return (
    <div className="min-h-dvh bg-canvas">
      {/* A mark and a way back, same as the nav (§7.10 leaves a nav nothing to
        * link to). Static rather than absolute here — there is no hero for it
        * to sit over. */}
      <header className="px-4 pt-[calc(0.85rem+env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto flex max-w-content items-center justify-between gap-4">
          <Link
            to="/"
            className="rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-4"
            aria-label="moodscreen — home"
          >
            <Wordmark mood={moodscreenProps.mood} size={20} />
          </Link>
          <AuthBar />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-content flex-col items-center px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
        {/* The object. Nothing above it but the mark, nothing beside it. */}
        <div ref={cardRef} className="w-full" style={{ maxWidth: CARD_MAX }}>
          <Moodscreen
            {...moodscreenProps}
            width={cardWidth}
            /* Held back for the one frame before storage is read, so a
              * returning visitor never sees the default flash past the one
              * they made. */
            style={{
              opacity: storageHydrated ? 1 : 0,
              transitionProperty: "opacity",
              transitionDuration: "var(--dur-enter)",
              transitionTimingFunction: "var(--ease)",
            }}
          />
        </div>

        {/* The two actions. §10 allows one primary per view and Share is it —
          * the screen in miniature, wearing the mood being edited. "Change it"
          * is secondary because it is the way back into work, not the point of
          * opening the app. */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ScreenButton
            mood={moodscreenProps.mood}
            onClick={sharePng}
            loading={isExporting && !shareReady}
          >
            {isExporting && !shareReady ? "Preparing" : "Drop your Moodscreen"}
          </ScreenButton>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
            aria-controls="moodscreen-editor"
          >
            {editing ? "Done" : "Change it"}
          </Button>
        </div>

        {downloadError ? (
          <p className="mt-4 max-w-[40ch] text-center text-13 text-danger" role="alert">
            {downloadError}
          </p>
        ) : null}

        {storageNotice ? (
          <p className="mt-4 max-w-[40ch] text-center text-13 text-muted" role="status">
            {storageNotice}
          </p>
        ) : null}

        {/* Closed by default. Opening it is the second action, not a second
          * page — the Moodscreen stays on screen above, so every change is
          * watched happening to the thing it is a change to. */}
        <div id="moodscreen-editor" hidden={!editing} className="mt-12 w-full max-w-[520px]">
          <StatusForm
            value={formValue}
            onChange={handleFormChange}
            title="Change it"
          />

          {/* §9.3's opt-in lives with the identity rather than with the
            * controls on the Moodscreen — it is a setting about the page, and
            * it renders nothing until a page has been claimed. */}
          <WallOptIn className="mt-8" />
        </div>
      </main>
    </div>
  );
}
