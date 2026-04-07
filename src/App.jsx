import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthModalHost from "./components/AuthModalHost.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { MoodscreenProvider } from "./context/MoodscreenContext.jsx";

const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const CreatePage = lazy(() => import("./pages/CreatePage.jsx"));

function RouteFallback() {
  return (
    <div
      className="min-h-dvh bg-surface"
      aria-hidden
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MoodscreenProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/create" element={<CreatePage />} />
            </Routes>
          </Suspense>
          <AuthModalHost />
        </MoodscreenProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
