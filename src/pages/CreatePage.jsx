import { Link } from "react-router-dom";
import AuthBar from "../components/AuthBar.jsx";
import GeneratorPanel from "../components/GeneratorPanel.jsx";

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

      <GeneratorPanel />
    </div>
  );
}
