import { MoreVertical, ArrowDownLeft, ArrowUpRight, Landmark, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { money, shortDate } from "@/lib/ffos/format";
import type { Transaction } from "@/lib/ffos/types";

const meta = {
  ingreso: { icon: ArrowDownLeft, bg: "bg-accent-soft", fg: "text-accent", sign: 1 },
  gasto: { icon: ArrowUpRight, bg: "bg-danger-soft", fg: "text-danger", sign: -1 },
  pago_deuda: { icon: Landmark, bg: "bg-warning-soft", fg: "text-warning", sign: -1 },
  ahorro: { icon: PiggyBank, bg: "bg-info-soft", fg: "text-info", sign: -1 },
} as const;

export function TransactionRow({
  tx,
  onOptions,
  showDate = true,
}: {
  tx: Transaction;
  onOptions?: (tx: Transaction) => void;
  showDate?: boolean;
}) {
  const m = meta[tx.type];
  const Icon = m.icon;
  const amount = m.sign * tx.amount;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", m.bg)}>
        <Icon className={cn("size-5", m.fg)} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.category}</p>
        <p className="truncate text-[12px] text-muted-foreground">
          {[showDate ? shortDate(tx.date) : null, tx.note].filter(Boolean).join(" · ") || "Sin nota"}
        </p>
      </div>
      <p className={cn("shrink-0 text-sm font-semibold tabular-nums", amount < 0 ? "text-danger" : "text-accent")}>
        {amount < 0 ? "−" : "+"}
        {money(tx.amount)}
      </p>
      {onOptions && (
        <button
          aria-label={`Opciones de ${tx.category}`}
          onClick={() => onOptions(tx)}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          <MoreVertical className="size-4" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
