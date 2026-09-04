/**
 * The avatar control — a picture, with or without an account.
 *
 * §1 is guest-first: "anyone can make and share a Moodscreen with no account".
 * That has to include the face on it, so this writes a data URL into the same
 * form object as the statement and the mood, and it lands in guest
 * localStorage with everything else. No upload, no server, no sign-in.
 *
 * It is a **labelled button**, and the first version's failure is the reason.
 * That one was a bare 44px circle carrying only a `+`: `--panel` on `--canvas`
 * is a 3% step, the border is 6% white, and the result was a control nobody
 * could find. Worse, sitting beside the three surface squares it read as a
 * fourth swatch rather than as an action.
 *
 * So it uses `<Button variant="secondary">` — the §10 component, with the
 * hover, active, focus-visible and disabled states already specified — and it
 * says what it does in words. §7.5's "the avatar is a signature, not a header"
 * governs the 30px disc *on the card*; it says nothing about the size of the
 * control that sets it, and an invisible control is not restraint.
 */
import { useCallback, useId, useRef, useState } from "react";
import Button from "../ui/Button.jsx";
import { fileToAvatarDataUrl } from "../../lib/avatarImage.js";

/** The preview inside the button. Small: the label is doing the work. */
const PREVIEW = 20;

export default function AvatarField({
  value = "",
  name = "",
  onChange = () => {},
  className = "",
}) {
  const inputRef = useRef(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const initial = String(name || "").trim().charAt(0).toUpperCase();

  const pick = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      /* Cleared straight away so choosing the same file twice still fires. */
      e.target.value = "";
      if (!file) return;

      setError(null);
      setBusy(true);
      try {
        onChange(await fileToAvatarDataUrl(file));
      } catch (err) {
        setError(err?.message || "That image could not be used.");
      } finally {
        setBusy(false);
      }
    },
    [onChange],
  );

  return (
    <div className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*"
          onChange={pick}
          className="sr-only"
          aria-label={value ? "Change your photo" : "Add a photo"}
        />

        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          loading={busy}
        >
          <span
            aria-hidden="true"
            className="grid shrink-0 place-items-center overflow-hidden rounded-full border border-line-strong"
            style={{ width: PREVIEW, height: PREVIEW }}
          >
            {value ? (
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : initial ? (
              <span className="text-11 font-semibold text-muted">{initial}</span>
            ) : (
              /* A plus, not a camera. The camera glyph is the most worn icon
               * in this position and it promises a capture flow this does not
               * have. */
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 2v8M2 6h8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </span>
          {value ? "Change photo" : "Add photo"}
        </Button>

        {value ? (
          <Button
            variant="ghost"
            onClick={() => {
              setError(null);
              onChange(null);
            }}
          >
            Remove
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="max-w-[32ch] text-11 text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
