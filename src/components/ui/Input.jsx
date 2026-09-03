/**
 * Input — CLAUDE.md §10.
 *
 *   44px, --panel background, --line border, --line-strong on hover, accent
 *   border plus tint on focus.
 *
 *   The username field shows `moodscreen.live/` as a fixed prefix inside the
 *   field, not as a label above it.
 *
 * The visual field is the wrapper, not the <input>. That is what lets the
 * prefix sit inside the border and share the focus state; the input itself is
 * transparent and chromeless.
 *
 * Radius is --r-sm (6px) per §5 — inputs and pills, not the 10px of buttons.
 */
import { forwardRef, useId } from "react";

const FIELD = [
  "flex h-11 w-full items-center gap-0 overflow-hidden",
  "rounded-sm border",
  "bg-panel border-line",
  "hover:border-line-strong",
  "has-[input:focus]:border-accent has-[input:focus]:bg-[var(--accent-tint)]",
  "has-[input:disabled]:opacity-40 has-[input:disabled]:hover:border-line",
].join(" ");

const FIELD_INVALID = "border-danger hover:border-danger";

const CONTROL = [
  "min-w-0 flex-1 bg-transparent",
  "font-ui text-15 text-fg placeholder:text-faint",
  "border-0 outline-none",
  "disabled:cursor-not-allowed",
].join(" ");

const TRANSITION = {
  transitionProperty: "background-color, border-color, opacity",
  transitionDuration: "var(--dur-hover)",
  transitionTimingFunction: "var(--ease)",
};

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    prefix,
    suffix,
    id,
    className = "",
    fieldClassName = "",
    disabled = false,
    style,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  const invalid = Boolean(error);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="text-13 font-medium text-muted">
          {label}
        </label>
      ) : null}

      <div
        className={[FIELD, invalid ? FIELD_INVALID : "", fieldClassName].filter(Boolean).join(" ")}
        style={{ ...TRANSITION, ...style }}
      >
        {prefix ? (
          <span className="pl-3 font-ui text-15 text-faint select-none" aria-hidden="true">
            {prefix}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={error || hint ? noteId : undefined}
          /* No left padding behind a prefix: `moodscreen.live/` and the name
           * the visitor types are one URL, and a gap in the middle of it makes
           * the domain read as a label sitting inside the field. */
          className={`${CONTROL} ${prefix ? "pl-0" : "pl-3"} ${suffix ? "pr-0.5" : "pr-3"}`}
          {...rest}
        />

        {suffix ? (
          <span className="pr-3 font-ui text-13 text-faint select-none">{suffix}</span>
        ) : null}
      </div>

      {error || hint ? (
        <p
          id={noteId}
          className={`text-12 ${error ? "text-danger" : "text-faint"}`}
          role={error ? "alert" : undefined}
        >
          {error || hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;

/**
 * The claim field. `moodscreen.live/` lives inside the border because the
 * thing being claimed is the whole URL — putting the domain in a label above
 * turns the ask into "pick a username", which converts worse.
 */
export const UsernameInput = forwardRef(function UsernameInput(
  { prefix = "moodscreen.live/", placeholder = "yourname", ...rest },
  ref,
) {
  return (
    <Input
      ref={ref}
      prefix={prefix}
      placeholder={placeholder}
      autoComplete="off"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      inputMode="text"
      {...rest}
    />
  );
});
