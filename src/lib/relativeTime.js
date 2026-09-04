/**
 * "updated 20 minutes ago" — CLAUDE.md §7.10.
 *
 * This string and the live dot beside it are the whole difference between the
 * public page and a link-in-bio page. An absolute date would make the page a
 * record; a relative one makes it a reading, which is what a stranger arriving
 * from a story is there to take.
 *
 * The buckets get coarser as they get older on purpose. Under an hour the exact
 * number is the point — "four minutes ago" says someone is at their desk right
 * now. Past a week it stops being news and precision starts to read as a
 * timestamp rather than as currency, so it rounds hard.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * A phrase, without the verb. The caller supplies "updated", because the same
 * phrase reads differently in front of different verbs and this file should not
 * decide which one it is in front of.
 *
 * @param {string | number | Date | null | undefined} at
 * @param {number} [now]
 * @returns {string} e.g. "20 minutes ago", "just now", "" if unreadable
 */
export function relativeTime(at, now = Date.now()) {
  if (at === null || at === undefined || at === "") return "";
  const t = at instanceof Date ? at.valueOf() : new Date(at).valueOf();
  if (Number.isNaN(t)) return "";

  /* A clock that is behind the writer's — a phone a few seconds out, or a row
   * written on a server ahead of the reader — must not print "in 3 minutes" on
   * a page whose whole claim is that it is current. */
  const ms = Math.max(0, now - t);

  if (ms < MINUTE) return "just now";
  if (ms < HOUR) return `${plural(Math.floor(ms / MINUTE), "minute")} ago`;
  if (ms < DAY) return `${plural(Math.floor(ms / HOUR), "hour")} ago`;
  if (ms < WEEK) return `${plural(Math.floor(ms / DAY), "day")} ago`;
  if (ms < 5 * WEEK) return `${plural(Math.floor(ms / WEEK), "week")} ago`;

  const months = Math.floor(ms / (30 * DAY));
  if (months < 12) return `${plural(months, "month")} ago`;
  return `${plural(Math.floor(months / 12), "year")} ago`;
}

/**
 * How long until the phrase above would change, in ms.
 *
 * A page left open on a desk is the case that matters: "just now" that still
 * says "just now" an hour later is exactly the staleness §7.10 forbids. So the
 * tick follows the bucket rather than running on a fixed timer — once a minute
 * while that is what moves, once an hour after that, and effectively never for
 * anything measured in weeks.
 *
 * @param {string | number | Date | null | undefined} at
 * @param {number} [now]
 * @returns {number | null} null when nothing will change on any useful horizon
 */
export function relativeTimeTick(at, now = Date.now()) {
  if (at === null || at === undefined || at === "") return null;
  const t = at instanceof Date ? at.valueOf() : new Date(at).valueOf();
  if (Number.isNaN(t)) return null;

  const ms = Math.max(0, now - t);
  if (ms < HOUR) return MINUTE - (ms % MINUTE);
  if (ms < DAY) return HOUR - (ms % HOUR);
  if (ms < WEEK) return DAY - (ms % DAY);
  return null;
}
