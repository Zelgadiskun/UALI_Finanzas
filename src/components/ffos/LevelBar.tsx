import { Flame, Sparkles } from "lucide-react";
import { levelInfo } from "@/lib/ffos/gamification";
import { ProgressBar } from "./ProgressBar";

export function LevelBar({
  xp,
  streak,
  onOpen,
}: {
  xp: number;
  streak: number;
  onOpen: () => void;
}) {
  const info = levelInfo(xp);

  return (
    <button
      onClick={onOpen}
      className="w-full rounded-2xl bg-primary p-4 text-left text-primary-foreground shadow-card transition-transform active:scale-[0.99]"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-wide uppercase opacity-70">
            Nivel {info.level}
          </p>
          <p className="truncate text-base font-semibold">{info.name}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[rgb(255_255_255/0.14)] px-2.5 py-1 text-xs font-semibold">
          <Flame className="size-4 text-warning" strokeWidth={1.75} aria-hidden="true" />
          {streak} d
        </span>
      </div>
      <div className="mt-3">
        <ProgressBar value={info.pct} state="ok" height={8} className="bg-[rgb(255_255_255/0.18)]" />
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] opacity-80">
        <Sparkles className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
        {info.next
          ? `${info.xpIntoLevel}/${info.xpForLevel} XP · faltan ${info.xpToNext} para ${info.next.name}`
          : `${xp} XP · nivel máximo alcanzado`}
      </p>
    </button>
  );
}
