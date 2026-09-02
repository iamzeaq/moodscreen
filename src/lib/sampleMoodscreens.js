/**
 * Demo Moodscreens.
 *
 * Used by the pre-redesign landing sections and by /kitchen-sink. An empty
 * wall is worse than no wall, so seeded content earns its place — but this is
 * a short list on purpose. The thirty real ones the wall needs are a separate
 * job, and they come out of the database, not out of here.
 *
 * Every mood appears at least once, and both free themes are represented.
 */
export const SAMPLE_MOODSCREENS = [
  {
    mood: "building",
    statement: "Rewriting the export path so the preview and the image can never drift",
    name: "Isaac Twekyard",
    location: "Lagos",
    username: "isaac",
    themeId: "classic",
  },
  {
    mood: "coding",
    statement: "Three hours into a bug that was a missing await",
    name: "Amina Okoro",
    location: "Lagos",
    username: "amina",
    themeId: "sharp",
  },
  {
    mood: "learning",
    statement: "Frank Ocean on repeat, which is its own kind of studying",
    name: "Leo Park",
    location: "Paris",
    username: "leo",
    themeId: "classic",
  },
  {
    mood: "thinking",
    statement: "Deep work. No pings.",
    name: "Sam Okonkwo",
    location: "Remote",
    username: "sam",
    themeId: "sharp",
  },
  {
    mood: "creating",
    statement: "Second draft, and it finally sounds like a person wrote it",
    name: "Sofia Reyes",
    location: "Mexico City",
    username: "sofia",
    themeId: "classic",
  },
  {
    mood: "hiring",
    statement: "Looking for one designer who cares about type",
    name: "Rei Tanaka",
    location: "Tokyo",
    username: "rei",
    themeId: "sharp",
  },
  {
    mood: "traveling",
    statement: "Nairobi until Sunday",
    name: "Chidi Nwosu",
    location: "Nairobi",
    username: "chidi",
    themeId: "classic",
  },
  {
    mood: "speaking",
    statement: "On stage at 4pm, talking about the thing I said I would never build",
    name: "Maya Bergström",
    location: "Berlin",
    username: "maya",
    themeId: "sharp",
  },
  {
    mood: "available",
    statement: "Free this week and answering everything",
    name: "Tom Alvarez",
    location: "Lisbon",
    username: "tom",
    themeId: "classic",
  },
  {
    mood: "offline",
    statement: "Back Monday",
    name: "Nia Hassan",
    location: "Cape Town",
    username: "nia",
    themeId: "sharp",
  },
];

/** A 180-character statement — the hard cap, for checking the smallest step. */
export const LONGEST_STATEMENT =
  "Somewhere in the fourth hour of a refactor that was supposed to take twenty minutes, " +
  "reading my own code from last spring and wondering who hurt that person so badly that " +
  "they wrote this.";
