import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, Info } from "lucide-react";
import { KpiCard } from "@/components/ffos/KpiCard";
import { LevelBar } from "@/components/ffos/LevelBar";
import { ProgressBar, barState } from "@/components/ffos/ProgressBar";
import { TransactionRow } from "@/components/ffos/TransactionRow";
import { ProgressSheet } from "@/components/ffos/ProgressSheet";
import { DashboardSkeleton } from "@/components/ffos/Skeletons";
import { EmptyState } from "@/components/ffos/EmptyState";
import { useTxActions } from "@/components/ffos/useTxActions";
import { Fab } from "@/components/ffos/Fab";
import { TransactionSheet } from "@/components/ffos/TransactionSheet";
import { useFfos, useIsHydrated } from "@/lib/ffos/store";
import { greeting, money, sameMonth } from "@/lib/ffos/format";
import { cn } from "@/lib/utils";

const title = "FFOS Wallet — Finanzas familiares claras";
const description =
  "Panel familiar de finanzas: balance, ingresos, gastos, deuda y presupuesto del mes en una sola pantalla, con niveles y rachas que enseñan a manejar la plata.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const state = useFfos();
  const hydrated = useIsHydrated();
  const [progressOpen, setProgressOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const actions = useTxActions();

  const stats = useMemo(() => {
    const month = state.transactions.filter((t) => sameMonth(t.date));
    const sum = (type: string) =>
      month.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0);
    const income = sum("ingreso");
    const expense = sum("gasto");
    const debtPaid = sum("pago_deuda");
    const saved = sum("ahorro");
    return {
      income,
      expense,
      balance: income - expense - debtPaid - saved,
      free: state.monthlyIncomePlan - state.budget.reduce((a, b) => a + b.planned, 0),
    };
  }, [state]);

  const topBudget = useMemo(
    () =>
      [...state.budget]
        .sort((a, b) => b.spent / b.planned - a.spent / a.planned)
        .slice(0, 3),
    [state.budget],
  );

  const alerts = useMemo(() => {
    const list: { tone: "warning" | "danger" | "info"; text: string }[] = [];
    for (const b of state.budget) {
      if (b.spent > b.planned)
        list.push({ tone: "danger", text: `${b.name} superó el plan por ${money(b.spent - b.planned)}` });
      else if (b.spent / b.planned >= 0.85)
        list.push({ tone: "warning", text: `${b.name} está al ${Math.round((b.spent / b.planned) * 100)}% del plan` });
    }
    if (state.progress.streak >= 3)
      list.push({ tone: "info", text: `Llevás ${state.progress.streak} días registrando. Seguí la racha.` });
    return list;
  }, [state]);

  const latest = useMemo(
    () => [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [state.transactions],
  );

  if (!hydrated) return <DashboardSkeleton />;

  return (
    <main className="px-4 pt-4 pb-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-muted-foreground">{greeting()},</p>
          <h1 className="truncate text-xl font-bold">Familia</h1>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">Balance</p>
          <p className="text-2xl font-bold tabular-nums text-primary">{money(stats.balance)}</p>
        </div>
      </header>

      <div className="mt-4">
        <LevelBar
          xp={state.progress.xp}
          streak={state.progress.streak}
          onOpen={() => setProgressOpen(true)}
        />
      </div>

      <section aria-label="Indicadores del mes" className="mt-4 grid grid-cols-3 gap-2">
        <KpiCard label="Ingresos" value={stats.income} delta={12} tone="accent" />
        <KpiCard label="Gastos" value={stats.expense} delta={-4} tone="danger" />
        <KpiCard label="Deuda" value={state.debtTotal} delta={-2} tone="warning" />
      </section>

      {alerts.length > 0 && (
        <section aria-label="Alertas" className="mt-4 space-y-2">
          {alerts.slice(0, 2).map((a) => (
            <div
              key={a.text}
              className={cn(
                "flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px]",
                a.tone === "danger" && "bg-danger-soft text-danger",
                a.tone === "warning" && "bg-warning-soft text-[color:var(--foreground)]",
                a.tone === "info" && "bg-info-soft text-info",
              )}
            >
              {a.tone === "info" ? (
                <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span className="min-w-0">{a.text}</span>
            </div>
          ))}
          {alerts.length > 2 && (
            <p className="text-[12px] text-muted-foreground">+{alerts.length - 2} más</p>
          )}
        </section>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        Capacidad libre este mes:{" "}
        <span className="font-semibold text-foreground">{money(stats.free)}</span>
      </p>

      <section className="mt-5">
        <SectionHeader title="Presupuesto" to="/presupuesto" />
        <div className="mt-2 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          {topBudget.map((b) => {
            const pct = (b.spent / b.planned) * 100;
            const delta = b.planned - b.spent;
            return (
              <div key={b.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  <p className="shrink-0 text-sm tabular-nums">{money(b.planned)}</p>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <ProgressBar value={pct} state={barState(pct)} className="flex-1" />
                  <span className="w-9 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                    {Math.round(pct)}%
                  </span>
                  <span
                    className={cn(
                      "w-16 shrink-0 text-right text-[11px] font-medium tabular-nums",
                      delta < 0 ? "text-danger" : "text-accent",
                    )}
                  >
                    {delta < 0 ? "−" : "+"}
                    {money(Math.abs(delta))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <SectionHeader title="Últimos movimientos" to="/movimientos" />
        <div className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {latest.length === 0 ? (
            <EmptyState
              title="Todavía no hay movimientos"
              description="Agregá tu primer movimiento para empezar."
            />
          ) : (
            latest.map((tx) => (
              <div
                key={tx.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  actions.open(tx);
                }}
              >
                <TransactionRow tx={tx} onOptions={actions.open} />
              </div>
            ))
          )}
        </div>
      </section>

      <ProgressSheet
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        progress={state.progress}
      />
      <Fab label="Nueva transacción" onClick={() => setSheetOpen(true)} />
      <TransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      {actions.element}
    </main>
  );
}

function SectionHeader({ title: t, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold">{t}</h2>
      <Link
        to={to}
        className="flex items-center gap-0.5 text-[12px] font-medium text-muted-foreground"
      >
        Ver todo
        <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </div>
  );
}
