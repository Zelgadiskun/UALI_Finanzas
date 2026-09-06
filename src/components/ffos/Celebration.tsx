import { useEffect, useState } from "react";
import { onGameEvent } from "@/lib/ffos/store";

const COLORS = ["var(--accent)", "var(--warning)", "var(--info)", "var(--danger)"];

/** Celebración discreta al subir de nivel o desbloquear un logro. */
export function Celebration() {
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    return onGameEvent((e) => {
      if (e.levelUp || e.newAchievements.length > 0) setBurst((b) => b + 1);
    });
  }, []);

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(0), 1200);
    return () => clearTimeout(t);
  }, [burst]);

  if (!burst) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-24 z-70 flex justify-center"
    >
      <div className="relative size-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute size-2 rounded-[2px]"
            style={{
              backgroundColor: COLORS[i % COLORS.length],
              ["--dx" as string]: `${(i - 9) * 14}px`,
              animation: `ffos-confetti 1s ease-out ${i * 18}ms forwards`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
