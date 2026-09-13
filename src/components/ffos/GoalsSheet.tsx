import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreVertical } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { ProgressBar, barState } from "./ProgressBar";
import { ConfirmModal } from "./ConfirmModal";
import { EmptyState } from "./EmptyState";
import { money } from "@/lib/ffos/format";
import { useAddGoalMutation, useDeleteGoalMutation } from "@/lib/supabase/mutations";
import { useGoalsQuery, useTransactionsQuery } from "@/lib/supabase/queries";

type Props = { open: boolean; onClose: () => void };

export function GoalsSheet({ open, onClose }: Props) {
  const goalsQuery = useGoalsQuery();
  const txQuery = useTransactionsQuery();
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const deleteMutation = useDeleteGoalMutation();

  // Igual que budgets/deudas: "saved" nunca se guarda, se deriva de los
  // ahorros enlazados por goal_id — así aportar plata a una meta siempre
  // avanza su barra, sin un contador aparte que se pueda desincronizar.
  const savedByGoal = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txQuery.data ?? []) {
      if (t.type !== "ahorro" || !t.goalId) continue;
      map.set(t.goalId, (map.get(t.goalId) ?? 0) + t.amount);
    }
    return map;
  }, [txQuery.data]);

  const goals = (goalsQuery.data ?? []).map((g) => ({
    ...g,
    saved: savedByGoal.get(g.id) ?? 0,
  }));

  return (
    <BottomSheet open={open} onClose={onClose} title="Metas de ahorro">
      <div className="space-y-4 pb-2">
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="text-[13px] font-semibold text-primary"
        >
          {addOpen ? "Cancelar" : "+ Nueva meta"}
        </button>

        {addOpen && <AddGoalForm onDone={() => setAddOpen(false)} />}

        {goals.length === 0 ? (
          <EmptyState
            title="Sin metas todavía"
            description="Creá una meta y sumale ahorros desde el formulario de movimientos."
            illustration="meta"
          />
        ) : (
          <ul className="space-y-3">
            {goals.map((g) => {
              const pct = (g.saved / g.target) * 100;
              return (
                <li key={g.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{g.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {money(g.saved)} de {money(g.target)}
                        {g.dueDate ? ` · ${g.dueDate}` : ""}
                      </p>
                    </div>
                    <button
                      aria-label={`Opciones de ${g.name}`}
                      onClick={() => setDeleting({ id: g.id, name: g.name })}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                    >
                      <MoreVertical className="size-4" strokeWidth={1.75} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <ProgressBar
                      value={pct}
                      state={barState(Math.min(pct, 100))}
                      className="flex-1"
                    />
                    <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                      {Math.round(pct)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={!!deleting}
        title={`¿Eliminar "${deleting?.name}"?`}
        description="Los ahorros ya registrados quedan en el historial, pero dejan de contar para esta meta."
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onError: () => toast.error("No se pudo eliminar."),
            });
          }
          setDeleting(null);
        }}
      />
    </BottomSheet>
  );
}

function AddGoalForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [dueDate, setDueDate] = useState("");
  const addMutation = useAddGoalMutation();

  async function submit() {
    const value = Number(target.replace(",", "."));
    if (!name.trim() || !value || value <= 0) {
      toast.error("Completá el nombre y un monto objetivo mayor a 0.");
      return;
    }
    try {
      await addMutation.mutateAsync({
        name: name.trim(),
        target: value,
        dueDate: dueDate || null,
      });
      toast.success("Meta creada");
      onDone();
    } catch {
      toast.error("No se pudo guardar. Probá de nuevo.");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Vacaciones"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Monto objetivo
          </label>
          <input
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0.00"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Fecha límite (opcional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
      </div>
      <button
        onClick={() => void submit()}
        disabled={addMutation.isPending}
        className="btn-3d h-11 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {addMutation.isPending ? "Guardando…" : "Guardar meta"}
      </button>
    </div>
  );
}
