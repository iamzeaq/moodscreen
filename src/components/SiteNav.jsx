/**
 * The nav — a lockup and an account menu, and nothing else.
 *
 * §1 says the site exists to make the image and to catch people who tap
 * through from it, and §7.10 says the app opens onto a single object. Neither
 * leaves anything for a nav to link to, so this is a mark and a way back to it.
 *
 * The mark takes the mood currently being edited, and `--accent` follows the
 * same value from MoodscreenContext, so scrubbing the strip in the hero
 * repaints the logo without this component knowing the strip exists. That is
 * §3's dynamic accent: there is no fixed brand colour, only the mood in focus.
 *
 * Absolute, not fixed. A nav that follows the scroll needs a ground to sit on,
 * and every ground available is either §12's glassmorphism or a band of chrome
 * laid across the wall of Moodscreens the page is mostly made of. There is
 * nothing here worth pinning: one mark and one menu, both a scroll away.
 */
import { Link } from "react-router-dom";
import AuthBar from "./AuthBar.jsx";
import Wordmark from "./brand/Wordmark.jsx";
import { useMoodscreen } from "../context/MoodscreenContext.jsx";

export default function SiteNav() {
  const { moodscreenProps } = useMoodscreen();

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 px-4 pt-[calc(0.65rem+env(safe-area-inset-top))] sm:px-6 sm:pt-[calc(0.85rem+env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4">
        <Link
          to="/"
          className="pointer-events-auto rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-4"
          aria-label="moodscreen — home"
        >
          <Wordmark mood={moodscreenProps.mood} size={20} />
        </Link>

        <div className="pointer-events-auto">
          <AuthBar />
        </div>
      </div>
    </header>
  );
}
