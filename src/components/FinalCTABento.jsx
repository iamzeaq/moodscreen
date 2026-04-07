/**
 * Product-meaning bento grid — Color Hunt sage, sand, brown, deep moss.
 * Stat figures use Sora (.bento-stat-figure); card width uses cqi so long numerals don’t clip.
 */

const tileBase =
  "bento-stat-card group relative overflow-hidden rounded-[1.75rem] p-5 shadow-[0_14px_40px_-18px_rgba(0,0,0,0.28)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2rem] sm:p-7";

export default function FinalCTABento({ className = "" }) {
  return (
    <div
      className={["mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none", className].filter(Boolean).join(" ")}
    >
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1 — muted sage green */}
        <div
          className={`${tileBase} row-span-2 flex min-h-[15.5rem] flex-col justify-center gap-2 bg-[#8e977d] sm:min-h-[18.5rem] sm:gap-2.5`}
        >
          <p className="bento-stat-figure bento-stat-figure--tall text-[#fcfbf7]">
            50+ moods
          </p>
          <p className="bento-stat-caption max-w-[18ch] text-[#f5f2ea]/92">
            from building to doing nothing
          </p>
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-[#dbcea5]/40 blur-3xl"
            aria-hidden
          />
        </div>

        {/* Card 2 — warm sand */}
        <div
          className={`${tileBase} row-span-2 flex min-h-[15.5rem] flex-col justify-center gap-2 bg-[#dbcea5] sm:min-h-[18.5rem] sm:gap-2.5`}
        >
          <p className="bento-stat-figure bento-stat-figure--tall w-full min-w-0 whitespace-nowrap text-center text-[#2c2419]">
            <span className="tabular-nums">15,000</span>
            <span className="inline pl-[0.06em] font-[inherit]">+</span>
          </p>
          <p className="bento-stat-caption text-center text-[#4a4338]">moodscreens created</p>
        </div>

        {/* Card 3 — deep brown */}
        <div
          className={`${tileBase} flex min-h-[12rem] flex-col items-center justify-center gap-1.5 bg-[#8a7650] px-2 text-center sm:min-h-[13.5rem] sm:gap-2 sm:px-3`}
        >
          <p className="bento-stat-figure bento-stat-figure--compact max-w-full min-w-0 text-[#fcfbf7]">
            1 screen
          </p>
          <p className="bento-stat-caption max-w-[15ch] text-[#f5f0e8]/88">
            everything you&apos;re on
          </p>
        </div>

        {/* Card 4 — deep moss */}
        <div
          className={`${tileBase} flex min-h-[12rem] flex-col justify-center gap-1.5 bg-[#5c6652] sm:min-h-[13.5rem] sm:gap-2`}
        >
          <p className="bento-stat-figure bento-stat-figure--compact text-[#f7f5ef]">10 seconds</p>
          <p className="bento-stat-caption text-[#e8e4dc]/88">to update your state</p>
        </div>
      </div>
    </div>
  );
}
