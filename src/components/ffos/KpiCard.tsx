import { cn } from "@/lib/utils";
import { money } from "@/lib/ffos/format";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function KpiCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: number;
  delta?: number | undefined;
  tone: "accent" | "danger" | "warning";
}) {
  const toneText = {
    accent: "text-accent",
    danger: "text-danger",
    warning: "text-warning",
  }[tone];

  const DeltaIcon =
    delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-card">
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-base font-bold tabular-nums", toneText)}>{money(value, 9999)}</p>
      {delta !== undefined && (
        <p className="mt-1 flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
          <DeltaIcon className="size-3" strokeWidth={2} />
          {Math.abs(delta)}% vs mes ant.
        </p>
      )}
    </div>
  );
}
