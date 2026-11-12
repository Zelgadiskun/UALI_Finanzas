import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Compass,
  Flame,
  PiggyBank,
  Plus,
  Shield,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { NidoCharacter, TotoCharacter } from "@/components/ffos/characters/Characters";
import { TransactionSheet } from "@/components/ffos/TransactionSheet";
import { MoneyCalculatorInput } from "@/components/ui/MoneyCalculatorInput";
import { evaluateMathExpression } from "@/lib/ffos/calculator";
import { money } from "@/lib/ffos/format";
import {
  getAppliedTemplates,
  markTemplateApplied,
  SIMULATOR_TEMPLATES,
} from "@/lib/ffos/simulatorTemplates";
import { useUserPoints } from "@/lib/ffos/points";
import { useAddGoalMutation, useDeleteGoalMutation } from "@/lib/supabase/mutations";
import {
  useGoalsQuery,
  useProgressQuery,
  useTransactionsQuery,
} from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const title = "Ualí Finanzas — Ahorro con Nido & Metas";
const description =
  "Ahorro protegido y metas financieras con Nido (cerdito guardián) y plantillas del Laboratorio de Simulacros.";

export const Route = createFileRoute("/ahorro")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AhorroRoute,
});

export function AhorroRoute() {
  const progressQuery = useProgressQuery();
  const txQuery = useTransactionsQuery();
  const goalsQuery = useGoalsQuery();
  const addGoalMutation = useAddGoalMutation();
  const deleteGoalMutation = useDeleteGoalMutation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDefaultValues, setSheetDefaultValues] = useState<{
    type?: "gasto" | "ingreso" | "ahorro" | "pago_deuda";
    category?: string;
    note?: string;
  } | null>(null);
  const [newGoalModal, setNewGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [triviaSelected, setTriviaSelected] = useState<number | null>(null);
  const [shieldTemplateDone, setShieldTemplateDone] = useState(
    () => !!getAppliedTemplates().emergency_shield_3m,
  );

  const transactions = useMemo(() => txQuery.data ?? [], [txQuery.data]);
  const { ffosTokens, streak } = useUserPoints();
  void progressQuery;

  const totalSaved = useMemo(() => {
    return transactions.filter((t) => t.type === "ahorro").reduce((a, t) => a + t.amount, 0);
  }, [transactions]);

  const savedThisMonth = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions
      .filter((t) => t.type === "ahorro" && t.date.startsWith(currentMonth))
      .reduce((a, t) => a + t.amount, 0);
  }, [transactions]);

  const goals = useMemo(() => {
    const dbGoals = goalsQuery.data ?? [];
    if (dbGoals.length > 0) return dbGoals;
    return [
      {
        id: "goal-emergency-fund",
        name: "Fondo de Paz (3 meses base)",
        target: 1200,
        dueDate: null,
      },
      {
        id: "goal-study-trip",
        name: "Meta Personal o Familiar",
        target: 600,
        dueDate: null,
      },
    ];
  }, [goalsQuery.data]);

  const primaryGoal = goals[0];
  const primaryTarget = primaryGoal?.target ?? 1200;
  const primarySaved = Math.min(
    primaryTarget,
    totalSaved > 0 ? Math.min(totalSaved, primaryTarget) : 450,
  );
  const rawPct = primaryTarget > 0 ? (primarySaved / primaryTarget) * 100 : 0;
  const primaryPct = Math.min(100, Math.round(Number.isNaN(rawPct) ? 0 : rawPct));
  const primaryRemaining = Math.max(0, primaryTarget - primarySaved);

  async function handleCreateGoal() {
    const mathVal = evaluateMathExpression(newGoalTarget);
    const targetVal = mathVal !== null ? mathVal : Number(newGoalTarget.replace(",", "."));
    if (!newGoalName.trim() || !targetVal || targetVal <= 0) {
      toast.error("Completa el nombre y una meta mayor a 0.");
      return;
    }
    try {
      await addGoalMutation.mutateAsync({
        name: newGoalName.trim(),
        target: targetVal,
        dueDate: null,
      });
      toast.success("Meta agregada con éxito.");
      setNewGoalModal(false);
      setNewGoalName("");
      setNewGoalTarget("");
    } catch {
      toast.error("No se pudo guardar la meta.");
    }
  }

  async function handleApplyEmergencyTemplate() {
    try {
      await addGoalMutation.mutateAsync({
        name: "Fondo de Paz (3 meses base)",
        target: 1800,
        dueDate: null,
      });
      markTemplateApplied("emergency_shield_3m");
      setShieldTemplateDone(true);
      toast.success("Plantilla del Simulador aplicada", {
        description: "Nido creó tu meta de Fondo de Paz por $1,800.",
      });
    } catch {
      toast.error("No se pudo crear la meta en tu cuenta.");
    }
  }

  function handleTriviaSelect(index: number) {
    if (triviaSelected !== null) return;
    setTriviaSelected(index);
    if (index === 1) {
      toast.success("Observación acertada con Toto", {
        description: "Separar tu reserva el día 1 evita que los gastos variables la absorban.",
      });
    } else {
      toast.info("Buen intento", {
        description: "Dejar el dinero en la cuenta corriente suele mezclarlo con el gasto diario.",
      });
    }
  }

  return (
    <main className="px-4 sm:px-6 pt-4 pb-28 md:pb-12 max-w-4xl mx-auto w-full space-y-5">
      {/* Cabecera */}
      <section className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Volver al panel principal"
            className="size-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-extrabold text-foreground">
              Metas y Fondo de Paz
            </h1>
            <p className="text-xs text-muted-foreground">
              Resguardo protegido con Nido (Cerdito Guardián)
            </p>
          </div>
        </div>

        <div className="flex items-center h-9 px-3 rounded-xl bg-card border border-border text-xs font-extrabold divide-x divide-border">
          <div className="flex items-center gap-1 pr-2.5 text-[#E06D53]">
            <Flame className="size-3.5 fill-[#E06D53]" />
            <span>{streak}d</span>
          </div>
          <div className="flex items-center gap-1 pl-2.5 text-primary">
            <Sparkles className="size-3.5" />
            <span>{ffosTokens}</span>
          </div>
        </div>
      </section>

      {/* Tarjeta Principal con Nido Cerdito */}
      <section className="rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <NidoCharacter className="w-22 h-22 shrink-0" />
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-soft text-primary">
                Escudo Activo • Nido
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
                {money(totalSaved > 0 ? totalSaved : primarySaved)}
              </h2>
              <p className="text-xs text-muted-foreground">
                Aportado este mes:{" "}
                <strong className="text-primary tabular-nums">{money(savedThisMonth)}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSheetDefaultValues({
                type: "ahorro",
                category: primaryGoal?.name || "Fondo de Paz",
                note: "Aporte protegido a Nido",
              });
              setSheetOpen(true);
            }}
            className="btn-tactile-terra px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="size-4 stroke-[2.8]" />
            <span>Aportar a Nido</span>
          </button>
        </div>

        {/* Meta Principal */}
        {primaryGoal && (
          <div className="p-4 rounded-2xl bg-secondary/60 border border-border space-y-2.5">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="flex items-center gap-1.5 text-foreground">
                <Target className="size-4 text-primary" />
                {primaryGoal.name}
              </span>
              <span className="text-primary tabular-nums">{primaryPct}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${primaryPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-muted-foreground tabular-nums">
              <span>Protegido: {money(primarySaved)}</span>
              <span>Faltan: {money(primaryRemaining)}</span>
            </div>
          </div>
        )}
      </section>

      {/* Puente con el Simulador de Toto */}
      <section className="rounded-3xl bg-card border-2 border-primary/25 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="size-11 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Shield className="size-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
              {SIMULATOR_TEMPLATES.emergency_shield_3m.title}
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {SIMULATOR_TEMPLATES.emergency_shield_3m.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleApplyEmergencyTemplate()}
            disabled={addGoalMutation.isPending}
            className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold btn-3d cursor-pointer"
          >
            {shieldTemplateDone ? "Crear otra meta base" : "Aplicar meta 3 meses"}
          </button>
          <Link
            to="/aprender"
            className="px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold flex items-center gap-1 hover:bg-secondary/80"
          >
            <Compass className="size-3.5 text-primary" />
            <span>Practicar</span>
          </Link>
        </div>
      </section>

      {/* Listado de Metas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-foreground">Tus Metas Activas</h2>
          <button
            type="button"
            onClick={() => setNewGoalModal(true)}
            className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-extrabold text-foreground flex items-center gap-1 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Nueva meta</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {goals.map((g, idx) => {
            const savedForGoal = idx === 0 ? primarySaved : Math.min(g.target, Math.max(0, totalSaved - primarySaved));
            const pct = g.target > 0 ? Math.min(100, Math.round((savedForGoal / g.target) * 100)) : 0;
            const isDbGoal = !g.id.startsWith("goal-");

            return (
              <div
                key={g.id}
                className="rounded-2xl bg-card border border-border p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <PiggyBank className="size-4 text-primary shrink-0" />
                      <h3 className="text-sm font-extrabold text-foreground truncate">{g.name}</h3>
                    </div>
                    {isDbGoal && (
                      <button
                        type="button"
                        onClick={() => void deleteGoalMutation.mutateAsync(g.id)}
                        aria-label={`Eliminar meta ${g.name}`}
                        className="text-muted-foreground hover:text-[#E06D53] p-1 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-muted-foreground tabular-nums">
                    <span>{money(savedForGoal)}</span>
                    <span>Meta: {money(g.target)} ({pct}%)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSheetDefaultValues({
                      type: "ahorro",
                      category: g.name,
                      note: `Aporte a meta: ${g.name}`,
                    });
                    setSheetOpen(true);
                  }}
                  className="w-full py-2 rounded-xl bg-secondary hover:bg-primary-soft text-foreground hover:text-primary text-xs font-extrabold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <span>Aportar a esta meta</span>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Caso Rápido con Toto (Camaleón Estratega) */}
      <section className="rounded-3xl bg-card border border-border p-5 space-y-3">
        <div className="flex items-center gap-3">
          <TotoCharacter className="w-12 h-12 shrink-0" />
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E06D53]">
              Caso Express con Toto
            </span>
            <h3 className="font-display text-base font-extrabold text-foreground">
              ¿Dónde conviene guardar tu Fondo de Paz el día de cobro?
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            "Dejarlo en la misma tarjeta de gastos diarios para ahorrar lo que sobre.",
            "Separarlo el día 1 en una meta o bolsillo aparte fuera de la cuenta diaria.",
          ].map((opt, idx) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleTriviaSelect(idx)}
              className={cn(
                "text-left p-3 rounded-xl border text-xs font-bold transition cursor-pointer",
                triviaSelected === idx
                  ? idx === 1
                    ? "bg-primary-soft border-primary text-foreground"
                    : "bg-warning-soft border-[#E06D53] text-foreground"
                  : "bg-secondary/50 border-border hover:border-primary",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>

      {/* Modal Nueva Meta */}
      {newGoalModal && (
        <div className="fixed inset-0 z-50 bg-[#131B2A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">Nueva Meta con Nido</h3>
              <button
                type="button"
                onClick={() => setNewGoalModal(false)}
                className="p-1.5 rounded-xl bg-secondary text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Nombre de la meta
                </label>
                <input
                  type="text"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="Ej. Fondo de Paz, Cámara nueva..."
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Monto objetivo (USD)
                </label>
                <MoneyCalculatorInput
                  value={newGoalTarget}
                  onChange={setNewGoalTarget}
                  placeholder="600"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleCreateGoal()}
                disabled={addGoalMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold btn-3d cursor-pointer"
              >
                Guardar Meta
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetDefaultValues(null);
        }}
        defaultValues={sheetDefaultValues}
      />
    </main>
  );
}
