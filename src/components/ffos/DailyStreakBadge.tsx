import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  ChevronRight,
  Plus,
  Award,
  Calendar,
  X,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { useUserPoints, getLastStreakDate } from "@/lib/ffos/points";
import { useTransactionsQuery } from "@/lib/supabase/queries";
import { openGlobalTransactionSheet } from "@/lib/ffos/globalTxSheet";
import { cn } from "@/lib/utils";

// Síntesis de sonido sutil y gratificante con Web Audio API
function playStreakCelebrationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  } catch {
    // Audio no soportado o bloqueado por navegador
  }
}

interface DailyStreakBadgeProps {
  className?: string;
  variant?: "badge" | "compact" | "pill";
  showLabel?: boolean;
  onOpenNewTx?: () => void;
}

/**
 * Hook para calcular los datos de racha semanal y si el usuario ha registrado hoy.
 */
export function useDailyStreakData() {
  const { userId, streak, bestStreak, ffosTokens } = useUserPoints();
  const txQuery = useTransactionsQuery(userId);
  const transactions = useMemo(() => txQuery.data ?? [], [txQuery.data]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Verificar si hay movimientos registrados hoy (gastos, ingresos, ahorros o pagos)
  const hasLoggedToday = useMemo(() => {
    const lastDate = getLastStreakDate(userId);
    if (lastDate === todayStr) return true;
    return transactions.some((t) => {
      const d = t.date?.slice(0, 10);
      return d === todayStr;
    });
  }, [transactions, todayStr, userId]);

  // Generar los 7 días de la semana actual (Lunes a Domingo)
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes...
    // Ajustar a Lunes como día 0
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const days = [];
    const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    // Conjunto de fechas únicas donde hubo transacciones
    const txDates = new Set(transactions.map((t) => t.date?.slice(0, 10)).filter(Boolean));
    if (hasLoggedToday) {
      txDates.add(todayStr);
    }

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const isToday = iso === todayStr;
      const isFuture = iso > todayStr;
      const isCompleted = txDates.has(iso);

      days.push({
        label: DAY_LABELS[i],
        dayNumber: d.getDate(),
        dateStr: iso,
        isToday,
        isFuture,
        isCompleted,
      });
    }

    return days;
  }, [transactions, hasLoggedToday, todayStr]);

  return {
    userId,
    streak: Math.max(1, streak),
    bestStreak: Math.max(streak, bestStreak),
    hasLoggedToday,
    weekDays,
    ffosTokens,
  };
}

/**
 * Componente Visual Badge de Racha Diaria con animación en tiempo real
 * al registrar transacciones y apertura del modal de detalle.
 */
export function DailyStreakBadge({
  className,
  variant = "badge",
  showLabel = true,
  onOpenNewTx,
}: DailyStreakBadgeProps) {
  const { streak, bestStreak, hasLoggedToday, weekDays, ffosTokens } = useDailyStreakData();
  const [modalOpen, setModalOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [justIncremented, setJustIncremented] = useState(false);

  // Escuchar cuando el usuario registra una transacción
  useEffect(() => {
    const handleStreakEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        streak: number;
        isNewTransaction?: boolean;
      }>;
      if (customEvent.detail?.isNewTransaction) {
        setIsCelebrating(true);
        setJustIncremented(true);
        playStreakCelebrationChime();

        const timer = setTimeout(() => {
          setIsCelebrating(false);
          setJustIncremented(false);
        }, 4000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("uali-streak-updated", handleStreakEvent);
    return () => {
      window.removeEventListener("uali-streak-updated", handleStreakEvent);
    };
  }, []);

  const handleOpenTx = useCallback(() => {
    setModalOpen(false);
    if (onOpenNewTx) {
      onOpenNewTx();
    } else {
      openGlobalTransactionSheet();
    }
  }, [onOpenNewTx]);

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          title={
            hasLoggedToday
              ? `Racha de ${streak} días activa. Registrado hoy.`
              : `¡Racha de ${streak} días en riesgo! Registra un gasto hoy.`
          }
          className={cn(
            "relative flex items-center gap-1 h-9 px-2.5 rounded-xl font-black text-xs transition active:scale-95 shadow-xs cursor-pointer select-none",
            hasLoggedToday
              ? "bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
              : "bg-amber-950/20 border border-amber-500/60 text-amber-400 hover:bg-amber-950/30 ring-1 ring-amber-400/40 animate-pulse",
            isCelebrating &&
              "scale-105 ring-2 ring-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]",
            className,
          )}
        >
          <Flame
            className={cn(
              "size-4 transition-transform",
              hasLoggedToday
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]"
                : "text-amber-400 animate-bounce",
              isCelebrating && "scale-125 text-yellow-300 fill-yellow-300",
            )}
          />
          <span className="font-extrabold">{streak}d</span>

          {hasLoggedToday ? (
            <span className="size-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
          ) : (
            <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
          )}

          {isCelebrating && (
            <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black shadow-md animate-bounce">
              +1 día!
            </span>
          )}
        </button>

        <DailyStreakModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          streak={streak}
          bestStreak={bestStreak}
          hasLoggedToday={hasLoggedToday}
          weekDays={weekDays}
          ffosTokens={ffosTokens}
          onOpenNewTx={handleOpenTx}
        />
      </>
    );
  }

  // Variant "pill" o "badge" estándar
  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        title={
          hasLoggedToday
            ? `Racha de ${streak} días activa. Registrado hoy.`
            : `¡Racha de ${streak} días en riesgo! Registra un gasto hoy.`
        }
        className={cn(
          "relative inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-xs cursor-pointer select-none group",
          hasLoggedToday
            ? "bg-card border border-amber-500/40 text-amber-300 hover:border-amber-400 hover:bg-amber-500/10"
            : "bg-card border-2 border-amber-500/70 text-amber-300 hover:border-amber-400",
          isCelebrating &&
            "scale-105 border-yellow-400 ring-2 ring-yellow-400/50 shadow-[0_0_20px_rgba(245,158,11,0.6)] bg-amber-500/20",
          className,
        )}
      >
        {/* Ícono de llama animado */}
        <div className="relative flex items-center justify-center">
          <Flame
            className={cn(
              "size-4 transition-transform duration-300 group-hover:scale-110",
              hasLoggedToday
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]"
                : "text-amber-400 animate-pulse",
              isCelebrating && "scale-125 text-yellow-300 fill-yellow-300 rotate-[-8deg]",
            )}
          />
          {hasLoggedToday ? (
            <span className="absolute -bottom-1 -right-1 size-2 rounded-full bg-emerald-400 border border-slate-900" />
          ) : (
            <span className="absolute -bottom-1 -right-1 size-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </div>

        {/* Contador numérico de racha */}
        <span className="font-extrabold tracking-tight">
          {streak} {showLabel ? (streak === 1 ? "día" : "días") : "d"}
        </span>

        {/* Indicador de estado */}
        {hasLoggedToday ? (
          <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
            Al día ✓
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded-md animate-pulse">
            Pendiente
          </span>
        )}

        {/* Toast / burst al registrar */}
        {justIncremented && (
          <span className="absolute -top-3 -right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[10px] font-black shadow-lg animate-bounce flex items-center gap-0.5 z-10">
            <Sparkles className="size-2.5" />
            <span>+1 día!</span>
          </span>
        )}
      </button>

      {/* Modal interactivo de Racha Diaria */}
      <DailyStreakModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        streak={streak}
        bestStreak={bestStreak}
        hasLoggedToday={hasLoggedToday}
        weekDays={weekDays}
        ffosTokens={ffosTokens}
        onOpenNewTx={handleOpenTx}
      />
    </>
  );
}

/**
 * Tarjeta completa / Banner de Racha Diaria para incrustar en el panel de Presupuesto
 * o en la pantalla de inicio para fomentar el registro constante de gastos.
 */
export function DailyStreakCard({
  className,
  onOpenNewTx,
}: {
  className?: string;
  onOpenNewTx?: () => void;
}) {
  const { streak, bestStreak, hasLoggedToday, weekDays, ffosTokens } = useDailyStreakData();
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenTx = useCallback(() => {
    if (onOpenNewTx) {
      onOpenNewTx();
    } else {
      openGlobalTransactionSheet();
    }
  }, [onOpenNewTx]);

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-card border border-border/80 p-3.5 sm:p-4 shadow-card transition-all",
          hasLoggedToday
            ? "hover:border-amber-500/50"
            : "border-amber-500/50 bg-gradient-to-br from-amber-950/20 to-card",
          className,
        )}
      >
        {/* Fondo decorativo sutil */}
        <div className="absolute -right-4 -bottom-4 size-28 opacity-5 pointer-events-none text-amber-400 select-none">
          <Flame className="size-full fill-current" />
        </div>

        <div className="relative z-10 space-y-3">
          {/* Cabecera de la tarjeta */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform shadow-xs",
                  hasLoggedToday
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                    : "bg-amber-500/20 border-amber-500/60 text-amber-300 animate-pulse",
                )}
              >
                <Flame
                  className={cn(
                    "size-5",
                    hasLoggedToday
                      ? "fill-amber-400 text-amber-400"
                      : "text-amber-300 animate-bounce",
                  )}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Hábito de Presupuesto
                  </span>
                  {hasLoggedToday ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="size-2.5" />
                      <span>Al día</span>
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                      <Clock className="size-2.5" />
                      <span>Pendiente hoy</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-black text-foreground truncate">
                  Racha Diaria: <span className="text-amber-400">{streak} días seguidos</span>
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition flex items-center gap-0.5 shrink-0"
            >
              <span>Ver retos</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          {/* Calendario visual semanal (7 días) */}
          <div className="bg-secondary/60 rounded-xl p-2 border border-border/70">
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDays.map((d) => (
                <div
                  key={d.dateStr}
                  className={cn(
                    "flex flex-col items-center py-1 rounded-lg transition-all",
                    d.isToday && "ring-1 ring-amber-400/60 bg-amber-500/10",
                  )}
                >
                  <span className="text-[10px] font-bold text-muted-foreground">{d.label}</span>
                  <div
                    className={cn(
                      "size-6 mt-0.5 rounded-full flex items-center justify-center text-xs font-black transition-all",
                      d.isCompleted
                        ? "bg-amber-400 text-slate-950 shadow-xs"
                        : d.isToday
                          ? "bg-secondary text-amber-400 border border-amber-400/50 animate-pulse"
                          : d.isFuture
                            ? "text-muted-foreground/40 border border-dashed border-border"
                            : "text-muted-foreground/60 bg-muted/30",
                    )}
                  >
                    {d.isCompleted ? (
                      <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                    ) : d.isToday ? (
                      <Clock className="size-3" />
                    ) : (
                      <span>{d.dayNumber}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Barra de acción rápida */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-muted-foreground leading-tight">
              {hasLoggedToday ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  Movimiento de hoy guardado. ¡Sigue así!
                </span>
              ) : (
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <Clock className="size-3" />
                  Registra un gasto o ingreso para extender tu racha a{" "}
                  <strong>{streak + 1} días</strong>
                </span>
              )}
            </p>

            {!hasLoggedToday && (
              <button
                type="button"
                onClick={handleOpenTx}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F6BE22] hover:bg-amber-300 text-slate-900 font-black text-xs shadow-xs transition active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="size-3.5 stroke-[3]" />
                <span>Registrar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <DailyStreakModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        streak={streak}
        bestStreak={bestStreak}
        hasLoggedToday={hasLoggedToday}
        weekDays={weekDays}
        ffosTokens={ffosTokens}
        onOpenNewTx={handleOpenTx}
      />
    </>
  );
}

/**
 * Modal interactivo para visualizar los detalles de la racha diaria,
 * multiplicador de recompensas y consejos de consistencia presupuestaria.
 */
function DailyStreakModal({
  open,
  onClose,
  streak,
  bestStreak,
  hasLoggedToday,
  weekDays,
  ffosTokens,
  onOpenNewTx,
}: {
  open: boolean;
  onClose: () => void;
  streak: number;
  bestStreak: number;
  hasLoggedToday: boolean;
  weekDays: ReturnType<typeof useDailyStreakData>["weekDays"];
  ffosTokens: number;
  onOpenNewTx: () => void;
}) {
  if (!open) return null;

  const milestones = [
    { days: 3, label: "Hábito Iniciado", reward: "+25 FFOS", icon: "🥉" },
    { days: 7, label: "Semana Impecable", reward: "+50 FFOS", icon: "🥈" },
    { days: 14, label: "Maestro del Control", reward: "+100 FFOS", icon: "🥇" },
    { days: 30, label: "Finanzas Blindadas", reward: "+250 FFOS", icon: "💎" },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative z-10 w-full max-w-md bg-card border border-border/80 rounded-t-[28px] sm:rounded-3xl shadow-2xl p-5 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition active:scale-90"
        >
          <X className="size-4" />
        </button>

        {/* Encabezado con Llama y Racha Principal */}
        <div className="text-center pt-2 pb-3 space-y-2">
          <div className="relative inline-flex items-center justify-center size-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/40 shadow-inner mx-auto">
            <Flame className="size-11 fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-pulse" />
            {hasLoggedToday && (
              <span className="absolute -bottom-1 -right-1 size-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-card shadow-sm">
                <CheckCircle2 className="size-3.5 stroke-[3]" />
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {streak} {streak === 1 ? "Día de Racha" : "Días de Racha"}
            </h2>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              {hasLoggedToday ? (
                <span className="text-emerald-400 font-bold">
                  ¡Racha activa hoy! Movimientos registrados con éxito.
                </span>
              ) : (
                <span className="text-amber-300 font-bold">
                  ¡Racha en riesgo! Registra un movimiento para no perderla.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Métricas clave en 3 columnas */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-secondary/60 rounded-2xl border border-border/80 mb-4 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Actual
            </span>
            <p className="text-sm font-black text-amber-400">{streak} días</p>
          </div>
          <div className="space-y-0.5 border-x border-border/70">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Récord
            </span>
            <p className="text-sm font-black text-foreground">{bestStreak} días</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Multiplicador
            </span>
            <p className="text-sm font-black text-teal-400">+{streak * 5} FFOS</p>
          </div>
        </div>

        {/* Calendario semanal de registro */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-amber-400" />
              <span>Esta semana</span>
            </span>
            <span className="text-[11px] text-muted-foreground font-semibold">
              {weekDays.filter((d) => d.isCompleted).length} de 7 días activos
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 bg-secondary/40 p-2 rounded-2xl border border-border/70">
            {weekDays.map((d) => (
              <div
                key={d.dateStr}
                className={cn(
                  "flex flex-col items-center py-1.5 rounded-xl transition-all",
                  d.isToday && "bg-amber-500/15 ring-1 ring-amber-400/70",
                )}
              >
                <span className="text-[10px] font-bold text-muted-foreground mb-1">{d.label}</span>
                <div
                  className={cn(
                    "size-7 rounded-full flex items-center justify-center text-xs font-black shadow-xs",
                    d.isCompleted
                      ? "bg-amber-400 text-slate-950"
                      : d.isToday
                        ? "bg-amber-500/30 text-amber-300 border border-amber-400 animate-pulse"
                        : d.isFuture
                          ? "border border-dashed border-border text-muted-foreground/40"
                          : "bg-muted/40 text-muted-foreground/60",
                  )}
                >
                  {d.isCompleted ? (
                    <CheckCircle2 className="size-4 stroke-[3]" />
                  ) : d.isToday ? (
                    <Clock className="size-3.5" />
                  ) : (
                    <span>{d.dayNumber}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ¿Por qué importa registrar a diario? */}
        <div className="rounded-2xl bg-teal-500/10 border border-teal-500/30 p-3 mb-4 flex items-start gap-2.5">
          <ShieldCheck className="size-4 text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-bold text-foreground">El poder del registro diario</p>
            <p className="text-[11px] mt-0.5 leading-relaxed">
              Registrar tus gastos al instante elimina fugas invisibles de dinero y evita que
              excedas tus sobres de presupuesto mensuales.
            </p>
          </div>
        </div>

        {/* Hitos de Racha */}
        <div className="space-y-2 mb-5">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Hitos de Consistencia
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {milestones.map((m) => {
              const unlocked = streak >= m.days;
              return (
                <div
                  key={m.days}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-xl border transition-all",
                    unlocked
                      ? "bg-amber-500/10 border-amber-500/40 text-foreground"
                      : "bg-secondary/40 border-border/70 text-muted-foreground opacity-60",
                  )}
                >
                  <span className="text-base">{m.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold truncate">{m.label}</p>
                    <p className="text-[10px] font-bold text-amber-400">
                      {m.reward} {unlocked && "✓"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón de acción */}
        <div className="space-y-2">
          {!hasLoggedToday ? (
            <button
              type="button"
              onClick={onOpenNewTx}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>Registrar movimiento de hoy (+10 XP)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-sm border border-border transition active:scale-[0.99] cursor-pointer"
            >
              ¡Racha al día! Volver al presupuesto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
