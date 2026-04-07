/**
 * Product-meaning bento grid — muted sage + maroon + moss + amber (yellow kept bright).
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
          className={`${tileBase} row-span-2 flex min-h-[15.5rem] flex-col justify-center gap-2 bg-[#6f7d6f] sm:min-h-[18.5rem] sm:gap-2.5`}
        >
          <p className="bento-stat-figure bento-stat-figure--tall text-[#f6f8f4]">
            50+ moods
          </p>
          <p className="bento-stat-caption max-w-[18ch] text-[#eef1ea]/92">
            from building to doing nothing
          </p>
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-[#a3b18a]/35 blur-3xl"
            aria-hidden
          />
        </div>

        {/* Card 2 — sun amber (digits + tabular; + separate so it never clips) */}
        <div
          className={`${tileBase} row-span-2 flex min-h-[15.5rem] flex-col justify-center gap-2 bg-[#fbbf24] sm:min-h-[18.5rem] sm:gap-2.5`}
        >
          <p className="bento-stat-figure bento-stat-figure--tall w-full min-w-0 whitespace-nowrap text-center text-[#1c1917]">
            <span className="tabular-nums">15,000</span>
            <span className="inline pl-[0.06em] font-[inherit]">+</span>
          </p>
          <p className="bento-stat-caption text-center text-[#3f3a36]">moodscreens created</p>
        </div>

        {/* Card 3 — dusty maroon */}
        <div
          className={`${tileBase} flex min-h-[12rem] flex-col items-center justify-center gap-1.5 bg-[#7a4e52] px-2 text-center sm:min-h-[13.5rem] sm:gap-2 sm:px-3`}
        >
          <p className="bento-stat-figure bento-stat-figure--compact max-w-full min-w-0 text-[#fdf8f7]">
            1 screen
          </p>
          <p className="bento-stat-caption max-w-[15ch] text-[#fdf8f7]/85">
            everything you&apos;re on
          </p>
        </div>

        {/* Card 4 — moss / olive */}
        <div
          className={`${tileBase} flex min-h-[12rem] flex-col justify-center gap-1.5 bg-[#5a6352] sm:min-h-[13.5rem] sm:gap-2`}
        >
          <p className="bento-stat-figure bento-stat-figure--compact text-[#f7f9f4]">10 seconds</p>
          <p className="bento-stat-caption text-[#f0f4ec]/85">to update your state</p>
        </div>
      </div>
    </div>
  );
}
