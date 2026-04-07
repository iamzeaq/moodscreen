import { useState } from "react";
import { getUserAvatarUrl, getUserInitials } from "../lib/userProfile.js";

/**
 * Circular avatar — photo from OAuth when available, otherwise initials.
 * `plain` — only the circle (no ring/shadow); use inside your own button.
 */
export default function UserAvatar({
  user,
  size = 40,
  className = "",
  plain = false,
  ringClassName = "ring-[1.5px] ring-black/[0.06] shadow-[0_2px_10px_rgba(0,0,0,0.1)]",
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const url = getUserAvatarUrl(user);
  const initials = getUserInitials(user);
  const showImg = Boolean(url && !imgFailed);

  const dim = typeof size === "number" ? `${size}px` : size;

  return (
    <span
      className={[
        "user-avatar inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-zinc-200 to-zinc-400 text-[0.7rem] font-semibold tracking-tight text-neutral-800 antialiased",
        plain ? "" : ringClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      {showImg ? (
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </span>
  );
}
