import AuthBar from "../components/AuthBar.jsx";
import Hero from "../components/Hero.jsx";
import HowItLooks from "../components/HowItLooks.jsx";
import SamplesSection from "../components/SamplesSection.jsx";
import ColorEnergySection from "../components/ColorEnergySection.jsx";
import FinalCTASection from "../components/FinalCTASection.jsx";
import GeneratorPanel from "../components/GeneratorPanel.jsx";

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-end px-4 pt-[calc(0.65rem+env(safe-area-inset-top))] sm:px-6 sm:pt-[calc(0.85rem+env(safe-area-inset-top))]"
      >
        <div className="pointer-events-auto">
          <AuthBar />
        </div>
      </div>

      <Hero />

      <HowItLooks />

      <SamplesSection />

      <ColorEnergySection />

      <FinalCTASection />

      <GeneratorPanel />
    </div>
  );
}
