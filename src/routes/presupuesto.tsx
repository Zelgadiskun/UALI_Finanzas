import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MoreVertical, Users } from "lucide-react";
import { ProgressBar, barState } from "@/components/ffos/ProgressBar";
import { EmptyState } from "@/components/ffos/EmptyState";
import { ConfirmModal } from "@/components/ffos/ConfirmModal";
import { CategorySpendChart } from "@/components/ffos/CategorySpendChart";
import { LessonLink } from "@/components/ffos/LessonLink";
import { money, sameMonth } from "@/lib/ffos/format";
import {
  useAddBudgetMutation,
  useDeleteBudgetAllocationMutation,
  useDeleteBudgetMutation,
  useSetBudgetAllocationMutation,
  useUpdateBudgetMutation,
} from "@/lib/supabase/mutations";
import {
  useBudgetAllocationsQuery,
  useBudgetsQuery,
  useCurrentUserId,
  useFamilyMembersQuery,
  useProfileQuery,
  useTransactionsQuery,
  type BudgetAllocationRow,
} from "@/lib/supabase/queries";
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
  const allocationsQuery = useBudgetAllocationsQuery();
  const membersQuery = useFamilyMembersQuery();
  const currentUserId = useCurrentUserId();
  const [addOpen, setAddOpen] = useState(false);

  // Lo gastado se deriva de los movimientos del mes por categoría — nunca
  // se guarda como columna, así no puede desincronizarse (el bug que se
  // arregló en las tarjetas del panel de Inicio). El desglose por miembro
  // usa la misma fuente, solo agrupada también por user_id.
  const { spentByCategory, spentByCategoryAndUser } = useMemo(() => {
    const byCategory = new Map<string, number>();
    const byCategoryAndUser = new Map<string, Map<string, number>>();
    for (const t of txQuery.data ?? []) {
      if (t.type !== "gasto" || !sameMonth(t.date)) continue;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
      const perUser = byCategoryAndUser.get(t.category) ?? new Map<string, number>();
      perUser.set(t.userId, (perUser.get(t.userId) ?? 0) + t.amount);
      byCategoryAndUser.set(t.category, perUser);
    }
    return { spentByCategory: byCategory, spentByCategoryAndUser: byCategoryAndUser };
  }, [txQuery.data]);

  const allocationsByBudget = useMemo(() => {
    const map = new Map<string, BudgetAllocationRow[]>();
    for (const a of allocationsQuery.data ?? []) {
      const list = map.get(a.budgetId) ?? [];
      list.push(a);
      map.set(a.budgetId, list);
    }
    return map;
  }, [allocationsQuery.data]);

  const budgets = (budgetsQuery.data ?? []).map((b) => ({
    ...b,
    spent: spentByCategory.get(b.name) ?? 0,
  }));
  const planned = budgets.reduce((a, b) => a + b.planned, 0);
  const spent = budgets.reduce((a, b) => a + b.spent, 0);

  // La primera lección del sistema dice "asigná cada peso antes de
  // gastarlo" — pero nada en esta pantalla mostraba si de verdad se estaba
  // cumpliendo esa regla. Este es el indicador central del método 0-base,
  // se deriva de lo mismo que ya calcula "Capacidad libre" en Inicio.
  const monthIncome = useMemo(() => {
    return (txQuery.data ?? [])
      .filter((t) => t.type === "ingreso" && sameMonth(t.date))
      .reduce((a, t) => a + t.amount, 0);
  }, [txQuery.data]);
  const unassigned = monthIncome - planned;

  if (!inFamily) {
    return (
      <main className="px-4 pt-4 pb-6">
        <h1 className="font-display text-xl font-bold">Presupuesto</h1>
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
        <h1 className="font-display text-xl font-bold">Presupuesto</h1>
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

      {monthIncome > 0 && (
        <div
          className={cn(
            "mt-3 rounded-xl px-3 py-2.5 text-[13px] font-medium",
            unassigned > 0 && "bg-warning-soft text-[color:var(--foreground)]",
            unassigned === 0 && "bg-accent-soft text-accent",
            unassigned < 0 && "bg-danger-soft text-danger",
          )}
        >
          {unassigned > 0 && <>Te quedan {money(unassigned)} sin asignar este mes.</>}
          {unassigned === 0 && <>Presupuesto 0-base completo — asignaste cada peso.</>}
          {unassigned < 0 && (
            <>Planificaste {money(Math.abs(unassigned))} más de lo que entra este mes.</>
          )}{" "}
          <LessonLink slug="intro" label="¿Qué es 0-base?" />
        </div>
      )}

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
        <>
          <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
            <h2 className="mb-1 text-sm font-semibold">Gasto por rubro este mes</h2>
            <CategorySpendChart spentByCategory={spentByCategory} />
          </div>
          <div className="mt-4 space-y-3">
            {budgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                isAdmin={!!currentUserId && b.createdBy === currentUserId}
                allocations={allocationsByBudget.get(b.id) ?? []}
                members={membersQuery.data ?? []}
                spentByUser={spentByCategoryAndUser.get(b.name) ?? new Map()}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function BudgetCard({
  budget,
  isAdmin,
  allocations,
  members,
  spentByUser,
}: {
  budget: {
    id: string;
    name: string;
    group: string;
    planned: number;
    spent: number;
    createdBy: string | null;
  };
  isAdmin: boolean;
  allocations: BudgetAllocationRow[];
  members: { id: string; display_name: string }[];
  spentByUser: Map<string, number>;
}) {
  const adminName = !isAdmin
    ? (members.find((m) => m.id === budget.createdBy)?.display_name ?? null)
    : null;
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [planned, setPlanned] = useState(String(budget.planned));
  const updateMutation = useUpdateBudgetMutation();
  const deleteMutation = useDeleteBudgetMutation();
  const pct = (budget.spent / budget.planned) * 100;
  const delta = budget.planned - budget.spent;

  async function saveEdit() {
    const value = Number(planned.replace(",", "."));
    if (!value || value <= 0) {
      toast.error("El monto planificado debe ser mayor a 0.");
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: budget.id, planned: value });
      setEditing(false);
    } catch {
      toast.error("No se pudo guardar. Probá de nuevo.");
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{budget.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {budget.group}
            {adminName && ` · Administra: ${adminName}`}
          </p>
        </div>
        {editing ? (
          <input
            autoFocus
            inputMode="decimal"
            value={planned}
            onChange={(e) => setPlanned(e.target.value.replace(/[^\d.,]/g, ""))}
            className="h-8 w-24 rounded-lg border border-border bg-background px-2 text-right text-sm tabular-nums"
          />
        ) : (
          <p className="shrink-0 text-sm tabular-nums">{money(budget.planned)}</p>
        )}
        {isAdmin && (
          <button
            aria-label={`Opciones de ${budget.name}`}
            onClick={() => setEditing((v) => !v)}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <MoreVertical className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => void saveEdit()}
            disabled={updateMutation.isPending}
            className="btn-3d h-9 flex-1 rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground disabled:opacity-60"
          >
            Guardar
          </button>
          <button
            onClick={() => setDeleting(true)}
            className="h-9 flex-1 rounded-lg border border-border text-[13px] font-medium text-danger"
          >
            Eliminar
          </button>
        </div>
      ) : (
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
      )}

      {allocations.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {allocations.map((a) => {
            const member = members.find((m) => m.id === a.userId);
            const memberSpent = spentByUser.get(a.userId) ?? 0;
            const memberPct = a.allocated > 0 ? (memberSpent / a.allocated) * 100 : 0;
            return (
              <li key={a.id} className="flex items-center gap-2 text-[12px]">
                <span className="w-20 shrink-0 truncate text-muted-foreground">
                  {member?.display_name ?? "…"}
                </span>
                <ProgressBar
                  value={memberPct}
                  state={barState(memberPct)}
                  height={6}
                  className="flex-1"
                />
                <span className="w-24 shrink-0 text-right tabular-nums text-muted-foreground">
                  {money(memberSpent)} / {money(a.allocated)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {isAdmin && (
        <button
          onClick={() => setSharing((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-primary"
        >
          <Users className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {sharing ? "Ocultar reparto" : "Repartir entre miembros"}
        </button>
      )}

      {sharing && (
        <AllocationEditor budgetId={budget.id} members={members} allocations={allocations} />
      )}

      <ConfirmModal
        open={deleting}
        title={`¿Eliminar "${budget.name}"?`}
        description="Se borra el rubro del presupuesto. Los movimientos ya registrados no se tocan."
        onCancel={() => setDeleting(false)}
        onConfirm={() => {
          deleteMutation.mutate(budget.id, { onError: () => toast.error("No se pudo eliminar.") });
          setDeleting(false);
        }}
      />
    </article>
  );
}

function AllocationEditor({
  budgetId,
  members,
  allocations,
}: {
  budgetId: string;
  members: { id: string; display_name: string }[];
  allocations: BudgetAllocationRow[];
}) {
  const setMutation = useSetBudgetAllocationMutation();
  const deleteMutation = useDeleteBudgetAllocationMutation();

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-secondary p-3">
      <p className="text-[11px] text-muted-foreground">
        Cuánto de este presupuesto le corresponde a cada quien. Quien lo supere, te avisa a vos.
      </p>
      {members.map((m) => {
        const existing = allocations.find((a) => a.userId === m.id);
        return (
          <AllocationRow
            key={m.id}
            name={m.display_name}
            initial={existing?.allocated ?? 0}
            onSave={(value) => {
              if (value <= 0) {
                if (existing) deleteMutation.mutate(existing.id);
                return;
              }
              setMutation.mutate(
                { budgetId, userId: m.id, allocated: value },
                { onError: () => toast.error("No se pudo guardar el reparto.") },
              );
            }}
          />
        );
      })}
    </div>
  );
}

function AllocationRow({
  name,
  initial,
  onSave,
}: {
  name: string;
  initial: number;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState(initial > 0 ? String(initial) : "");

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 truncate text-[13px]">{name}</span>
      <input
        inputMode="decimal"
        value={value}
        placeholder="0.00"
        onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ""))}
        onBlur={() => onSave(Number(value.replace(",", ".")) || 0)}
        className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-right text-sm tabular-nums"
      />
    </div>
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
        className="btn-3d h-11 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {addMutation.isPending ? "Guardando…" : "Guardar rubro"}
      </button>
    </div>
  );
}
