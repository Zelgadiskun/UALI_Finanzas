import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TransactionRow } from "@/components/ffos/TransactionRow";
import { TransactionSheet } from "@/components/ffos/TransactionSheet";
import { Fab } from "@/components/ffos/Fab";
import { EmptyState } from "@/components/ffos/EmptyState";
import { RowsSkeleton } from "@/components/ffos/Skeletons";
import { useTxActions } from "@/components/ffos/useTxActions";
import { useFfos, useIsHydrated } from "@/lib/ffos/store";
import { groupLabel, money, sameMonth } from "@/lib/ffos/format";
import { TX_TYPES, type TxType } from "@/lib/ffos/types";
import { cn } from "@/lib/utils";

const title = "Movimientos — FFOS Wallet";
const description =
  "Registro completo de ingresos, gastos, pagos de deuda y ahorro de la familia, agrupado por día y con filtros rápidos por tipo.";

export const Route = createFileRoute("/movimientos")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Movimientos,
});

type Filter = TxType | "todos";

function Movimientos() {
  const state = useFfos();
  const hydrated = useIsHydrated();
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const actions = useTxActions();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.transactions
      .filter((t) => (filter === "todos" ? true : t.type === filter))
      .filter((t) => (q ? `${t.category} ${t.note ?? ""}`.toLowerCase().includes(q) : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, filter, query]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const monthTotal = useMemo(() => {
    const month = filtered.filter((t) => sameMonth(t.date));
    return month.reduce((a, t) => a + (t.type === "ingreso" ? t.amount : -t.amount), 0);
  }, [filtered]);

  return (
    <main className="px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold">Movimientos</h1>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        Neto del mes:{" "}
        <span
          className={cn(
            "font-semibold tabular-nums",
            monthTotal < 0 ? "text-danger" : "text-accent",
          )}
        >
          {money(monthTotal)}
        </span>
      </p>

      <div className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-3">
        <Search
          className="size-4 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por categoría o nota"
          aria-label="Buscar movimientos"
          className="w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
        />
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {(
          [{ value: "todos", label: "Todos" }, ...TX_TYPES] as { value: Filter; label: string }[]
        ).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-medium",
              filter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!hydrated ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <RowsSkeleton count={6} />
        </div>
      ) : groups.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-card">
          <EmptyState
            title="Sin movimientos"
            description="Probá cambiar el filtro o registrá un movimiento nuevo."
            action={
              <button
                onClick={() => setSheetOpen(true)}
                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                Agregar movimiento
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map(([date, list]) => (
            <section key={date}>
              <h2 className="mb-1.5 text-[12px] font-semibold tracking-wide uppercase text-muted-foreground">
                {groupLabel(date)}
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                {list.map((tx) => (
                  <div
                    key={tx.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      actions.open(tx);
                    }}
                  >
                    <TransactionRow tx={tx} onOptions={actions.open} showDate={false} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Fab label="Nueva transacción" onClick={() => setSheetOpen(true)} />
      <TransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      {actions.element}
    </main>
  );
}
