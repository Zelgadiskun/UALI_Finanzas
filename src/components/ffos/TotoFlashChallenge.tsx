import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  Lock,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Timer,
  XCircle,
  Zap,
} from "lucide-react";
import { TotoCharacter } from "@/components/ffos/characters/Characters";
import {
  DAILY_DILEMMAS,
  DailyChallengeState,
  getDilemmaForDate,
  getTodayKey,
  loadDailyChallengeState,
  saveDailyChallengeState,
} from "@/lib/ffos/dailyChallengeData";
import { useUserPoints } from "@/lib/ffos/points";
import { useDebtsQuery } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

export function TotoFlashChallenge() {
  const { xp, ffosTokens, streak, awardPoints } = useUserPoints();
  const debtsQuery = useDebtsQuery();

  // Calcular si el usuario tiene Estrés Financiero activo por deudas
  const totalDebtBalance = useMemo(() => {
    if (!debtsQuery.data) return 0;
    return debtsQuery.data.reduce((acc, d) => acc + (d.principal || 0), 0);
  }, [debtsQuery.data]);

  const hasFinancialStress = totalDebtBalance > 0 || (debtsQuery.data && debtsQuery.data.length > 0);

  // Tiempo límite: 20s si hay estrés por deudas, 30s en condición normal
  const maxSeconds = hasFinancialStress ? 20 : 30;

  // Estado persistido del desafío de hoy
  const [state, setState] = useState<DailyChallengeState>(() => loadDailyChallengeState());
  const [timeLeft, setTimeLeft] = useState<number>(maxSeconds);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [abandonWarning, setAbandonWarning] = useState<boolean>(false);

  const dilemma = useMemo(() => getDilemmaForDate(state.date), [state.date]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Detección Anti-Exploit al montar:
  // Si el usuario arrancó el reto ("in_progress") y recargó o cerró la app para salvarse
  useEffect(() => {
    const saved = loadDailyChallengeState();
    if (saved.status === "in_progress") {
      // Registrar fallo por abandono
      const abandonedState: DailyChallengeState = {
        ...saved,
        status: "abandoned",
        finishedAt: Date.now(),
        xpEarned: 10,
        tokensEarned: 15,
      };
      saveDailyChallengeState(abandonedState);
      setState(abandonedState);
      setAbandonWarning(true);

      // Otorgar consolación de error
      awardPoints({
        xpToAdd: 10,
        tokensToAdd: 15,
        reason: "Desafío de Toto (Fallo por abandono involuntario)",
      });

      toast.error("⚡ ¡Chispazo de Toto por abandono!", {
        description:
          "Cerrar la prueba a mitad de camino cuenta como fallo táctico. Recibes compensación básica.",
      });
    }
  }, []);

  // Lógica del Temporizador cuando está activo
  useEffect(() => {
    if (state.status === "in_progress") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status]);

  // Manejar expiración de tiempo (indecisión)
  async function handleTimeout() {
    setIsFrozen(true);
    const timeoutState: DailyChallengeState = {
      ...state,
      status: "completed_timeout",
      finishedAt: Date.now(),
      xpEarned: 10,
      tokensEarned: 15,
      hadStressPenalty: hasFinancialStress,
    };
    saveDailyChallengeState(timeoutState);
    setState(timeoutState);

    await awardPoints({
      xpToAdd: 10,
      tokensToAdd: 15,
      reason: "Desafío de Toto (Tiempo agotado - Indecisión)",
    });

    toast.error("❄️ ¡Tiempo agotado! Pantalla congelada", {
      description: "En finanzas, la indecisión prolongada cuesta dinero real. +15 FFOS consolación.",
    });
  }

  // Iniciar el desafío
  function handleStartChallenge() {
    setTimeLeft(maxSeconds);
    setIsFrozen(false);
    setAbandonWarning(false);

    const newState: DailyChallengeState = {
      ...state,
      status: "in_progress",
      startedAt: Date.now(),
      hadStressPenalty: hasFinancialStress,
    };
    saveDailyChallengeState(newState);
    setState(newState);
  }

  // Seleccionar respuesta A o B
  async function handleSelectOption(optionId: "A" | "B") {
    if (state.status !== "in_progress" || isFrozen) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const chosenOption = dilemma.options.find((o) => o.id === optionId);
    const isCleanWin = chosenOption?.isCorrect === true;

    if (isCleanWin) {
      const victoryState: DailyChallengeState = {
        ...state,
        status: "completed_clean",
        selectedOption: optionId,
        finishedAt: Date.now(),
        xpEarned: 25,
        tokensEarned: 50,
        hadStressPenalty: hasFinancialStress,
      };
      saveDailyChallengeState(victoryState);
      setState(victoryState);

      await awardPoints({
        xpToAdd: 25,
        tokensToAdd: 50,
        reason: "Desafío Flash de Toto (Victoria Limpia)",
      });

      toast.success("🎯 ¡Victoria Limpia! +50 FFOS y +25 XP", {
        description: dilemma.totoCleanDiagnosis,
      });
    } else {
      const errorState: DailyChallengeState = {
        ...state,
        status: "completed_error",
        selectedOption: optionId,
        finishedAt: Date.now(),
        xpEarned: 10,
        tokensEarned: 15,
        hadStressPenalty: hasFinancialStress,
      };
      saveDailyChallengeState(errorState);
      setState(errorState);

      await awardPoints({
        xpToAdd: 10,
        tokensToAdd: 15,
        reason: "Desafío Flash de Toto (Aprendizaje por error)",
      });

      toast.error("⚠️ Fallo táctico en el dilema", {
        description: dilemma.totoErrorDiagnosis,
      });
    }
  }

  // Porcentaje del temporizador derritiéndose
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / maxSeconds) * 100));

  // Color de la barra derritiéndose (ámbar -> naranja lava -> rojo crítico)
  const timerBarColor =
    progressPercent > 50
      ? "from-amber-400 via-amber-500 to-orange-500"
      : progressPercent > 25
        ? "from-orange-500 via-rose-500 to-red-500 animate-pulse"
        : "from-red-600 via-rose-700 to-red-900 animate-pulse";

  const isCompleted =
    state.status === "completed_clean" ||
    state.status === "completed_error" ||
    state.status === "completed_timeout" ||
    state.status === "abandoned";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border transition-all duration-300 p-4.5 shadow-sm mb-4",
        isFrozen
          ? "border-cyan-400/80 bg-slate-950/95 ring-2 ring-cyan-400/40"
          : state.status === "in_progress"
            ? "border-amber-500/80 ring-2 ring-amber-400/20"
            : "border-border/80",
      )}
    >
      {/* Efecto de escarcha / hielo si la pantalla se congela por tiempo agotado */}
      {isFrozen && (
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/40 via-sky-950/30 to-blue-950/50 backdrop-blur-[1px] pointer-events-none z-10 flex flex-col items-center justify-start pt-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[11px] font-black uppercase tracking-wider shadow-lg animate-pulse">
            <span>❄️ PANTALLA CONGELADA — COSTO POR INDECISIÓN ❄️</span>
          </div>
        </div>
      )}

      {/* Header del Desafío Flash */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60 relative z-20">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                Desafío Flash de Toto
              </h3>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                Diario
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Micro-dilema de juicio financiero rápido (1 intento/día)
            </p>
          </div>
        </div>

        {/* Recompensa máxima */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
            <span className="size-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[9px] font-black">
              F
            </span>
            +50 FFOS • +25 XP
          </span>
        </div>
      </div>

      {/* Banner de Estrés Financiero Activo si el usuario tiene deudas */}
      {hasFinancialStress && state.status !== "completed_clean" && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300">
          <ShieldAlert className="size-4 text-rose-400 shrink-0" />
          <div className="leading-tight">
            <span className="font-bold text-rose-200">⚠️ Estrés Financiero Activo: </span>
            Tienes pasivos pendientes ({debtsQuery.data?.length} deudas registradas). Tu tiempo de
            reacción mental se reduce de 30s a{" "}
            <span className="font-black text-rose-300 underline">20 segundos</span>.
          </div>
        </div>
      )}

      {/* Alerta de penalización por abandono previo si ocurrió */}
      {abandonWarning && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="size-4 text-amber-400 shrink-0" />
          <span>
            Se detectó abandono en el reto anterior. Conforme a las reglas anti-exploit, se asignó
            la compensación de aprendizaje (+10 XP, +15 FFOS).
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* ESTADO 1: PREPARADO PARA INICIAR (not_started)            */}
      {/* ========================================================= */}
      {state.status === "not_started" && (
        <div className="pt-3.5">
          <div className="flex items-center gap-3 bg-secondary/30 p-3.5 rounded-xl border border-border/60">
            <div className="size-16 shrink-0 flex items-center justify-center bg-blue-900/20 rounded-xl border border-blue-500/20">
              <TotoCharacter className="size-14" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-foreground">
                ¿Listo para el juicio rápido de Toto?
              </h4>
              <p className="text-xs text-muted-foreground font-medium mt-0.5 leading-snug">
                Un micro-dilema de la vida real. Tienes {maxSeconds}s para decidir sin titubear. Un
                solo intento hoy.
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-amber-300">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> {maxSeconds} segundos
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Award className="size-3.5" /> +50 FFOS por acierto
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartChallenge}
            className="w-full mt-3.5 min-h-[46px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-98"
          >
            <Play className="size-4 fill-slate-950" />
            <span>Comenzar Desafío ({maxSeconds}s)</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* ESTADO 2: EN CURSO (in_progress)                         */}
      {/* ========================================================= */}
      {state.status === "in_progress" && (
        <div className="pt-3.5">
          {/* Barra de presión que se "derrite visualmente" */}
          <div className="mb-3">
            <div className="flex justify-between items-center text-xs font-black mb-1">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Flame className="size-4 text-orange-400 animate-bounce" />
                <span>El Reloj Presión de Toto</span>
              </span>
              <span
                className={cn(
                  "font-mono px-2 py-0.5 rounded text-xs font-black",
                  timeLeft <= 5
                    ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                    : "bg-amber-400/20 text-amber-300",
                )}
              >
                {timeLeft}s restantes
              </span>
            </div>

            {/* Track de la barra */}
            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-border/80 relative">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all duration-1000 shadow-sm",
                  timerBarColor,
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Micro-Dilema Táctico */}
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/80 mb-3.5">
            <span className="text-[10px] font-black tracking-wider uppercase text-amber-400 mb-1 block">
              DILEMA TÁCTICO DEL DÍA:
            </span>
            <p className="text-sm font-extrabold text-foreground leading-snug">
              {dilemma.situation}
            </p>
          </div>

          {/* Opciones A y B */}
          <div className="space-y-2.5">
            {dilemma.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(opt.id)}
                className="w-full p-3.5 rounded-xl border border-border/80 bg-card hover:bg-secondary/70 text-left transition active:scale-[0.99] flex items-start gap-3 group min-h-[56px]"
              >
                <span className="size-7 rounded-lg bg-secondary text-foreground font-black text-xs flex items-center justify-center shrink-0 border border-border group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                  {opt.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-extrabold text-foreground leading-snug">
                    {opt.text}
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-bold text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded">
                    {opt.tag}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ESTADO 3: COMPLETADO / EXPIRADO (Pantalla de Veredicto)   */}
      {/* ========================================================= */}
      {isCompleted && (
        <div className="pt-3.5 space-y-3">
          {/* Card de Veredicto de Toto */}
          <div
            className={cn(
              "p-4 rounded-xl border flex items-start gap-3.5",
              state.status === "completed_clean"
                ? "bg-emerald-950/20 border-emerald-500/50 text-emerald-300"
                : state.status === "completed_timeout"
                  ? "bg-cyan-950/30 border-cyan-500/60 text-cyan-200"
                  : "bg-rose-950/20 border-rose-500/50 text-rose-300",
            )}
          >
            <div className="size-14 shrink-0 flex items-center justify-center bg-slate-900/60 rounded-xl border border-border/60">
              <TotoCharacter className="size-12" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {state.status === "completed_clean" ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase text-emerald-300">
                      ¡VICTORIA LIMPIA!
                    </span>
                  </>
                ) : state.status === "completed_timeout" ? (
                  <>
                    <Clock className="size-4 text-cyan-300" />
                    <span className="text-xs font-black uppercase text-cyan-300">
                      COSTO POR INDECISIÓN (TIEMPO)
                    </span>
                  </>
                ) : state.status === "abandoned" ? (
                  <>
                    <AlertTriangle className="size-4 text-amber-400" />
                    <span className="text-xs font-black uppercase text-amber-300">
                      FALLO POR ABANDONO
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-rose-400" />
                    <span className="text-xs font-black uppercase text-rose-300">
                      APRENDIZAJE POR ERROR
                    </span>
                  </>
                )}
              </div>

              {/* Diagnóstico de Toto en 2 líneas */}
              <p className="text-xs font-bold leading-relaxed text-foreground">
                {state.status === "completed_clean"
                  ? dilemma.totoCleanDiagnosis
                  : state.status === "completed_timeout"
                    ? "Toto: En finanzas, no tomar una decisión a tiempo es dejar que las circunstancias o los bancos decidan por ti. ¡La indecisión tiene un precio real!"
                    : dilemma.totoErrorDiagnosis}
              </p>

              {/* Recompensa obtenida */}
              <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-xs font-black">
                <span className="text-muted-foreground font-semibold text-[11px]">
                  Recompensa registrada:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-black">+{state.tokensEarned} FFOS</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-teal-400 font-black">+{state.xpEarned} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Micro-dilema y opción elegida */}
          <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 text-xs">
            <span className="text-[10px] font-bold text-muted-foreground block mb-1">
              Dilema evaluado:
            </span>
            <p className="font-bold text-foreground mb-2 leading-tight">{dilemma.situation}</p>

            <div className="space-y-1.5 pt-1">
              {dilemma.options.map((opt) => (
                <div
                  key={opt.id}
                  className={cn(
                    "p-2 rounded-lg border text-xs flex items-center justify-between font-semibold",
                    opt.isCorrect
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-secondary/40 border-border/60 text-muted-foreground",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="font-black">Opción {opt.id}:</span>
                    <span>{opt.text}</span>
                  </span>
                  {opt.isCorrect && (
                    <span className="text-[10px] font-black text-emerald-400 uppercase">
                      ✓ Correcta
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Indicador de siguiente reto */}
          <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5" />
              <span>Desafío completado por hoy. Vuelve mañana para +50 FFOS.</span>
            </span>
            <span className="text-amber-400 font-mono">00:00 UTC</span>
          </div>
        </div>
      )}
    </section>
  );
}
