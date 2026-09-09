/**
 * The landing page — CLAUDE.md §9.
 *
 * The rhythm §9 asks for is contained → contained → full-bleed → contained →
 * scroller → contained, with the break in the middle giving the page a spine.
 * Sessions 4 and 5 build the pulse, the wall, how-it-works and the theme
 * scroller; the three light-ground sections between the hero and the close are
 * pre-redesign and are what those sessions replace.
 *
 * What is already true, and must stay true through those sessions:
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
 */
import Hero from "../components/Hero.jsx";
import HowItLooks from "../components/HowItLooks.jsx";
import SamplesSection from "../components/SamplesSection.jsx";
import ColorEnergySection from "../components/ColorEnergySection.jsx";
import ClosingSection from "../components/ClosingSection.jsx";
import ScreenDivider from "../components/brand/ScreenDivider.jsx";
import SiteNav from "../components/SiteNav.jsx";

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* The nav is absolute, so it needs a positioned ancestor and the hero
        * below it needs the top padding to clear it — see SiteNav. */}
      <div className="relative">
        <SiteNav />
        <Hero />
      </div>

      <ScreenDivider direction="up" />
      <HowItLooks />

      <ScreenDivider direction="down" />
      <SamplesSection />

      <ScreenDivider direction="up" />
      <ColorEnergySection />

      <ScreenDivider direction="down" />
      <ClosingSection />
    </div>
  );
}
