import { Link } from "react-router-dom";
import AuthBar from "../components/AuthBar.jsx";
import GeneratorPanel from "../components/GeneratorPanel.jsx";
import WallOptIn from "../components/WallOptIn.jsx";

export default function CreatePage() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="ds-body text-secondary transition-colors hover:text-primary"
          >
            ← Back to home
          </Link>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3 sm:min-w-0">
            <span className="ds-meta hidden text-right sm:inline">
              edits stay in sync with the homepage
            </span>
            <AuthBar />
          </div>
        </div>
      </header>

      {/* §9.3's opt-in. It sits here rather than inside the studio panel
        * because it is a setting about the page, not a control on the
        * Moodscreen — and because §7.10's app view replaces that panel, and
        * this should move with the identity rather than be untangled from it.
        * Renders nothing until a page has been claimed. */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6">
        <WallOptIn />
      </div>

      <GeneratorPanel />
    </div>
  );
}
