/**
 * The studio's editor — the same three controls as the hero, plus the fields
 * the hero deliberately leaves out.
 *
 * The mood category picker and the suggestion list are gone. Categories were a
 * second vocabulary running alongside §3's ten moods, which meant a Moodscreen
 * had two ideas about what it was; a suggestion list wrote the statement for
 * whoever opened it. Both were pre-redesign scaffolding and neither survives
 * the two-choice model in §7.2.
 *
 * What is here beyond mood, statement and surface is what a Moodscreen carries
 * but does not ask about on the way in: your name, the theme, the one optional
 * link, and the location the public page shows. §1 is emphatic about the link
 * being one, maximum — resist every request for a second field.
 */
import { useCallback } from "react";
import AvatarField from "./editor/AvatarField.jsx";
import MoodStrip from "./editor/MoodStrip.jsx";
import StatementField from "./editor/StatementField.jsx";
import SurfaceControl from "./editor/SurfaceControl.jsx";
import Input from "./ui/Input.jsx";
import { DEFAULT_THEME_ID, FREE_THEMES } from "../themes/index.js";
import { DEFAULT_SURFACE } from "../themes/surface.js";

/**
 * Theme picker. A theme owns type and nothing else (§7.7), so this chooses a
 * typeface and never a colour. The surface — the user's other choice — has its
 * own control; the two are deliberately not merged.
 */
function ThemePicker({ value, onChange, labelledBy }) {
  return (
    <div className="flex flex-wrap gap-1" role="radiogroup" aria-labelledby={labelledBy}>
      {FREE_THEMES.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(t.id)}
            className={[
              "h-9 rounded-md px-3 text-13 font-semibold touch-manipulation",
              "outline-none focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2",
              active
                ? "bg-accent text-[var(--accent-ink)]"
                : "bg-panel text-muted hover:bg-overlay hover:text-fg",
            ].join(" ")}
            style={{
              transitionProperty: "background-color, color",
              transitionDuration: "var(--dur-hover)",
              transitionTimingFunction: "var(--ease)",
            }}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children, id }) {
  return (
    <div className="flex flex-col gap-2">
      <span id={id} className="text-13 font-medium text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function StatusForm({
  value = {},
  onChange = () => {},
  title = "Your Moodscreen",
  className = "",
}) {
  const {
    name = "",
    location = "",
    link = "",
    mood = "thinking",
    statement = "",
    surface = DEFAULT_SURFACE,
    themeId = DEFAULT_THEME_ID,
    avatarUrl = "",
    updated_at: at,
  } = value;

  /**
   * One stable handler per field, rather than a fresh arrow in the JSX.
   *
   * The statement is the only control here that changes as you type, and it was
   * dragging the other eight through a full reconcile on every character —
   * including the mood strip, which is ten clipped stops and two SVG marks and
   * has nothing whatever to do with what the statement says. An inline arrow is
   * a new function identity every render, so no amount of memoising downstream
   * could have stopped it; this is what lets the strip skip the render.
   */
  const setStatement = useCallback((next) => onChange({ statement: next }), [onChange]);
  const setMood = useCallback((next) => onChange({ mood: next }), [onChange]);
  const setSurface = useCallback((next) => onChange({ surface: next }), [onChange]);
  const setThemeId = useCallback((next) => onChange({ themeId: next }), [onChange]);
  const setAvatarUrl = useCallback((next) => onChange({ avatarUrl: next }), [onChange]);
  const setName = useCallback((e) => onChange({ name: e.target.value }), [onChange]);
  const setLocation = useCallback((e) => onChange({ location: e.target.value }), [onChange]);
  const setLink = useCallback((e) => onChange({ link: e.target.value }), [onChange]);

  return (
    <section
      className={["flex flex-col gap-8 rounded-lg border border-line bg-raised p-6", className]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 id="status-form-title" className="text-18 font-semibold text-fg">
        {title}
      </h2>

      {/* §7.2's two choices and the thing they are choices about, in the order
        * the hero puts them: what you are on, then how it looks. */}
      <Field label="Say what you're on" id="status-form-statement-label">
        <StatementField
          value={statement}
          onChange={setStatement}
        />
      </Field>

      <Field label="Mood" id="status-form-mood-label">
        <MoodStrip
          label="Mood"
          value={mood}
          onChange={setMood}
        />
      </Field>

      <Field label="Surface" id="status-form-surface-label">
        <SurfaceControl
          value={surface}
          mood={mood}
          at={at}
          onChange={setSurface}
        />
      </Field>

      <Field label="Theme" id="status-form-theme-label">
        <ThemePicker
          labelledBy="status-form-theme-label"
          value={themeId}
          onChange={setThemeId}
        />
      </Field>

      <Field label="Photo" id="status-form-avatar-label">
        <AvatarField
          value={avatarUrl || ""}
          name={name}
          onChange={setAvatarUrl}
        />
      </Field>

      <Input
        label="Name"
        value={name}
        onChange={setName}
        placeholder="Your name"
        autoComplete="name"
      />

      <Input
        label="Location"
        value={location}
        onChange={setLocation}
        placeholder="City or region"
        hint="Shown on your public page, never on the Moodscreen."
      />

      {/* One link. §1: resist every request that adds a second link field. */}
      <Input
        label="Link"
        value={link}
        onChange={setLink}
        placeholder="https://"
        inputMode="url"
      />
    </section>
  );
}
