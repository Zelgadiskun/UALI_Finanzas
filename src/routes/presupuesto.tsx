import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProgressBar, barState } from "@/components/ffos/ProgressBar";
import { EmptyState } from "@/components/ffos/EmptyState";
import { money, sameMonth } from "@/lib/ffos/format";
import { useAddBudgetMutation } from "@/lib/supabase/mutations";
import { useBudgetsQuery, useProfileQuery, useTransactionsQuery } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const GROUPS = ["Fijos", "Variables", "Discrecional", "Ahorro"];

function Presupuesto() {
  const profile = useProfileQuery();
  const inFamily = !!profile.data?.family_id;
  const budgetsQuery = useBudgetsQuery();
  const txQuery = useTransactionsQuery();
  const [addOpen, setAddOpen] = useState(false);

  // Lo gastado se deriva de los movimientos del mes por categoría — nunca
  // se guarda como columna, así no puede desincronizarse (el bug que se
  // arregló en las tarjetas del panel de Inicio).
  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txQuery.data ?? []) {
      if (t.type !== "gasto" || !sameMonth(t.date)) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return map;
  }, [txQuery.data]);

  const budgets = (budgetsQuery.data ?? []).map((b) => ({
    ...b,
    spent: spentByCategory.get(b.name) ?? 0,
  }));
  const planned = budgets.reduce((a, b) => a + b.planned, 0);
  const spent = budgets.reduce((a, b) => a + b.spent, 0);

  if (!inFamily) {
    return (
      <main className="px-4 pt-4 pb-6">
        <h1 className="text-xl font-bold">Presupuesto</h1>
        <div className="mt-4 rounded-2xl border border-border bg-card">
          <EmptyState
            title="El presupuesto es de la familia"
            description="Creá una familia o unite a una desde Más → Familia para empezar a planificar juntos."
            illustration="presupuesto"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 pt-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Presupuesto</h1>
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="text-[13px] font-semibold text-primary"
        >
          {addOpen ? "Cancelar" : "+ Agregar"}
        </button>
      </div>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        {money(spent)} gastados de {money(planned)} planificados
      </p>

      {addOpen && <AddBudgetForm onDone={() => setAddOpen(false)} />}

      {budgets.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-card">
          <EmptyState
            title="Sin presupuesto todavía"
            description="Agregá el primer rubro para empezar a planificar el mes."
            illustration="presupuesto"
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {budgets.map((b) => {
            const pct = (b.spent / b.planned) * 100;
            const delta = b.planned - b.spent;
            return (
              <article
                key={b.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-card"
              >
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
      )}
    </main>
  );
}

function AddBudgetForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState(GROUPS[0]!);
  const [planned, setPlanned] = useState("");
  const addMutation = useAddBudgetMutation();

  async function submit() {
    const value = Number(planned.replace(",", "."));
    if (!name.trim() || !value || value <= 0) {
      toast.error("Completá el nombre y un monto planificado mayor a 0.");
      return;
    }
    try {
      await addMutation.mutateAsync({ name: name.trim(), group, planned: value });
      toast.success("Rubro agregado");
      onDone();
    } catch {
      toast.error("No se pudo guardar. Probá de nuevo.");
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
          Nombre (igual a la categoría de tus gastos, ej. "Comida")
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Comida"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Grupo
          </label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Planificado
          </label>
          <input
            inputMode="decimal"
            value={planned}
            onChange={(e) => setPlanned(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0.00"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
      </div>
      <button
        onClick={() => void submit()}
        disabled={addMutation.isPending}
        className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {addMutation.isPending ? "Guardando..." : "Guardar rubro"}
      </button>
    </div>
  );
}
