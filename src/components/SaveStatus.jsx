/**
 * The quiet half of "your change stuck".
 *
 * §7.10's app view has no Save button and never will: the Moodscreen persists
 * on its own a beat after the last edit, and a Save button would turn a thing
 * that already happened into a chore. But automatic and *silent* are different
 * claims, and this was silent — `storageNotice` only ever speaks on failure, so
 * the sole evidence a save had worked was that nothing had gone wrong. That is
 * fine for a preference toggle and not fine for the object the whole product is.
 *
 * So: one line, in the flow, holding its own height. Not a toast — a toast is a
 * thing you have to catch, it lands over the content it is about, and it makes a
 * routine success feel like an event. This is closer to the way a document says
 * "All changes saved": easy to look at when you want it, easy to ignore.
 *
 * Three quiet things keep it quiet:
 *
 *   - It says nothing at all in the common case. A write is scheduled on every
 *     burst of typing, and announcing each one would put "Saving" under the
 *     buttons continuously. The context waits ~1.2s before admitting to a
 *     pending write, which in practice means only the rate limiter's delay ever
 *     shows one.
 *   - "Saved" is `--text-faint`, the quietest text on the site. It is a receipt,
 *     not information — nobody needs to read it twice. A failure notice is
 *     `--text-muted`, because that one does want reading.
 *   - It fades rather than appears, on §6's 180ms state change, and opacity is
 *     the only thing that moves. The element is always in the layout, so
 *     nothing below it shifts when the text arrives or leaves.
 *
 * `aria-live="polite"` is the part that matters most for the question this
 * answers: without it there was no way at all for a screen reader to know a
 * change had persisted.
 */

const TEXT = {
  saving: "Saving…",
  saved: "Saved",
};

export default function SaveStatus({ state = "idle", notice = null, className = "" }) {
  /* A failure outranks the receipt: they describe the same write, and showing
   * "Saved" beside "sync failed" would be two answers to one question. */
  const message = notice || TEXT[state] || "";
  const isNotice = Boolean(notice);

  return (
    <p
      role="status"
      aria-live="polite"
      className={[
        "text-13",
        isNotice ? "text-muted" : "text-faint",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        /* Held at full height whether or not it is saying anything, so the
         * buttons above it never move. */
        minHeight: "1.55em",
        opacity: message ? 1 : 0,
        transitionProperty: "opacity",
        transitionDuration: "var(--dur-state)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      {message}
    </p>
  );
}
