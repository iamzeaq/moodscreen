/**
 * Demo Moodscreens.
 *
 * Used by the pre-redesign landing sections and by /kitchen-sink. An empty
 * wall is worse than no wall, so seeded content earns its place — but this is
 * a short list on purpose. The thirty real ones the wall needs are a separate
 * job, and they come out of the database, not out of here.
 *
 * Every mood appears once, all five free themes are represented, all three
 * surfaces are represented, and the timestamps are spread across the three
 * night bands (§7.4) so the tint is visible in a row of them rather than
 * something you have to wait until 10pm to see.
 *
 * Timestamps are deliberately written without a zone: they parse as local
 * time, so the band a sample lands in is the same on every machine.
 */
export const SAMPLE_MOODSCREENS = [
  {
    mood: "building",
    statement: "Rewriting the export path so the preview and the image can never drift",
    name: "Isaac Twekyard",
    location: "Lagos",
    username: "isaac",
    themeId: "classic",
    surface: "colour",
    at: "2026-09-01T10:20:00",
  },
  {
    mood: "coding",
    statement: "Three hours into a bug that was a missing await",
    name: "Amina Okoro",
    location: "Lagos",
    username: "amina",
    themeId: "terminal",
    surface: "ink",
    at: "2026-09-01T23:41:00",
  },
  {
    mood: "learning",
    statement: "Frank Ocean on repeat, which is its own kind of studying",
    name: "Leo Park",
    location: "Paris",
    username: "leo",
    themeId: "classic",
    surface: "paper",
    at: "2026-09-01T15:05:00",
  },
  {
    mood: "thinking",
    statement: "Deep work. No pings.",
    name: "Sam Okonkwo",
    location: "Remote",
    username: "sam",
    themeId: "nokia",
    surface: "ink",
    at: "2026-09-01T03:14:00",
  },
  {
    mood: "creating",
    statement: "Second draft, and it finally sounds like a person wrote it",
    name: "Sofia Reyes",
    location: "Mexico City",
    username: "sofia",
    themeId: "clean",
    surface: "paper",
    at: "2026-09-01T19:30:00",
  },
  {
    mood: "hiring",
    statement: "Looking for one designer who cares about type",
    name: "Rei Tanaka",
    location: "Tokyo",
    username: "rei",
    themeId: "impact",
    surface: "colour",
    at: "2026-09-01T09:00:00",
  },
  {
    mood: "traveling",
    statement: "Nairobi until Sunday",
    name: "Chidi Nwosu",
    location: "Nairobi",
    username: "chidi",
    themeId: "impact",
    surface: "paper",
    at: "2026-09-01T06:45:00",
  },
  {
    mood: "speaking",
    statement: "On stage at 4pm, talking about the thing I said I'd never build",
    name: "Maya Bergström",
    location: "Berlin",
    username: "maya",
    themeId: "clean",
    surface: "colour",
    at: "2026-09-01T20:10:00",
  },
  {
    mood: "available",
    statement: "Free this week and answering everything",
    name: "Tom Alvarez",
    location: "Lisbon",
    username: "tom",
    themeId: "nokia",
    surface: "colour",
    at: "2026-09-01T12:00:00",
  },
  {
    mood: "offline",
    statement: "Back Monday",
    name: "Nia Hassan",
    location: "Cape Town",
    username: "nia",
    themeId: "terminal",
    surface: "ink",
    at: "2026-09-01T22:55:00",
  },
];

/** Exactly 100 characters — the §7.6 cap, for checking the smallest step. */
export const LONGEST_STATEMENT =
  "Hour four of a refactor that was meant to take twenty minutes and I am still reading my own old code";
