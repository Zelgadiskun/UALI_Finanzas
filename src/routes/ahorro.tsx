import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Flame,
  Info,
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
import { money } from "@/lib/ffos/format";
import { levelInfo } from "@/lib/ffos/gamification";
import { useUserPoints } from "@/lib/ffos/points";
import { useAddGoalMutation, useDeleteGoalMutation } from "@/lib/supabase/mutations";
import {
  useGoalsQuery,
  useProfileQuery,
  useProgressQuery,
  useTransactionsQuery,
} from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const title = "UALI Finanzas — Ahorro con Nido & Metas";
const description =
  "Ahorro protegido y metas financieras con Guardián Nido: fondo de emergencia, viaje de estudios y desafíos de Toto.";

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
  const profile = useProfileQuery();
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

  const transactions = useMemo(() => txQuery.data ?? [], [txQuery.data]);
  const progress = progressQuery.data;
  const { ffosTokens, xp: xpCurrent, streak } = useUserPoints();

  // Total ahorrado en el sistema
  const totalSaved = useMemo(() => {
    return transactions.filter((t) => t.type === "ahorro").reduce((a, t) => a + t.amount, 0);
  }, [transactions]);

  // Ahorrado este mes
  const savedThisMonth = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions
      .filter((t) => t.type === "ahorro" && t.date.startsWith(currentMonth))
      .reduce((a, t) => a + t.amount, 0);
  }, [transactions]);

  // Metas configuradas (de BD o valores por defecto para experiencia guiada)
  const goals = useMemo(() => {
    const dbGoals = goalsQuery.data ?? [];
    if (dbGoals.length > 0) return dbGoals;
    return [
      {
        id: "goal-study-trip",
        name: "Viaje de estudios",
        target: 1000,
        dueDate: null,
      },
      {
        id: "goal-emergency-fund",
        name: "Fondo Colchón de Emergencia",
        target: 600,
        dueDate: null,
      },
    ];
  }, [goalsQuery.data]);

  const primaryGoal = goals[0];
  const secondaryGoal = goals[1] ?? null;

  // Asignamos montos basados en el total ahorrado o valores demo si recién empieza
  const primarySaved = Math.min(
    primaryGoal?.target ?? 1000,
    totalSaved > 0 ? Math.min(totalSaved, primaryGoal?.target ?? 1000) : 850,
  );
  const primaryTarget = primaryGoal?.target ?? 1000;
  const primaryPct = Math.min(100, Math.round((primarySaved / primaryTarget) * 100));
  const primaryRemaining = Math.max(0, primaryTarget - primarySaved);

  const secondarySaved = secondaryGoal
    ? Math.min(
        secondaryGoal.target,
        totalSaved > primarySaved ? totalSaved - primarySaved : Math.min(secondaryGoal.target, 400),
      )
    : 400;
  const secondaryTarget = secondaryGoal?.target ?? 600;
  const secondaryPct = Math.min(100, Math.round((secondarySaved / secondaryTarget) * 100));

  async function handleCreateGoal() {
    const targetVal = Number(newGoalTarget.replace(",", "."));
    if (!newGoalName.trim() || !targetVal || targetVal <= 0) {
      toast.error("Completá el nombre y una meta mayor a 0.");
      return;
    }
    try {
      await addGoalMutation.mutateAsync({
        name: newGoalName.trim(),
        target: targetVal,
        dueDate: null,
      });
      toast.success("¡Meta agregada con éxito!");
      setNewGoalModal(false);
      setNewGoalName("");
      setNewGoalTarget("");
    } catch {
      toast.error("No se pudo guardar la meta.");
    }
  }

  function handleTriviaSelect(index: number) {
    if (triviaSelected !== null) return;
    setTriviaSelected(index);
    if (index === 1) {
      toast.success("¡Elección Correcta de Toto! 🪙", {
        description: "+50 FFOS acreditados. El interés compuesto vence la inflación.",
      });
    } else {
      toast.error("Atención a la inflación", {
        description: "Tener el dinero quieto pierde poder de compra con el tiempo.",
      });
    }
  }

  return (
    <main className="px-4 pt-3 pb-24 max-w-md mx-auto w-full space-y-5">
      {/* 1. Header Superior & Racha */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <Link
            to="/"
            aria-label="Volver atrás"
            className="size-9 rounded-full bg-card border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
          >
            <ArrowLeft className="size-4.5" />
          </Link>

          {/* Racha Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300">
            <Flame className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold tracking-wide">{streak} días de constancia</span>
          </div>

          {/* User XP / Coins Tag */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-200">
            <span className="size-2.5 rounded-full bg-[#F59E0B] inline-block" />
            <span className="text-xs font-bold">{ffosTokens} FFOS</span>
          </div>
        </div>

        {/* Título y Subtítulo */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Ahorro con Nido
              <span className="text-[#2EC4B6] text-lg">●</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tus reservas protegidas y metas activas
            </p>
          </div>
          <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 bg-[#2EC4B6]/15 text-teal-400 rounded-lg border border-[#2EC4B6]/30">
            {goals.length} Metas activas
          </span>
        </div>
      </section>

      {/* 2. Sección Guardián Nido (Overview) */}
      <section className="relative bg-card border border-border/80 rounded-3xl p-5 shadow-card overflow-hidden">
        {/* Glow de fondo y chispas */}
        <div className="absolute -top-12 -right-12 size-40 bg-[#2EC4B6]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-4 right-6 text-amber-400 text-sm animate-pulse pointer-events-none">
          ✦
        </div>
        <div className="absolute bottom-6 left-5 text-amber-400/60 text-xs pointer-events-none">
          ✦
        </div>

        {/* Header con Bocadillo de diálogo + SVG de Nido */}
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <NidoCharacter className="size-22" />
          </div>

          {/* Bocadillo de Nido */}
          <div className="flex-1 bg-secondary/80 border border-[#2EC4B6]/40 rounded-2xl p-3 relative shadow-inner">
            <div className="absolute -left-2 top-5 size-0 border-t-6 border-t-transparent border-r-[8px] border-r-[#2EC4B6]/40 border-b-6 border-b-transparent" />
            <p className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>Guardián Nido</span>
              <span className="size-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
            </p>
            <p className="text-xs leading-relaxed text-foreground">
              ¡Cuidando tus sueños! Estás a sólo{" "}
              <strong className="font-bold text-amber-300 underline decoration-amber-400/50 underline-offset-2">
                {money(primaryRemaining)}
              </strong>{" "}
              de completar tu meta de {primaryGoal?.name ?? "ahorro"}.
            </p>
          </div>
        </div>

        {/* Tarjeta de Meta Principal */}
        {primaryGoal && (
          <div className="mt-5 bg-secondary/40 border border-border/80 rounded-2xl p-4 transition-all hover:border-[#2EC4B6]/50">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] tracking-wider uppercase font-semibold text-muted-foreground">
                  Meta principal
                </span>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  {primaryGoal.name}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#2EC4B6]/20 text-teal-400 border border-[#2EC4B6]/30">
                    {primaryPct}%
                  </span>
                </h3>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-foreground tracking-tight">
                  {money(primarySaved)}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {" "}
                  / {money(primaryTarget)}
                </span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-3.5 space-y-1.5">
              <div className="w-full bg-secondary rounded-full h-3 overflow-hidden p-0.5 border border-border/60">
                <div
                  className="bg-gradient-to-r from-[#2EC4B6] via-teal-400 to-[#F59E0B] h-full rounded-full transition-all duration-700 relative"
                  style={{ width: `${primaryPct}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 rounded-full blur-[1px]" />
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground px-0.5">
                <span>
                  Ahorrado este mes:{" "}
                  <strong className="text-foreground">+{money(savedThisMonth || 210)}</strong>
                </span>
                <span className="text-amber-300 font-medium">
                  {primaryRemaining > 0
                    ? `Faltan ${money(primaryRemaining)}`
                    : "¡Meta alcanzada! 🎉"}
                </span>
              </div>
            </div>

            {/* Botón CTA Aportar */}
            <button
              type="button"
              onClick={() => {
                setSheetDefaultValues({
                  type: "ahorro",
                  category: "Fondo de emergencia",
                  note: `Aporte a meta: ${primaryGoal?.name ?? "Ahorro Nido"}`,
                });
                setSheetOpen(true);
              }}
              className="mt-4 w-full py-2.5 px-4 bg-[#2EC4B6] hover:bg-[#20A39E] active:scale-[0.99] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#2EC4B6]/20"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>Aportar a esta meta</span>
            </button>
          </div>
        )}

        {/* Tarjeta de Meta Secundaria (Fondo de Emergencia) */}
        {secondaryGoal && (
          <div className="mt-3 bg-secondary/30 border border-border/70 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                <Shield className="size-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">{secondaryGoal.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#7952B3] h-full rounded-full transition-all"
                      style={{ width: `${secondaryPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {secondaryPct}%
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 pl-2">
              <p className="text-xs font-bold text-foreground">
                {money(secondarySaved)}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">
                  / {money(secondaryTarget)}
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setSheetDefaultValues({
                    type: "ahorro",
                    category: "Fondo de emergencia",
                    note: `Aporte a meta: ${secondaryGoal.name}`,
                  });
                  setSheetOpen(true);
                }}
                className="text-[10px] text-teal-400 hover:underline font-semibold"
              >
                + Sumar
              </button>
            </div>
          </div>
        )}

        {/* Botón para crear nueva meta */}
        <button
          type="button"
          onClick={() => setNewGoalModal(true)}
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-border/80 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition"
        >
          <Plus className="size-3.5" />
          <span>Crear otra meta de ahorro</span>
        </button>
      </section>

      {/* 3. Desafío de Toto (Decisión del Día) */}
      <section className="bg-card border border-border/80 rounded-3xl p-5 shadow-card relative">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="size-11 relative shrink-0">
              <TotoCharacter className="size-11" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  TOTO • EL DINERO
                </span>
                <span className="text-muted-foreground text-xs">|</span>
                <span className="text-[10px] text-muted-foreground font-medium">Decisiones</span>
              </div>
              <h2 className="text-sm font-bold text-foreground">
                El desafío de Toto (Decisión del día)
              </h2>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs border border-amber-400/30 shrink-0">
            +50 FFOS
          </span>
        </div>

        {/* Pregunta */}
        <div className="mt-4">
          <p className="text-xs md:text-sm font-medium text-foreground leading-snug">
            "Si te sobra un saldo este mes, ¿qué opción te da mayor rendimiento real a largo plazo
            para tus ahorros?"
          </p>
        </div>

        {/* Opciones Interactivas */}
        <div className="mt-3.5 space-y-2.5">
          <button
            type="button"
            onClick={() => handleTriviaSelect(0)}
            className={cn(
              "w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-colors active:scale-[0.99]",
              triviaSelected === 0
                ? "border-danger bg-danger/10 text-danger"
                : "border-border bg-secondary/50 hover:bg-secondary text-muted-foreground",
            )}
          >
            <span className="size-6 rounded-full border border-border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              A
            </span>
            <div className="flex-1">
              <p className="text-xs font-normal">
                Dejarlo quieto en cuenta corriente para tener liquidez total sin riesgo.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTriviaSelect(1)}
            className={cn(
              "w-full text-left p-3.5 rounded-xl border-2 flex items-start gap-3 transition-colors shadow-xs active:scale-[0.99]",
              triviaSelected === 1
                ? "border-primary bg-primary/10 text-primary-foreground"
                : "border-blue-500/80 bg-blue-950/30 text-foreground",
            )}
          >
            <span className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 shadow-xs">
              B
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">
                Aportarlo al fondo de inversión compuesto para vencer a la inflación.
              </p>
              <span className="inline-block mt-1 text-[10px] text-teal-400 font-medium tracking-wide">
                ✓ Elección recomendada por Toto
              </span>
            </div>
          </button>
        </div>

        {/* Las 2 caras de Toto */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2.5 text-muted-foreground">
          <Info className="size-4 text-amber-400 shrink-0" />
          <p className="text-[11px] leading-tight italic">
            <span className="font-semibold text-foreground not-italic">Las 2 caras de Toto:</span>{" "}
            La seguridad inmediata se siente cómoda, pero la inversión continua protege tu poder
            adquisitivo futuro.
          </p>
        </div>
      </section>

      {/* Modal / Sheet para crear nueva meta */}
      {newGoalModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">Nueva Meta de Ahorro</h3>
              <button
                type="button"
                onClick={() => setNewGoalModal(false)}
                className="size-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Nombre de la meta
                </label>
                <input
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="Ej. Fondo de vacaciones, Laptop nueva"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Monto objetivo ($ USD)
                </label>
                <input
                  inputMode="decimal"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="0.00"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>

              <button
                type="button"
                disabled={addGoalMutation.isPending}
                onClick={() => void handleCreateGoal()}
                className="mt-2 w-full h-11 rounded-xl bg-[#2EC4B6] text-slate-950 text-sm font-bold shadow-md hover:bg-[#20A39E] transition"
              >
                {addGoalMutation.isPending ? "Guardando…" : "Crear Meta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hoja para Aportar fondos / Registrar Ahorro */}
      <TransactionSheet
        open={sheetOpen}
        defaultValues={sheetDefaultValues}
        onClose={() => setSheetOpen(false)}
      />
    </main>
  );
}
