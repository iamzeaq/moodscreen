import { useMemo } from "react";
import * as Icons from "./icons/index.js";

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(list, r) {
  return list[Math.floor(r() * list.length)];
}

export default function FloatingBackground({
  density = 18,
  seed = 42,
  className = "",
}) {
  const iconComponents = useMemo(
    () => Object.values(Icons).filter((v) => typeof v === "function"),
    [],
  );

  const items = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({ length: density }).map((_, i) => {
      const Icon = pick(iconComponents, r);
      const size = 16 + Math.floor(r() * 28); // 16–44
      const opacity = 0.035 + r() * 0.045; // 0.035–0.08
      const x = r() * 100;
      const y = r() * 100;
      const blur = r() < 0.45 ? 1 + r() * 2.2 : 0; // more blurred (softer)
      const duration = 18 + r() * 26; // 18–44s
      const delay = -r() * duration; // desync
      const driftX = (r() - 0.5) * 60; // px
      const driftY = (r() - 0.5) * 60; // px
      const spin = r() < 0.25 ? 1 : 0;

      return {
        key: `${seed}-${i}`,
        Icon,
        size,
        opacity,
        x,
        y,
        blur,
        duration,
        delay,
        driftX,
        driftY,
        spin,
      };
    });
  }, [density, seed, iconComponents]);

  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      ].join(" ")}
      aria-hidden
    >
      {items.map((it) => (
        <div
          key={it.key}
          className={[
            "absolute fb-float text-primary",
            it.spin ? "fb-spin" : "",
          ].join(" ")}
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            opacity: it.opacity,
            filter: it.blur ? `blur(${it.blur}px)` : undefined,
            width: `${it.size}px`,
            height: `${it.size}px`,
            marginLeft: `${-(it.size / 2)}px`,
            marginTop: `${-(it.size / 2)}px`,
            ["--fb-dx"]: `${it.driftX}px`,
            ["--fb-dy"]: `${it.driftY}px`,
            animationDuration: `${it.duration}s`,
            animationDelay: `${it.delay}s`,
          }}
        >
          <it.Icon className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}

