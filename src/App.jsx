import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppErrorBoundary, { LoadingMark } from "./components/AppErrorBoundary.jsx";
import AuthModalHost from "./components/AuthModalHost.jsx";
import GrainLayer from "./components/GrainLayer.jsx";
import ScreenClipDef from "./components/brand/ScreenClip.jsx";
import OnboardingGate from "./components/OnboardingGate.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { MoodscreenProvider } from "./context/MoodscreenContext.jsx";

const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const CreatePage = lazy(() => import("./pages/CreatePage.jsx"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage.jsx"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage.jsx"));
const KitchenSinkPage = lazy(() => import("./pages/KitchenSinkPage.jsx"));

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <OnboardingGate />
          <MoodscreenProvider>
            {/* One grain layer for the whole app (CLAUDE.md §7). */}
            <GrainLayer />
            {/* The screen outline as a scalable clip, for site chrome. The card
              * clips with a literal path of its own — see ScreenClip.jsx. */}
            <ScreenClipDef />
            <Suspense fallback={<LoadingMark />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/kitchen-sink" element={<KitchenSinkPage />} />
                <Route path="/:username" element={<PublicProfilePage />} />
              </Routes>
            </Suspense>
            <AuthModalHost />
          </MoodscreenProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
