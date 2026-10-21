/**
 * The last line under every page.
 *
 * Without it, an error anywhere in the tree unmounts the app and leaves the
 * dark canvas and nothing else — which on a first visit reads as a site that
 * is down. A chunk that failed to download reloads the page once (see
 * reloadOnce); anything else, or a second failure, says so plainly and offers
 * the reload as a button.
 */
import { Component } from "react";
import Logo from "./brand/Logo.jsx";
import Button from "./ui/Button.jsx";
import { isChunkLoadError, reloadOnce } from "../lib/reloadOnce.js";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, reloading: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("moodscreen:", error);
    if (isChunkLoadError(error) && reloadOnce()) this.setState({ reloading: true });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    /* About to reload: the loading mark, not an error the user would only see
     * flash past. */
    if (this.state.reloading) return <LoadingMark />;

    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-4 text-center">
        <Logo mood="offline" size={48} className="text-faint" />
        <div className="flex flex-col gap-2">
          <h1 className="text-18 font-semibold text-fg">This page didn't load</h1>
          <p className="text-15 text-muted">Usually a dropped connection. Reload to try again.</p>
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </main>
    );
  }
}

/**
 * What shows while a page's file downloads: the mark, still, on the canvas.
 *
 * An empty screen here was indistinguishable from a broken site on a slow
 * connection. Still rather than pulsing — §6 spends the motion budget on three
 * moments and a loader is not one of them.
 */
export function LoadingMark() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas" role="status">
      <Logo mood="thinking" size={40} className="text-faint" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
