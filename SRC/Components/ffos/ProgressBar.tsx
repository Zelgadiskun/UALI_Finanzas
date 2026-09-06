import { cn } from "@/lib/utils";

export type BarState = "ok" | "warn" | "over" | "neutral";

export function barState(pct: number): BarState {
  if (pct > 100) return "over";
  if (pct >= 85) return "warn";
  return "ok";
}

export function ProgressBar({
  value,
  state = "neutral",
  height = 8,
  className,
}: {
  value: number;
  state?: BarState;
  height?: number;
  className?: string;
}) {
  const fill = {
    ok: "bg-accent",
    warn: "bg-warning",
    over: "bg-danger",
    neutral: "bg-primary",
  }[state];

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ height }}
      className={cn("w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", fill)}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}
