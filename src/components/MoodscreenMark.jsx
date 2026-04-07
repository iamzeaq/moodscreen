/**
 * Pixel-style moodscreen mark — SVG avoids CSS filter halos on the raster asset.
 */

export default function MoodscreenMark({ darkMode = true, className = "" }) {
  const face = darkMode ? "#ffffff" : "#0a0a0a";
  const ink = darkMode ? "#0a0a0a" : "#ffffff";
  const purple = "#7c3aed";
  const border = "#b8b8b8";

  return (
    <svg
      className={className}
      viewBox="0 0 40 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      shapeRendering="crispEdges"
    >
      <rect x="1" y="1" width="38" height="50" stroke={border} strokeWidth="2" fill="none" />
      <rect x="4" y="4" width="32" height="44" fill={face} />
      {/* eyes */}
      <rect x="11" y="10" width="4" height="4" fill={purple} />
      <rect x="11" y="14" width="4" height="4" fill={ink} />
      <rect x="25" y="10" width="4" height="4" fill={purple} />
      <rect x="25" y="14" width="4" height="4" fill={ink} />
      {/* mouth */}
      <rect x="11" y="27" width="18" height="3" fill={ink} />
    </svg>
  );
}
