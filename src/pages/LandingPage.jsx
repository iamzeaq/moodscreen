/**
 * The landing page — CLAUDE.md §9.
 *
 * The rhythm §9 asks for is contained → contained → full-bleed → contained →
 * scroller → contained, with the break in the middle giving the page a spine.
 * The pulse and the wall are that middle; session 5 replaces how-it-works and
 * the theme scroller, which are still the pre-redesign sections standing in
 * those two places.
 *
 * What is already true, and must stay true:
 *
 *   - Nothing separates two sections but a `<ScreenDivider>`. Every horizontal
 *     rule is gone. The direction alternates down the page — top edge, bottom
 *     edge, top edge — so the page reads as a stack of screens rather than as
 *     a set of arcs.
 *   - Exactly two sections carry a face-mark background: the hero and the
 *     close. A texture on every section is the background colour.
 *   - The hero is the only centred section (§5).
 *   - There is one editor, and it is the hero. The studio panel lives at
 *     /create; a second copy of it further down the page would make the hero's
 *     live editor look like a demo of something you do properly elsewhere.
 *
 * **Why the sections are a list rather than markup.** Two of them hide
 * themselves: §9 pulls the pulse below 200 live Moodscreens because a small
 * number advertises emptiness, and pulls the wall when it has nothing to show.
 * Written out by hand, each divider would carry a fixed direction, and a hidden
 * section would leave the two arcs around it facing the same way — which §9.7
 * says reads as a row of arcs rather than a stack of screens. So the page asks
 * both sections whether they are drawing, and the alternation falls out of
 * what is actually on the page.
 */
import { Fragment, useRef } from "react";
import Hero from "../components/Hero.jsx";
import HowItLooks from "../components/HowItLooks.jsx";
import SamplesSection from "../components/SamplesSection.jsx";
import PulseSection from "../components/PulseSection.jsx";
import WallSection from "../components/WallSection.jsx";
import ClosingSection from "../components/ClosingSection.jsx";
import ScreenDivider from "../components/brand/ScreenDivider.jsx";
import HeroJoin from "../components/wall/HeroJoin.jsx";
import SiteNav from "../components/SiteNav.jsx";
import { usePulse, useWallTiles } from "../hooks/useWall.js";

export default function LandingPage() {
  const { pulse, visible: pulseVisible } = usePulse();
  const { tiles, visible: wallVisible } = useWallTiles();

  /* The two ends of §6's fourth moment. The hero owns one and the wall's first
   * row owns the other; only this page can see both. */
  const heroCardRef = useRef(null);
  const joinTargetRef = useRef(null);

  const sections = [
    pulseVisible ? { key: "pulse", node: <PulseSection pulse={pulse} /> } : null,
    wallVisible
      ? {
          key: "wall",
          node: <WallSection tiles={tiles} joinTargetRef={joinTargetRef} />,
        }
      : null,
    { key: "how", node: <HowItLooks /> },
    { key: "samples", node: <SamplesSection /> },
    { key: "close", node: <ClosingSection /> },
  ].filter(Boolean);

  return (
    <div className="min-h-dvh">
      {/* The nav is absolute, so it needs a positioned ancestor and the hero
        * below it needs the top padding to clear it — see SiteNav. */}
      <div className="relative">
        <SiteNav />
        <Hero cardRef={heroCardRef} />
      </div>

      {sections.map((s, i) => (
        <Fragment key={s.key}>
          <ScreenDivider direction={i % 2 === 0 ? "up" : "down"} />
          {s.node}
        </Fragment>
      ))}

      {/* Mounted only when there is a wall to join. Renders nothing under
        * `prefers-reduced-motion`, which is the half of §6's rule that CSS
        * cannot enforce. */}
      {wallVisible ? <HeroJoin sourceRef={heroCardRef} targetRef={joinTargetRef} /> : null}
    </div>
  );
}
