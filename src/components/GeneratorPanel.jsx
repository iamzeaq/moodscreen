import { useMoodscreen } from "../context/MoodscreenContext.jsx";
import { MicroCornerFrame, MicroDecorMesh } from "./MicroDecor.jsx";
import Moodscreen from "./Moodscreen.jsx";
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
      <div
        id="generator"
        className="generator-panel generator-zone relative border-t border-border"
      >
        <MicroDecorMesh />
        <div className="generator-panel-inner relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-14 [padding-top:calc(3.25rem+env(safe-area-inset-top))] [padding-bottom:calc(3.25rem+env(safe-area-inset-bottom))] sm:gap-12 sm:px-6 sm:py-16">
          {showHeader ? (
            <header className="w-full max-w-5xl">
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-meta">
                moodscreen / studio
              </p>
              <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-primary sm:text-[2.35rem] sm:leading-tight">
                Build your{" "}
                <span className="text-accent">status card</span>
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-secondary">
                Monochrome, sharp, and screenshot-ready. Edit the fields — the preview
                updates live.
              </p>
              <div
                className="mt-8 h-1 w-12 rounded-full bg-primary"
                aria-hidden
              />
            </header>
          ) : null}

          <div className="flex flex-col gap-12 lg:flex-row lg:items-stretch lg:gap-0">
            <section className="order-2 min-w-0 flex-1 lg:order-1 lg:pr-12 lg:pt-0">
              <StatusForm
                value={formValue}
                onChange={handleFormChange}
                title="Edit your card"
                className="!rounded-[1.25rem] !border-neutral-200/90 !p-5 !shadow-[0_28px_80px_-40px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04] sm:!p-8 [data-theme=dark]:!border-white/[0.08] [data-theme=dark]:ring-white/[0.06] [data-theme=dark]:!shadow-[0_28px_80px_-40px_rgba(0,0,0,0.75)]"
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
                  <div>
                    <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-meta">
                      Output
                    </p>
                    <h2 className="ds-title-sm mt-1">Live preview</h2>
                  </div>
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
