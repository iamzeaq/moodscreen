/**
 * The avatar control — a picture, with or without an account.
 *
 * §1 is guest-first: "anyone can make and share a Moodscreen with no account".
 * That has to include the face on it, so this writes a data URL into the same
 * form object as the statement and the mood, and it lands in guest
 * localStorage with everything else. No upload, no server, no sign-in.
 *
 * §7.5 keeps the avatar at 30px on the card — "a signature, not a header" —
 * so the control is deliberately small too. A big drop zone here would
 * advertise the avatar as the important choice, and it is the least important
 * of the four.
 */
import { useCallback, useId, useRef, useState } from "react";
import { fileToAvatarDataUrl } from "../../lib/avatarImage.js";

const SIZE = 44;

export default function AvatarField({
  value = "",
  name = "",
  onChange = () => {},
  className = "",
  label = "Photo",
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
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-busy={busy || undefined}
          aria-label={value ? "Change your photo" : "Add a photo"}
          title={value ? "Change your photo" : "Add a photo"}
          className={[
            "relative grid shrink-0 place-items-center overflow-hidden rounded-full",
            "cursor-pointer touch-manipulation border border-line bg-panel",
            "hover:border-line-strong",
            "outline-none focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2",
            "disabled:cursor-progress",
          ].join(" ")}
          style={{
            width: SIZE,
            height: SIZE,
            transitionProperty: "border-color, background-color",
            transitionDuration: "var(--dur-hover)",
            transitionTimingFunction: "var(--ease)",
          }}
          disabled={busy}
        >
          {value ? (
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              style={{ opacity: busy ? 0.5 : 1 }}
            />
          ) : initial ? (
            <span className="font-ui text-15 font-semibold text-muted">{initial}</span>
          ) : (
            /* A plus, not a camera. The camera glyph is the most worn icon in
             * this position and it promises a capture flow this does not have. */
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 3.5v9M3.5 8h9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                className="text-muted"
              />
            </svg>
          )}
        </button>

        <label htmlFor={id} className="sr-only">
          {label}
        </label>

        {value ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange(null);
            }}
            className="rounded-sm px-1 text-12 text-faint outline-none hover:text-muted focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2"
          >
            Remove
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="max-w-[28ch] text-11 text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
