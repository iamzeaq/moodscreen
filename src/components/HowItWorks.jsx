/**
 * How it works — CLAUDE.md §9.4.
 *
 * "Three steps. This is a genuine sequence, so numbering is legitimate here and
 * only here."
 *
 * That last clause is the whole reason this section is allowed to look the way
 * it does. §12 bans numbered markers on content that is not a sequence, which is
 * most of what gets numbered on a landing page — three "pillars", four
 * "benefits", a grid of features wearing 01/02/03 because the numerals looked
 * good. Here the order is load-bearing: you cannot post it before you have said
 * it, and it cannot stay live before it has been posted. So the numbers carry
 * meaning and are drawn plainly, as numerals, rather than dressed up in circles.
 *
 * The three steps are §2's three sentences — "Say what you're on. Post it
 * anywhere. It stays live." — which is the subhead in the hero. Saying the same
 * three things twice on one page is deliberate: the hero states them as a claim
 * before you have done anything, and this restates them as a sequence after you
 * have made one, so they land as an explanation rather than as a slogan.
 *
 * Left-aligned. §5 makes the hero the only centred section on the site.
 */
import ScreenDivider from "./brand/ScreenDivider.jsx";

const STEPS = [
  {
    n: 1,
    title: "Say what you're on",
    body: "One line, in the field at the top of this page. The Moodscreen builds as you type — pick a mood for the colour, a surface for how it sits.",
  },
  {
    n: 2,
    title: "Post it anywhere",
    body: "Save the image and drop it in a story, a group chat, a timeline. It goes out as a square PNG on a dark ground, so nothing turns it into blocks on the way.",
  },
  {
    n: 3,
    title: "It stays live",
    body: "The image points at moodscreen.live/yourname, and that page always shows the current one. Change what you're on and everyone who kept the link sees it.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-canvas"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-content px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl">
          <h2
            id="how-it-works-heading"
            className="text-balance text-34 font-semibold text-fg"
          >
            Three taps and it is out there
          </h2>
          {/* The ornament under the heading is the screen's edge too — §9.7, and
            * a dot-line-dot rule is a horizontal rule wearing a hat. */}
          <ScreenDivider
            direction="up"
            depth={14}
            contained={false}
            className="mt-6 max-w-[160px]"
          />
        </div>

        {/* §5 — space above a heading is about twice the space below it, so each
          * step's number binds to the words it introduces rather than floating
          * between two of them. */}
        <ol className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-10">
          {STEPS.map((s) => (
            <li key={s.n} className="max-w-sm">
              {/* The marker, as a numeral and nothing else. Faint, because the
                * order matters and the number itself does not — a numeral in a
                * filled circle is a badge, and a badge competes with the words
                * it is meant to be counting. */}
              <p className="text-34 font-semibold leading-none text-faint">{s.n}</p>
              <h3 className="mt-5 text-18 font-semibold text-fg">{s.title}</h3>
              <p className="mt-2 text-15 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
