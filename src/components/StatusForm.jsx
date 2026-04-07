import { useEffect, useRef, useState } from "react";
import {
  MOOD_CATEGORY_GROUPS,
  MOOD_ENTRY_MAX_SLOTS,
  normalizeMoodEntries,
} from "../lib/moodCategories.js";
import MoodCategoryPicker from "./MoodCategoryPicker.jsx";
import MoodTextInputWithSuggestions from "./MoodTextInputWithSuggestions.jsx";

function hasSecondSlotContent(entries) {
  if (!Array.isArray(entries) || entries.length < 2) return false;
  const s = entries[1];
  return Boolean(s?.categoryId || (typeof s?.text === "string" && s.text.trim()));
}

/** iOS-style switch — thumb slides with a smooth spring-like curve when toggling. */
function CardDarkModeSwitch({ checked, onChange, labelledBy }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={[
        "ios-card-switch relative h-8 w-[52px] shrink-0 cursor-pointer select-none rounded-full p-[3px] touch-manipulation",
        "transition-[background-color] duration-300 ease-out active:brightness-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8e977d]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-card)]",
        checked
          ? "bg-[#8e977d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]"
          : "bg-[#e2ddd4]",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "pointer-events-none absolute left-[3px] top-1/2 block h-[26px] w-[26px] rounded-full bg-white",
          "shadow-[0_2px_6px_rgba(0,0,0,0.22),0_1px_1px_rgba(0,0,0,0.1)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform",
          checked
            ? "-translate-y-1/2 translate-x-[20px]"
            : "-translate-y-1/2 translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

export default function StatusForm({
  value = {},
  onChange = () => {},
  title = "Inputs",
  className = "",
}) {
  const {
    name = "",
    location = "",
    moodEntries: rawMood = [],
    link = "",
    cardDarkMode = true,
    avatarUrl = null,
  } = value;

  const moodEntries = normalizeMoodEntries(rawMood);
  const [openRow, setOpenRow] = useState(null);
  const [secondRowLeaving, setSecondRowLeaving] = useState(false);
  const removeSecondAnimRef = useRef(false);
  /** Second row is hidden until + is used, unless saved data already has content in row 2 */
  const [secondSlotVisible, setSecondSlotVisible] = useState(() =>
    hasSecondSlotContent(normalizeMoodEntries(rawMood)),
  );

  useEffect(() => {
    if (moodEntries.length < 2) setSecondSlotVisible(false);
  }, [moodEntries.length]);

  useEffect(() => {
    const m = normalizeMoodEntries(value.moodEntries);
    if (m.length >= 2 && hasSecondSlotContent(m)) setSecondSlotVisible(true);
  }, [value.moodEntries]);

  useEffect(() => {
    if (moodEntries.length < 2 && openRow === 1) setOpenRow(null);
    if (!secondSlotVisible && openRow === 1) setOpenRow(null);
  }, [moodEntries.length, openRow, secondSlotVisible]);

  function patchMoodRow(index, patch) {
    const next = normalizeMoodEntries(moodEntries);
    next[index] = { ...next[index], ...patch };
    onChange({ moodEntries: next });
  }

  function addSlot() {
    removeSecondAnimRef.current = false;
    if (moodEntries.length >= MOOD_ENTRY_MAX_SLOTS) {
      if (!secondSlotVisible) setSecondSlotVisible(true);
      return;
    }
    onChange({
      moodEntries: normalizeMoodEntries([
        ...moodEntries,
        { categoryId: "", text: "" },
      ]),
    });
    setSecondSlotVisible(true);
  }

  function beginRemoveSecondSlot() {
    if (moodEntries.length < 2 || secondRowLeaving) return;
    removeSecondAnimRef.current = true;
    setSecondRowLeaving(true);
  }

  function onSecondRowAnimationEnd(e) {
    if (e.target !== e.currentTarget) return;
    const id = e.animationName || "";
    if (!id.includes("mood-slot-leave")) return;
    if (!removeSecondAnimRef.current) return;
    removeSecondAnimRef.current = false;
    const first = moodEntries[0] ?? { categoryId: "", text: "" };
    onChange({ moodEntries: normalizeMoodEntries([first]) });
    setSecondRowLeaving(false);
    setSecondSlotVisible(false);
  }

  const row0 = moodEntries[0] ?? { categoryId: "", text: "" };
  const row1 = moodEntries.length >= 2 ? moodEntries[1] : { categoryId: "", text: "" };
  const showSecondRow = moodEntries.length >= 2 && secondSlotVisible;
  const showPlus =
    !secondRowLeaving && !(moodEntries.length >= MOOD_ENTRY_MAX_SLOTS && secondSlotVisible);

  function onPickAvatar(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (avatarUrl?.startsWith("blob:")) URL.revokeObjectURL(avatarUrl);
    onChange({ avatarUrl: url });
  }

  return (
    <section
      className={["ds-card-static ds-inset-card", className].filter(Boolean).join(" ")}
    >
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5">
        <h2 id="status-form-title" className="ds-title-sm min-w-0 pr-2">
          {title}
        </h2>
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:pl-2">
          <span
            id="status-form-dark-label"
            className="text-[0.8125rem] font-medium leading-none text-secondary"
          >
            Dark preview
          </span>
          <CardDarkModeSwitch
            labelledBy="status-form-dark-label"
            checked={cardDarkMode}
            onChange={(next) => onChange({ cardDarkMode: next })}
          />
        </div>
      </div>

      <div className="ds-stack-block mt-5">
        <label className="ds-stack-inline">
          <span className="ds-label">Name</span>
          <input
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="ds-input h-11"
            placeholder="Your name"
            autoComplete="name"
          />
        </label>

        <label className="ds-stack-inline">
          <span className="ds-label">Location</span>
          <input
            value={location}
            onChange={(e) => onChange({ location: e.target.value })}
            className="ds-input h-11"
            placeholder="City / timezone"
          />
        </label>

        <div className="ds-stack-inline overflow-visible">
          <div className="flex flex-col gap-0.5">
            <span className="ds-label">Status</span>
            <span className="ds-meta">keep it short</span>
          </div>
          <div className="space-y-3 overflow-visible">
            {/* Row 1 — always */}
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start">
              <MoodCategoryPicker
                groups={MOOD_CATEGORY_GROUPS}
                value={row0.categoryId}
                onChange={(id) => patchMoodRow(0, { categoryId: id })}
                isOpen={openRow === 0}
                onOpenChange={(open) => setOpenRow(open ? 0 : null)}
                ariaLabel="Status row 1 category"
              />
              <MoodTextInputWithSuggestions
                categoryId={row0.categoryId}
                value={row0.text}
                onChange={(text) => patchMoodRow(0, { text })}
                className="ds-input h-11 w-full min-w-0 rounded-[18px] border-black/[0.06] transition-[border-color,box-shadow] duration-200 ease-out"
                placeholder="what's on your mind?"
                aria-label="Status row 1 text"
              />
            </div>

            {showPlus ? (
              <div className="flex justify-center pt-0.5">
                <button
                  type="button"
                  onClick={addSlot}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-lg font-light leading-none text-secondary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)] transition-[border-color,background-color,color,transform] duration-200 ease-out hover:border-border-focus hover:bg-card-hover hover:text-primary active:scale-[0.96] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  aria-label="Add another status line"
                >
                  +
                </button>
              </div>
            ) : null}

            {/* Row 2 — only after + (or when saved row 2 has content) */}
            {showSecondRow ? (
              <div
                className={[
                  "relative",
                  secondRowLeaving ? "mood-slot-leave" : "mood-slot-enter",
                ].join(" ")}
                onAnimationEnd={onSecondRowAnimationEnd}
              >
                <button
                  type="button"
                  disabled={secondRowLeaving}
                  onClick={beginRemoveSecondSlot}
                  className="absolute right-0 top-0 z-10 flex h-7 w-7 items-center justify-center rounded-full text-[1.15rem] font-light leading-none text-meta transition-colors hover:bg-black/[0.04] hover:text-primary dark:hover:bg-white/[0.06]"
                  aria-label="Remove second status line"
                >
                  ×
                </button>
                <div className="flex flex-col gap-2 pr-7 sm:flex-row sm:items-start sm:pr-8">
                  <MoodCategoryPicker
                    groups={MOOD_CATEGORY_GROUPS}
                    value={row1.categoryId}
                    onChange={(id) => patchMoodRow(1, { categoryId: id })}
                    isOpen={openRow === 1}
                    onOpenChange={(open) => setOpenRow(open ? 1 : null)}
                    ariaLabel="Status row 2 category"
                  />
                  <MoodTextInputWithSuggestions
                    categoryId={row1.categoryId}
                    value={row1.text}
                    onChange={(text) => patchMoodRow(1, { text })}
                    className="ds-input h-11 w-full min-w-0 rounded-[18px] border-black/[0.06] transition-[border-color,box-shadow] duration-200 ease-out"
                    placeholder="what's on your mind?"
                    aria-label="Status row 2 text"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <label className="ds-stack-inline">
          <span className="ds-label">Link</span>
          <input
            value={link}
            onChange={(e) => onChange({ link: e.target.value })}
            className="ds-input h-11"
            placeholder="https://..."
            inputMode="url"
          />
        </label>

        <div className="ds-stack-inline">
          <div className="flex items-center justify-between gap-3">
            <span className="ds-label">Profile image</span>
            {avatarUrl && (
              <button
                type="button"
                className="ds-meta transition-colors hover:text-primary"
                onClick={() => {
                  if (avatarUrl?.startsWith("blob:")) URL.revokeObjectURL(avatarUrl);
                  onChange({ avatarUrl: null });
                }}
              >
                Clear
              </button>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
            className="ds-input h-11 py-2"
          />

          <p className="ds-meta">
            Optional. A local image preview is used and never uploaded.
          </p>
        </div>
      </div>
    </section>
  );
}
