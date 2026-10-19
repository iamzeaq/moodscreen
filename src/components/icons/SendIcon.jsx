/**
 * The paper plane — the share action's icon, on the app and the public page.
 *
 * Drawn in the face mark's idiom (§8) rather than borrowed from an icon set:
 * strokes in `currentColor`, round caps and joins, stroke 3 on a 40 grid. The
 * mark is what the rest of the product is drawn in, so the one icon that sits
 * on a primary button should look like the same hand made it.
 *
 * A plane, not an arrow. §12 bans arrows appended to button text, and an arrow
 * says "go" rather than "send this to someone"; the plane is the one symbol
 * every messaging app has already taught people means the second thing.
 */
export function SendIcon({ size = 22, strokeWidth, ...props }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? (size < 24 ? 3.4 : 3)}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* The plane, nose up and to the right. */}
      <path d="M34 6 L6 17.5 L17.5 22.5 L22.5 34 Z" />
      {/* The fold, from the nose to where the wings meet. */}
      <path d="M34 6 L17.5 22.5" />
    </svg>
  );
}
