/**
 * The statement field — the one thing the visitor types.
 *
 * §2 fixes the ask: "Say what you're on", never "Enter your status". §7.6
 * fixes the length at 100 characters, which is five lines at the smallest step
 * and the point past which the type drops below what survives WhatsApp's
 * compression.
 *
 * The cap is enforced here rather than announced. There is no "0/100" until
 * you are near it, because a counter sitting under an empty field is a rule
 * being read out before anyone has broken it — and the whole ladder in §7.6 is
 * built to reward short statements without ever telling anyone to be short.
 *
 * A textarea, not an input: a hundred characters wraps, and a single line that
 * scrolls sideways hides what you already wrote.
 */
import { useId } from "react";
import { STATEMENT_MAX_CHARS } from "../../lib/statementFit.js";

/** Show the count only once it is information — the last quarter of the room. */
const COUNTER_FROM = Math.round(STATEMENT_MAX_CHARS * 0.75);

export default function StatementField({
  value = "",
  onChange = () => {},
  placeholder = "shipping the thing I promised",
  label = "Say what you're on",
  id,
  className = "",
  ...rest
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const left = STATEMENT_MAX_CHARS - value.length;
  const showCount = value.length >= COUNTER_FROM;

  return (
    <div className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>

      <div
        className={[
          "relative flex rounded-sm border bg-panel border-line",
          "hover:border-line-strong",
          "has-[textarea:focus]:border-accent has-[textarea:focus]:bg-[var(--accent-tint)]",
        ].join(" ")}
        style={{
          transitionProperty: "background-color, border-color",
          transitionDuration: "var(--dur-hover)",
          transitionTimingFunction: "var(--ease)",
        }}
      >
        <textarea
          id={fieldId}
          rows={2}
          value={value}
          maxLength={STATEMENT_MAX_CHARS}
          onChange={(e) => onChange(e.target.value.slice(0, STATEMENT_MAX_CHARS))}
          placeholder={placeholder}
          aria-label={label}
          className={[
            "min-w-0 flex-1 resize-none bg-transparent px-4 py-3",
            "font-ui text-18 text-fg placeholder:text-faint",
            "border-0 outline-none",
          ].join(" ")}
          style={{ lineHeight: "var(--lh-statement)" }}
          {...rest}
        />

        {showCount ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 right-3 text-11 text-faint tabular-nums"
          >
            {left}
          </span>
        ) : null}
      </div>
    </div>
  );
}
