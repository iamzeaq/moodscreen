import { useEffect, useId, useRef } from "react";
import { getCategoryById } from "../lib/moodCategories.js";

function Chevron({ open }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className={[
        "shrink-0 text-current opacity-45 transition-transform duration-200 ease-out",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
    >
      <path
        d="M2.5 4.25L6 7.75L9.5 4.25"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * iOS-like category control — pill trigger + floating grouped panel.
 */
export default function MoodCategoryPicker({
  groups,
  value = "",
  onChange,
  placeholder = "Category…",
  isOpen,
  onOpenChange,
  ariaLabel = "Category",
}) {
  const rootRef = useRef(null);
  const listId = useId();

  const selected = getCategoryById(value);
  const closedLabel = selected
    ? `${selected.emoji} ${selected.label}`
    : placeholder;

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) onOpenChange(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div ref={rootRef} className="relative min-w-0 shrink-0 sm:max-w-[14rem] sm:basis-[42%]">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listId : undefined}
        onClick={() => onOpenChange(!isOpen)}
        className={[
          "mood-picker-trigger flex w-full min-w-0 items-center justify-between gap-2 rounded-[18px] border border-black/[0.06] bg-black/[0.035] px-3.5 py-2.5 text-left text-[0.8125rem] font-medium tracking-[-0.01em] text-primary shadow-none transition-[background-color,box-shadow] duration-200 ease-out",
          "hover:bg-black/[0.045] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/[0.12] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-card)]",
          "[data-theme=dark]:border-white/[0.08] [data-theme=dark]:bg-white/[0.06] [data-theme=dark]:hover:bg-white/[0.09] [data-theme=dark]:focus-visible:ring-white/25 [data-theme=dark]:focus-visible:ring-offset-[#18181b]",
        ].join(" ")}
      >
        <span
          className={[
            "min-w-0 flex-1 truncate",
            selected ? "" : "text-meta",
          ].join(" ")}
        >
          {closedLabel}
        </span>
        <Chevron open={isOpen} />
      </button>

      {isOpen ? (
        <div
          id={listId}
          role="listbox"
          className="mood-picker-panel absolute left-0 right-0 top-[calc(100%+6px)] z-[80] max-h-[min(320px,calc(100dvh-120px))] overflow-y-auto overflow-x-hidden rounded-[1.15rem] border border-black/[0.07] bg-[color-mix(in_srgb,var(--app-card)_92%,transparent)] py-2 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)_inset] backdrop-blur-md [data-theme=dark]:border-white/[0.09] [data-theme=dark]:bg-[color-mix(in_srgb,#18181b_94%,transparent)] [data-theme=dark]:shadow-[0_16px_48px_-10px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.05)_inset]"
        >
          {groups.map((g, gi) => (
            <div
              key={g.id}
              className={[
                "px-2",
                gi > 0 ? "mt-2 border-t border-border/80 pt-2" : "",
              ].join(" ")}
            >
              <div className="px-2.5 pb-1.5 pt-0.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-meta opacity-70">
                {g.label}
              </div>
              <div className="space-y-0.5">
                {g.categories.map((c) => {
                  const active = c.id === value;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(c.id);
                        onOpenChange(false);
                      }}
                      className={[
                        "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[0.8125rem] font-medium tracking-[-0.01em] text-primary transition-[transform,background-color] duration-200 ease-out",
                        "hover:bg-black/[0.045] hover:scale-[1.01] active:scale-[0.995]",
                        "[data-theme=dark]:hover:bg-white/[0.07]",
                        active ? "bg-black/[0.06] [data-theme=dark]:bg-white/[0.1]" : "",
                      ].join(" ")}
                    >
                      <span className="shrink-0" aria-hidden>
                        {c.emoji}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
