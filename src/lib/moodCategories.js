/**
 * Static category list for moodscreen status rows — grouped for <select> optgroups.
 * Each line on the card: emoji + lowercase label + ": " + value
 */

export const MOOD_CATEGORY_GROUPS = [
  {
    id: "work",
    label: "Work / Output",
    categories: [
      { id: "building", emoji: "🚀", label: "Building" },
      { id: "coding", emoji: "💻", label: "Coding" },
      { id: "working-on", emoji: "📊", label: "Working on" },
      { id: "fixing", emoji: "🛠", label: "Fixing" },
      { id: "shipping", emoji: "📦", label: "Shipping" },
    ],
  },
  {
    id: "mind",
    label: "Mind / Internal",
    categories: [
      { id: "thinking", emoji: "🧠", label: "Thinking" },
      { id: "in-mind", emoji: "💭", label: "In my mind" },
      { id: "speaking", emoji: "🗣", label: "Speaking" },
      { id: "reflecting", emoji: "💡", label: "Reflecting" },
      { id: "processing", emoji: "🔍", label: "Processing" },
    ],
  },
  {
    id: "place",
    label: "Location",
    categories: [
      { id: "status-location", emoji: "📍", label: "Location" },
      { id: "currently-in", emoji: "🌍", label: "Currently in" },
      { id: "at", emoji: "🏠", label: "At" },
      { id: "traveling", emoji: "✈️", label: "Traveling" },
    ],
  },
  {
    id: "media",
    label: "Media",
    categories: [
      { id: "listening", emoji: "🎧", label: "Listening" },
      { id: "watching", emoji: "📺", label: "Watching" },
      { id: "reading", emoji: "📖", label: "Reading" },
      { id: "playing", emoji: "🎮", label: "Playing" },
      { id: "recording", emoji: "🎙", label: "Recording" },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    categories: [
      { id: "drinking", emoji: "☕", label: "Drinking" },
      { id: "eating", emoji: "🍜", label: "Eating" },
      { id: "sleeping", emoji: "💤", label: "Sleeping" },
      { id: "resting", emoji: "😴", label: "Resting" },
      { id: "training", emoji: "🏃", label: "Training" },
      { id: "relaxing", emoji: "🧘", label: "Relaxing" },
    ],
  },
  {
    id: "creativity",
    label: "Creativity",
    categories: [
      { id: "writing", emoji: "📝", label: "Writing" },
      { id: "designing", emoji: "🎨", label: "Designing" },
      { id: "shooting", emoji: "📷", label: "Shooting" },
      { id: "producing", emoji: "🎵", label: "Producing" },
      { id: "editing", emoji: "🎬", label: "Editing" },
    ],
  },
  {
    id: "social",
    label: "Social",
    categories: [
      { id: "talking-about", emoji: "💬", label: "Talking about" },
      { id: "obsessed-with", emoji: "🔥", label: "Obsessed with" },
      { id: "looking-at", emoji: "👀", label: "Looking at" },
      { id: "following", emoji: "📡", label: "Following" },
    ],
  },
];

const BY_ID = new Map();
for (const g of MOOD_CATEGORY_GROUPS) {
  for (const c of g.categories) {
    BY_ID.set(c.id, c);
  }
}

export function getCategoryById(id) {
  if (!id || typeof id !== "string") return null;
  return BY_ID.get(id) ?? null;
}

/** One card line: "🧠 in my mind: value" */
export function formatMoodLine(categoryId, text) {
  const cat = getCategoryById(categoryId);
  const v = (text || "").trim();
  if (!cat || !v) return "";
  return `${cat.emoji} ${cat.label.toLowerCase()}: ${v}`;
}

/** Build display lines for the card from saved rows */
export function moodLinesFromEntries(entries) {
  if (!Array.isArray(entries)) return [];
  const out = [];
  for (const e of entries) {
    const id = typeof e?.categoryId === "string" ? e.categoryId : "";
    const t = typeof e?.text === "string" ? e.text : "";
    const line = formatMoodLine(id, t);
    if (line) out.push(line);
  }
  return out;
}

/** Card layout: category (metadata) + quote (main) — two-part typography */
export function moodRowsFromEntries(entries) {
  if (!Array.isArray(entries)) return [];
  const out = [];
  for (const e of entries) {
    const id = typeof e?.categoryId === "string" ? e.categoryId : "";
    const t = typeof e?.text === "string" ? e.text : "";
    const cat = getCategoryById(id);
    const v = t.trim();
    if (!cat || !v) continue;
    out.push({
      category: `${cat.emoji} ${cat.label.toLowerCase()}`,
      quote: v,
    });
  }
  return out;
}

/** Max status rows in the editor (WhatsApp poll–style: 1 default, up to 2) */
export const MOOD_ENTRY_MAX_SLOTS = 2;

/** @deprecated use MOOD_ENTRY_MAX_SLOTS */
export const MOOD_ENTRY_ROW_COUNT = MOOD_ENTRY_MAX_SLOTS;

export function normalizeMoodEntries(raw) {
  const base = Array.isArray(raw) ? raw : [];
  const mapped = base.map((r) => ({
    categoryId: typeof r?.categoryId === "string" ? r.categoryId : "",
    text: typeof r?.text === "string" ? r.text : "",
  }));
  const capped = mapped.slice(0, MOOD_ENTRY_MAX_SLOTS);
  if (capped.length === 0) {
    return [{ categoryId: "", text: "" }];
  }
  return capped;
}

export const DEFAULT_MOOD_ENTRIES = normalizeMoodEntries([
  { categoryId: "building", text: "Zipload" },
]);

/** Migrate legacy persisted form (building, listening, reading, moodCategory) */
export function legacyToMoodEntries(obj) {
  if (!obj || typeof obj !== "object") return DEFAULT_MOOD_ENTRIES;

  const rows = [];
  const mc = typeof obj.moodCategory === "string" ? obj.moodCategory : "";
  const b = (obj.building || "").trim();
  const l = (obj.listening || "").trim();
  const r = (obj.reading || "").trim();

  if (mc && getCategoryById(mc) && b) {
    rows.push({ categoryId: mc, text: b });
  } else if (b) {
    rows.push({ categoryId: "building", text: b });
  }
  if (l) rows.push({ categoryId: "listening", text: l });
  if (r) rows.push({ categoryId: "reading", text: r });

  if (rows.length === 0) return DEFAULT_MOOD_ENTRIES;
  return normalizeMoodEntries(rows);
}

/** @deprecated kept for any external imports */
export function moodCategoryToLabel(slug) {
  const c = getCategoryById(slug);
  return c ? c.label : "";
}
