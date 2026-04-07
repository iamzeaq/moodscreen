import { useEffect, useId, useRef } from "react";
import {
  categorySupportsSuggestions,
  filterMoodSuggestions,
} from "../lib/moodSuggestionLists.js";
import { MOOD_TEXT_MAX } from "../lib/moodscreenValidation.js";

/**
 * Text input with optional inline suggestions (listening / watching / reading).
 * No external APIs; click-outside closes; selecting a row fills the field and blurs.
 */
export default function MoodTextInputWithSuggestions({
  categoryId,
  value,
  onChange,
  className = "",
  placeholder,
  "aria-label": ariaLabel,
}) {
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const listId = useId();

  const enabled = categorySupportsSuggestions(categoryId);
  const suggestions = enabled
    ? filterMoodSuggestions(categoryId, value, 6)
    : [];

  const showPanel =
    enabled &&
    typeof value === "string" &&
    value.trim().length >= 1 &&
    suggestions.length > 0;

  const len = typeof value === "string" ? value.length : 0;
  const countId = `${listId}-count`;

  useEffect(() => {
    if (!enabled) return;
    function onDocPointerDown(e) {
      if (!wrapRef.current?.contains(e.target)) {
        inputRef.current?.blur();
      }
    }
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [enabled]);

  if (!enabled) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <input
          ref={inputRef}
          value={value}
          maxLength={MOOD_TEXT_MAX}
          onChange={(e) => onChange(e.target.value.slice(0, MOOD_TEXT_MAX))}
          className={className}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-describedby={countId}
        />
        <p
          id={countId}
          className="ds-meta shrink-0 text-right tabular-nums leading-snug"
          aria-live="polite"
        >
          {len} / {MOOD_TEXT_MAX}
        </p>
      </div>
    );
  }

  function pick(suggestion) {
    onChange(suggestion.slice(0, MOOD_TEXT_MAX));
    inputRef.current?.blur();
  }

  return (
    <div ref={wrapRef} className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="relative min-w-0 w-full">
        <input
          ref={inputRef}
          value={value}
          maxLength={MOOD_TEXT_MAX}
          onChange={(e) => onChange(e.target.value.slice(0, MOOD_TEXT_MAX))}
          className={className}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-describedby={countId}
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={showPanel ? listId : undefined}
          role="combobox"
        />
      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="mood-suggest-panel absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-[14px] bg-[#f4f4f5] shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] dark:bg-zinc-800/95 dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        >
          <ul className="max-h-[min(14rem,40vh)] overflow-y-auto py-1">
            {suggestions.map((item) => (
              <li key={item} role="presentation">
                <button
                  type="button"
                  role="option"
                  className="flex w-full cursor-pointer select-none items-center px-3.5 py-2.5 text-left text-[0.9375rem] text-primary transition-colors duration-200 ease-out hover:bg-black/[0.06] active:bg-black/[0.08] dark:hover:bg-white/[0.08] dark:active:bg-white/[0.1]"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(item);
                  }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
      <p
        id={countId}
        className="ds-meta shrink-0 text-right tabular-nums leading-snug"
        aria-live="polite"
      >
        {len} / {MOOD_TEXT_MAX}
      </p>
    </div>
  );
}
