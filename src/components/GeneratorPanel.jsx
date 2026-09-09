import { useMoodscreen } from "../context/MoodscreenContext.jsx";
import { MicroCornerFrame, MicroDecorMesh } from "./MicroDecor.jsx";
import Moodscreen from "./Moodscreen.jsx";
import ScreenDivider from "./brand/ScreenDivider.jsx";
import StatusForm from "./StatusForm.jsx";

/** Off-screen PNG capture + live preview + form — shared by home and /create */
export default function GeneratorPanel({ showHeader = true }) {
  const {
    formValue,
    handleFormChange,
    downloadPng,
    sharePng,
    copyLink,
    isExporting,
    copied,
    downloadError,
    shareReady,
    moodscreenProps,
    storageNotice,
  } = useMoodscreen();

  return (
    <>
      <ScreenDivider direction="up" />
      <div id="generator" className="generator-panel generator-zone relative">
        <MicroDecorMesh />
        <div className="generator-panel-inner relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-14 [padding-top:calc(3.25rem+env(safe-area-inset-top))] [padding-bottom:calc(3.25rem+env(safe-area-inset-bottom))] sm:gap-12 sm:px-6 sm:py-16">
          {showHeader ? (
            <header className="w-full max-w-5xl">
              {/* §2 — the object is a Moodscreen, never a card, and an
                * all-caps eyebrow above a heading is §12's first entry. */}
              <h1 className="text-balance text-34 font-semibold text-fg">
                Make a Moodscreen
              </h1>
              <p className="mt-4 max-w-lg text-15 text-muted">
                Say what you&apos;re on. It updates as you type.
              </p>
            </header>
          ) : null}

          <div className="flex flex-col gap-12 lg:flex-row lg:items-stretch lg:gap-0">
            <section className="order-2 min-w-0 flex-1 lg:order-1 lg:pr-12 lg:pt-0">
              <StatusForm
                value={formValue}
                onChange={handleFormChange}
                title="Your Moodscreen"
              />
            </section>

            <div
              className="hidden w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-border to-transparent lg:order-2 lg:block"
              aria-hidden
            />

            <section className="relative order-1 flex w-full flex-col lg:order-3 lg:w-[min(100%,26.5rem)] lg:shrink-0 lg:pl-12">
              <MicroCornerFrame className="hidden text-primary opacity-70 lg:block" />
              <div className="relative mb-5 flex flex-col gap-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:flex-col">
                  <h2 className="text-18 font-semibold text-fg">Live</h2>
                  <div className="flex flex-wrap gap-2 sm:justify-end lg:justify-start">
                    <button
                      type="button"
                      onClick={copyLink}
                      disabled={!(formValue.link || "").trim()}
                      className="generator-btn generator-btn-ghost"
                      title={
                        (formValue.link || "").trim() ? "Copy link" : "Add a link to enable"
                      }
                    >
                      {copied ? "Copied" : "Copy link"}
                    </button>
                    <button
                      type="button"
                      onClick={sharePng}
                      disabled={isExporting}
                      className="generator-btn generator-btn-ghost"
                      title="Open the share sheet with the image and your link"
                    >
                      {isExporting && !shareReady ? "Preparing…" : "Drop your Moodscreen"}
                    </button>
                    <button
                      type="button"
                      onClick={downloadPng}
                      disabled={isExporting}
                      className="generator-btn generator-btn-primary"
                    >
                      {isExporting && !shareReady ? "Preparing…" : "Save the image"}
                    </button>
                  </div>
                </div>
                {downloadError ? (
                  <p className="max-w-[min(100%,24rem)] text-xs leading-relaxed text-red-600/90 dark:text-red-400/90">
                    {downloadError}
                  </p>
                ) : null}
                {storageNotice ? (
                  <p
                    className="max-w-[min(100%,24rem)] text-xs leading-relaxed text-meta"
                    role="status"
                  >
                    {storageNotice}
                  </p>
                ) : null}
              </div>

              {/* The preview. The node that actually gets photographed is the
                * off-screen twin the provider mounts, so nothing here has to
                * be export-safe. */}
              <div className="generator-preview-rim flex justify-center">
                <Moodscreen {...moodscreenProps} width={360} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
