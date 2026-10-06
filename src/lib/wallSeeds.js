/**
 * The thirty seeded Moodscreens the wall opens with — CLAUDE.md §9.3.
 *
 * "Needs seeded content at launch; an empty wall is worse than no wall."
 *
 * This file is the single authored source. `supabase/seed-wall.sql` is
 * generated from it by `scripts/generate-wall-seed.mjs`, so the database copy
 * is derived rather than a second list to keep in step — and the wall still
 * draws when Supabase is not configured at all, which is most of local
 * development and every guest-first path in §1.
 *
 * **The order is part of the data, not a filing convenience.** The wall takes
 * this list as it stands, so a list grouped by surface — ten colour, then ten
 * ink, then ten paper — puts a solid band of one surface in each row and shows
 * two of the three. Grouped by mood it would band the colours instead. So the
 * two cycles are run against each other: mood advances every step and wraps
 * every ten, surface advances every step and wraps every three. Ten and three
 * share no factor, so thirty steps produce all thirty pairs exactly once and
 * any six consecutive tiles carry all three surfaces and six different moods.
 *
 * Theme runs on a third cycle, five long, shifted by one at each pass through
 * the moods — otherwise five would divide ten evenly and a mood would wear the
 * same typeface all three times it appeared. As it is, each mood gets three
 * different faces and no two neighbours share one.
 *
 * The rest of the spread is deliberate too:
 *
 *   - statement lengths cover all four steps of the §7.6 ladder, so the wall
 *     shows that short statements get bigger type rather than hiding it;
 *   - timestamps are spread across §7.4's three bands, so the night tint is
 *     visible in a row of them instead of being something you wait until 10pm
 *     to see.
 *
 * Timestamps are written without a zone on purpose: they parse as local time,
 * so a seed lands in the same band on every machine.
 *
 * These are examples, and they read as ordinary Moodscreens because that is
 * what the wall is for. They are not claims about real people — the names are
 * invented, and each one's page is served from this list (see
 * PublicProfilePage) so nothing on the wall links into a dead end.
 *
 * **The three `link` values are deliberately unresolvable.** §1 allows one
 * optional link per Moodscreen and three seeds carry one, so the public page's
 * link actually draws somewhere rather than being a code path nobody has seen.
 * They sit on the `.example` TLD, which RFC 2606 reserves and nobody can
 * register — a plausible-looking real domain on an invented person is an
 * endorsement that person cannot give, and it would point traffic at whoever
 * happens to own it. The cost is that clicking one fails, which is the right
 * trade for a fixture and the wrong one for launch: give them real URLs or take
 * them off before these seeds meet an audience.
 */
export const WALL_SEEDS = [
  {
    mood: "building",
    surface: "colour",
    themeId: "nokia",
    statement: "Shipping the thing I promised",
    name: "Amara Diallo",
    username: "amara",
    location: "Dakar",
    at: "2026-09-01T09:40:00",
  },
  {
    mood: "creating",
    surface: "ink",
    themeId: "terminal",
    statement: "Cutting the record down to nine tracks",
    name: "Luca Moretti",
    username: "luca",
    location: "Milan",
    at: "2026-09-01T21:05:00",
  },
  {
    mood: "coding",
    surface: "paper",
    themeId: "impact",
    statement: "Deleted four hundred lines and it does more",
    name: "Oskar Nowak",
    username: "oskar",
    location: "Warsaw",
    at: "2026-09-01T13:10:00",
  },
  {
    mood: "hiring",
    surface: "colour",
    themeId: "classic",
    statement: "Looking for one designer who cares about type",
    name: "Rei Tanaka",
    username: "rei",
    location: "Tokyo",
    at: "2026-09-01T09:00:00",
    link: "https://tanaka.example/hiring",
  },
  {
    mood: "thinking",
    surface: "ink",
    themeId: "clean",
    statement: "Wondering whether the hard part is the code or the wanting",
    name: "Elif Demir",
    username: "elif",
    location: "Istanbul",
    at: "2026-09-02T01:50:00",
  },
  {
    mood: "available",
    surface: "paper",
    themeId: "nokia",
    statement: "Coffee with anyone building something strange",
    name: "Ruben Silva",
    username: "ruben",
    location: "Porto",
    at: "2026-09-01T17:20:00",
  },
  {
    mood: "speaking",
    surface: "colour",
    themeId: "terminal",
    statement: "On stage at four, talking about the thing I said I would never build",
    name: "Maya Bergstrom",
    username: "maya",
    location: "Berlin",
    at: "2026-09-01T20:10:00",
    link: "https://bergstrom.example/talks",
  },
  {
    mood: "learning",
    surface: "ink",
    themeId: "impact",
    statement: "Teaching myself to read music at thirty four",
    name: "Jonas Weber",
    username: "jonas",
    location: "Vienna",
    at: "2026-09-01T22:10:00",
  },
  {
    mood: "traveling",
    surface: "paper",
    themeId: "classic",
    statement: "Three airports and one very good sandwich",
    name: "Tara Singh",
    username: "tara",
    location: "Delhi",
    at: "2026-09-02T05:55:00",
  },
  {
    mood: "offline",
    surface: "colour",
    themeId: "clean",
    statement: "Back Monday",
    name: "Nia Hassan",
    username: "nia",
    location: "Cape Town",
    at: "2026-09-01T22:55:00",
  },
  {
    mood: "building",
    surface: "ink",
    themeId: "terminal",
    statement: "Rewriting the export path so the preview and the image can never drift",
    name: "Isaac Twekyard",
    username: "isaac",
    location: "Lagos",
    at: "2026-09-01T10:20:00",
    link: "https://twekyard.example",
  },
  {
    mood: "creating",
    surface: "paper",
    themeId: "impact",
    statement: "Painting badly on purpose to get moving again",
    name: "Yara Haddad",
    username: "yara",
    location: "Beirut",
    at: "2026-09-01T15:35:00",
  },
  {
    mood: "coding",
    surface: "colour",
    themeId: "classic",
    statement: "Three hours into a bug that was a missing await",
    name: "Amina Okoro",
    username: "amina",
    location: "Lagos",
    at: "2026-09-01T23:41:00",
  },
  {
    mood: "hiring",
    surface: "ink",
    themeId: "clean",
    statement: "Two roles open. Both remote.",
    name: "Priya Nair",
    username: "priya",
    location: "Bengaluru",
    at: "2026-09-01T11:15:00",
  },
  {
    mood: "thinking",
    surface: "paper",
    themeId: "nokia",
    statement: "Sitting with a problem instead of solving it, for once",
    name: "Noor Rahman",
    username: "noor",
    location: "Karachi",
    at: "2026-09-02T04:30:00",
  },
  {
    mood: "available",
    surface: "colour",
    themeId: "terminal",
    statement: "Free this week and answering everything",
    name: "Tom Alvarez",
    username: "tom",
    location: "Lisbon",
    at: "2026-09-01T12:00:00",
  },
  {
    mood: "speaking",
    surface: "ink",
    themeId: "impact",
    statement: "Recording the podcast I have been putting off since March",
    name: "Bianca Costa",
    username: "bianca",
    location: "Sao Paulo",
    at: "2026-09-01T18:25:00",
  },
  {
    mood: "learning",
    surface: "paper",
    themeId: "classic",
    statement: "Beginner again, and it is the best part",
    name: "Mikael Lind",
    username: "mikael",
    location: "Stockholm",
    at: "2026-09-01T07:30:00",
  },
  {
    mood: "traveling",
    surface: "colour",
    themeId: "clean",
    statement: "Nairobi until Sunday",
    name: "Chidi Nwosu",
    username: "chidi",
    location: "Nairobi",
    at: "2026-09-01T06:45:00",
  },
  {
    mood: "offline",
    surface: "ink",
    themeId: "nokia",
    statement: "Phone in a drawer until the weekend is over",
    name: "Hana Kim",
    username: "hana",
    location: "Seoul",
    at: "2026-09-01T20:45:00",
  },
  {
    mood: "building",
    surface: "paper",
    themeId: "impact",
    statement: "Week one of the thing I quit for",
    name: "Diego Fuentes",
    username: "diego",
    location: "Bogota",
    at: "2026-09-01T08:05:00",
  },
  {
    mood: "creating",
    surface: "colour",
    themeId: "classic",
    statement: "Second draft, and it finally sounds like a person wrote it",
    name: "Sofia Reyes",
    username: "sofia",
    location: "Mexico City",
    at: "2026-09-01T19:30:00",
  },
  {
    mood: "coding",
    surface: "ink",
    themeId: "clean",
    statement: "Refactoring the part everyone is scared of",
    name: "Wei Chen",
    username: "wei",
    location: "Shenzhen",
    at: "2026-09-02T02:30:00",
  },
  {
    mood: "hiring",
    surface: "paper",
    themeId: "nokia",
    statement: "Hiring the person I would want to work for",
    name: "Grace Mutiso",
    username: "grace",
    location: "Nairobi",
    at: "2026-09-01T10:55:00",
  },
  {
    mood: "thinking",
    surface: "colour",
    themeId: "terminal",
    statement: "Deep work. No pings.",
    name: "Sam Okonkwo",
    username: "sam",
    location: "Remote",
    at: "2026-09-01T03:14:00",
  },
  {
    mood: "available",
    surface: "ink",
    themeId: "impact",
    statement: "Open for one more project this quarter",
    name: "Kwame Mensah",
    username: "kwame",
    location: "Accra",
    at: "2026-09-01T16:40:00",
  },
  {
    mood: "speaking",
    surface: "paper",
    themeId: "classic",
    statement: "Talking to a room of eighteen year olds about failing early",
    name: "Aisha Bello",
    username: "aisha",
    location: "Abuja",
    at: "2026-09-01T12:45:00",
  },
  {
    mood: "learning",
    surface: "colour",
    themeId: "clean",
    statement: "Reading the spec properly this time",
    name: "Ife Adeyemi",
    username: "ife",
    location: "Ibadan",
    at: "2026-09-01T14:20:00",
  },
  {
    mood: "traveling",
    surface: "ink",
    themeId: "nokia",
    statement: "Night train to Milan",
    name: "Clara Dubois",
    username: "clara",
    location: "Paris",
    at: "2026-09-01T23:20:00",
  },
  {
    mood: "offline",
    surface: "paper",
    themeId: "terminal",
    statement: "Away. The work will keep.",
    name: "Felix Braun",
    username: "felix",
    location: "Munich",
    at: "2026-09-01T21:50:00",
  },
];

const BY_USERNAME = new Map(WALL_SEEDS.map((s) => [s.username, s]));

/**
 * A seed by handle, so a wall tile never links into a dead end.
 *
 * Every tile on the wall links to its live page (§9.3). A seed has no row in
 * `profiles`, so without this the thirty most visible links on the site would
 * all land on "this profile doesn't exist" — which is a worse first impression
 * than the empty wall the seeds exist to prevent.
 */
export function getWallSeed(username) {
  return BY_USERNAME.get(String(username || "").trim().toLowerCase()) ?? null;
}
