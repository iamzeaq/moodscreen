/**
 * Share — the app's primary action and the public page's only one.
 *
 * Still §10's screen, but the paper plane is the whole button: no visible
 * label, `aria-label="Share"` for anything that reads it. A small screen, sized
 * to hold the plane with air round it, and well clear of the 44px tap target.
 *
 * `done` swaps the plane for a tick for a moment after a link is copied, which
 * is the only feedback a desktop click gets when there is no share sheet to
 * open. The swap is announced through a polite live region, since the button's
 * own name does not change.
 */
import ScreenButton from "./ScreenButton.jsx";
import { SendIcon } from "../icons/SendIcon.jsx";

const SIZE = { width: 72, height: 60 };

function CheckIcon({ size }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21 L17 29 L31 12" />
    </svg>
  );
}

export default function ShareButton({ mood, done = false, doneMessage = "Link copied", ...rest }) {
  return (
    <>
      <ScreenButton
        mood={mood}
        width={SIZE.width}
        height={SIZE.height}
        icon={done ? <CheckIcon size={30} /> : <SendIcon size={30} />}
        aria-label="Share"
        {...rest}
      />
      <span className="sr-only" aria-live="polite">
        {done ? doneMessage : ""}
      </span>
    </>
  );
}
