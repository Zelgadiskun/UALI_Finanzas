import { createFileRoute } from "@tanstack/react-router";
import { ProgressBar, barState } from "@/components/ffos/ProgressBar";
import { useFfos } from "@/lib/ffos/store";
import { money } from "@/lib/ffos/format";
import { cn } from "@/lib/utils";

const title = "Presupuesto — FFOS Wallet";
const description =
  "Presupuesto familiar por grupos: fijos, variables, discreción, ahorro y deuda, con avance planificado contra gastado.";

export const Route = createFileRoute("/presupuesto")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Presupuesto,
});

function Presupuesto() {
  const state = useFfos();
  const planned = state.budget.reduce((a, b) => a + b.planned, 0);
  const spent = state.budget.reduce((a, b) => a + b.spent, 0);

  return (
    <main className="px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold">Presupuesto</h1>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        {money(spent)} gastados de {money(planned)} planificados
      </p>

      <div className="mt-4 space-y-3">
        {state.budget.map((b) => {
          const pct = (b.spent / b.planned) * 100;
          const delta = b.planned - b.spent;
          return (
            <article key={b.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  <p className="text-[11px] text-muted-foreground">{b.group}</p>
                </div>
                <p className="shrink-0 text-sm tabular-nums">{money(b.planned)}</p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar value={pct} state={barState(pct)} className="flex-1" />
                <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
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
            </article>
          );
        })}
      </div>
    </main>
  );
}
