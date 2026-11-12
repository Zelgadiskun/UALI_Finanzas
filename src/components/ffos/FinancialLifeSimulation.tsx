import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Shield,
  Wallet,
  HeartPulse,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass,
  Trophy,
  Flame,
  ArrowLeft,
  PieChart,
  Home,
} from "lucide-react";
import {
  SIMULATION_ROLES,
  ROLE_DILEMMAS,
  initializeSimulation,
  applyDilemmaChoice,
  evaluateSimulationOutcome,
  type SimulationRoleKey,
  type SimulationState,
  type DilemmaChoice,
} from "@/lib/ffos/financialLifeEngine";
import { money } from "@/lib/ffos/format";
import { useSound } from "@/hooks/useSound";
import { APP_ROUTES } from "@/lib/ffos/appRoutes";
import { cn } from "@/lib/utils";

interface FinancialLifeSimulationProps {
  userId?: string;
  onRewardClaimed?: (xp: number) => void;
  onNavigateTab?: (tab: "mapa" | "retos" | "inventario") => void;
}

export function FinancialLifeSimulation({
  userId,
  onRewardClaimed,
  onNavigateTab,
}: FinancialLifeSimulationProps) {
  const [selectedRoleKey, setSelectedRoleKey] = useState<SimulationRoleKey | null>(null);
  const [gameState, setGameState] = useState<SimulationState | null>(null);
  const [lastChoice, setLastChoice] = useState<DilemmaChoice | null>(null);
  const [showingDebrief, setShowingDebrief] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const { playSuccessChord, triggerConfetti } = useSound();

  // Iniciar partida con un rol seleccionado
  const handleStartRole = (roleKey: SimulationRoleKey) => {
    setSelectedRoleKey(roleKey);
    const initial = initializeSimulation(roleKey);
    setGameState(initial);
    setLastChoice(null);
    setShowingDebrief(false);
    setRewardClaimed(false);
  };

  // Tomar una decisión rápida
  const handleSelectChoice = (choice: DilemmaChoice) => {
    if (!gameState) return;
    setLastChoice(choice);
    setShowingDebrief(true);
  };

  // Continuar a la siguiente ronda tras leer el debriefing didáctico
  const handleProceedNextRound = () => {
    if (!gameState || !lastChoice) return;
    const nextState = applyDilemmaChoice(gameState, lastChoice);
    setGameState(nextState);
    setShowingDebrief(false);
    setLastChoice(null);

    if (nextState.isComplete) {
      playSuccessChord();
      triggerConfetti();
    }
  };

  // Reclamar XP de la simulación
  const handleClaimReward = () => {
    if (!gameState || rewardClaimed) return;
    setRewardClaimed(true);
    triggerConfetti();
    if (onRewardClaimed) {
      onRewardClaimed(gameState.xpEarned);
    }
  };

  // Reiniciar simulador
  const handleResetSimulation = () => {
    setSelectedRoleKey(null);
    setGameState(null);
    setLastChoice(null);
    setShowingDebrief(false);
    setRewardClaimed(false);
  };

  // =========================================================================
  // VISTA 1: SELECCIÓN DE ROL DE VIDA FINANCIERA
  // =========================================================================
  if (!gameState) {
    return (
      <div className="space-y-6">
        {/* Encabezado en calma y sin apiñamiento */}
        <div className="text-center space-y-2 max-w-lg mx-auto pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold tracking-wide">
            <Compass className="size-3.5 text-purple-400" />
            <span>Simulador de Vida Financiera UALÍ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Aprende por Experimentación sin Arriesgar tu Dinero Real
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Elige un rol cotidiano y toma 5 decisiones rápidas. Comprueba cómo cada elección impacta
            tu flujo de caja, tu reserva Nido y tus niveles de estrés.
          </p>
        </div>

        {/* Tarjetas de Selección de Roles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(SIMULATION_ROLES) as SimulationRoleKey[]).map((key) => {
            const role = SIMULATION_ROLES[key];
            return (
              <div
                key={role.id}
                className="group relative rounded-3xl bg-slate-900/60 border border-slate-800/80 p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:border-teal-500/40 hover:bg-slate-900/90 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                      {role.avatarEmoji}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                      5 Rondas
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-100 group-hover:text-teal-300 transition-colors">
                      {role.title}
                    </h3>
                    <p className="text-xs font-semibold text-teal-400 mt-0.5">{role.tagline}</p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  {/* Parámetros iniciales macro */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Flujo Líquido</span>
                      <span className="font-mono font-bold text-slate-200">
                        {money(role.initialCashflow)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Escudo Nido</span>
                      <span className="font-mono font-bold text-teal-300">
                        {money(role.initialShield)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => handleStartRole(role.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-98 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Comenzar Simulación</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Puente de Conexión Rápida hacia Inicio y Presupuesto */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-teal-400" />
            <span>
              Tus decisiones en este simulador no modifican tus cuentas bancarias ni balances
              reales.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={APP_ROUTES.PRESUPUESTO}
              className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
            >
              <PieChart className="size-3" />
              <span>Ver mi Presupuesto Real</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA 2: RESULTADOS Y RETROALIMENTACIÓN DE FIN DE SIMULACIÓN
  // =========================================================================
  if (gameState.isComplete) {
    const outcome = evaluateSimulationOutcome(gameState);
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-2">
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-7 backdrop-blur-md shadow-2xl text-center space-y-5">
          <div className="grid size-16 mx-auto place-items-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-3xl shadow-inner">
            🏆
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Simulación Concluida • {gameState.role.title}
            </span>
            <h2 className="text-2xl font-black text-slate-100">{outcome.archetype}</h2>
            <div className="pt-2">
              <span
                className={cn(
                  "inline-block px-3 py-1 rounded-full text-xs font-bold border",
                  outcome.statusColor,
                )}
              >
                Estado Clínico: {outcome.mentalHealthStatus}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed px-2">
            {outcome.summary}
          </p>

          {/* Tres Métricas Finales */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Liquidez Final
              </span>
              <span className="text-sm sm:text-base font-black text-slate-100 font-mono">
                {money(gameState.cashflow)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Escudo Nido
              </span>
              <span className="text-sm sm:text-base font-black text-teal-300 font-mono">
                {money(gameState.shield)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Cortisol Final
              </span>
              <span className="text-sm sm:text-base font-black text-amber-300 font-mono">
                {gameState.cortisol}%
              </span>
            </div>
          </div>

          {/* Consejo Terapéutico UALÍ */}
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-left text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold">
              <Sparkles className="size-3.5" />
              <span>Aprendizaje Práctico para la Vida Real:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{outcome.recommendation}</p>
          </div>

          {/* Recompensa de Experiencia */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Flame className="size-4 text-amber-400" />
              <span>Experiencia adquirida en el juego:</span>
              <span className="font-bold text-amber-300 font-mono">+{gameState.xpEarned} XP</span>
            </div>

            <button
              type="button"
              disabled={rewardClaimed}
              onClick={handleClaimReward}
              className={cn(
                "py-2 px-4 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1.5 cursor-pointer",
                rewardClaimed
                  ? "bg-slate-800 text-slate-400 border border-slate-700/60"
                  : "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md",
              )}
            >
              {rewardClaimed ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span>XP Reclamada</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 text-slate-950" />
                  <span>Reclamar +{gameState.xpEarned} XP</span>
                </>
              )}
            </button>
          </div>

          {/* Botones de Acción de Retorno y Rejugabilidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleResetSimulation}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700/80"
            >
              <RotateCcw className="size-3.5" />
              <span>Probar con Otro Rol</span>
            </button>

            <Link
              to={APP_ROUTES.PRESUPUESTO}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-98 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center"
            >
              <PieChart className="size-3.5" />
              <span>Aplicar en mi Presupuesto</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA 3: PARTIDA EN CURSO (1 DILEMA A LA VEZ + 3 INDICADORES MACRO)
  // =========================================================================
  const dilemmas = ROLE_DILEMMAS[gameState.role.id];
  const currentDilemma = dilemmas[gameState.roundIndex];

  return (
    <div className="max-w-xl mx-auto space-y-5 pt-1">
      {/* Barra de Navegación del Simulador */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={handleResetSimulation}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Cambiar Rol</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
          <span>{gameState.role.avatarEmoji}</span>
          <span className="truncate">{gameState.role.title}</span>
          <span className="text-slate-500">•</span>
          <span className="text-purple-400 font-mono font-bold">
            Ronda {gameState.roundIndex + 1} de {dilemmas.length}
          </span>
        </div>
      </div>

      {/* REGLA DE LOS TRES INDICADORES MACRO (Cero Sobrecarga Cognitiva) */}
      <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md backdrop-blur-md">
        {/* Indicador 1: Flujo Líquido (Toto) */}
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-0.5">
            <span className="truncate">Flujo Toto</span>
            <Wallet className="size-3 text-slate-400" />
          </div>
          <span className="text-sm sm:text-base font-black text-slate-100 font-mono">
            {money(gameState.cashflow)}
          </span>
        </div>

        {/* Indicador 2: Escudo de Reserva (Nido) */}
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <div className="flex items-center justify-between text-[10px] text-teal-400 font-semibold mb-0.5">
            <span className="truncate">Escudo Nido</span>
            <Shield className="size-3 text-teal-400" />
          </div>
          <span className="text-sm sm:text-base font-black text-teal-300 font-mono">
            {money(gameState.shield)}
          </span>
        </div>

        {/* Indicador 3: Nivel de Cortisol / Estrés (Calm visual) */}
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-0.5">
            <span className="truncate">Cortisol</span>
            <HeartPulse
              className={cn(
                "size-3",
                gameState.cortisol > 65 ? "text-amber-400 animate-pulse" : "text-emerald-400",
              )}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-sm sm:text-base font-black font-mono",
                gameState.cortisol > 65 ? "text-amber-300" : "text-emerald-400",
              )}
            >
              {gameState.cortisol}%
            </span>
            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  gameState.cortisol > 65 ? "bg-amber-400" : "bg-emerald-400",
                )}
                style={{ width: `${gameState.cortisol}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TARJETA ACTIVA: DILEMA O DEBRIEFING */}
      <AnimatePresence mode="wait">
        {!showingDebrief ? (
          <motion.div
            key={`dilemma-${currentDilemma.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-slate-900/90 border border-slate-800/90 p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-5"
          >
            {/* Cabecera del dilema */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                {currentDilemma.contextTag}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-100 leading-tight">
                {currentDilemma.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                {currentDilemma.narrative}
              </p>
            </div>

            {/* Pregunta clave */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-200 flex items-center gap-2">
              <HelpCircle className="size-4 shrink-0 text-purple-300" />
              <span>{currentDilemma.question}</span>
            </div>

            {/* Opciones de Decisión (3 alternativas limpias y espaciosas) */}
            <div className="space-y-2.5 pt-1">
              {currentDilemma.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelectChoice(choice)}
                  className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-800/60 active:scale-[0.99] border border-slate-800/80 hover:border-teal-500/40 transition-all cursor-pointer group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          choice.badge === "Prudente"
                            ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                            : choice.badge === "Equilibrado"
                              ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                              : choice.badge === "Creativo"
                                ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                : "bg-amber-500/15 text-amber-300 border-amber-500/30",
                        )}
                      >
                        {choice.badge}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-teal-300 transition-colors leading-snug">
                      {choice.label}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-snug">{choice.subtext}</p>
                  </div>

                  <span className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-teal-300 group-hover:border-teal-500/30 transition-colors shrink-0">
                    <ArrowRight className="size-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="debrief"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 backdrop-blur-md shadow-2xl space-y-5"
          >
            {/* Cabecera del Debriefing */}
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 grid place-items-center text-xl shrink-0">
                {lastChoice?.guardian === "nido"
                  ? "🐷"
                  : lastChoice?.guardian === "chispa"
                    ? "📐"
                    : "🪙"}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                  Retroalimentación de{" "}
                  {lastChoice?.guardian === "nido"
                    ? "Nido"
                    : lastChoice?.guardian === "chispa"
                      ? "Chispa"
                      : "Toto"}
                </span>
                <h4 className="text-base font-black text-slate-100 truncate">
                  {lastChoice?.feedbackTitle}
                </h4>
              </div>
            </div>

            {/* Lección Didáctica (Ensayo y Error) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {lastChoice?.feedbackLesson}
              </p>
            </div>

            {/* Cambios provocados en los indicadores */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Flujo Toto</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    (lastChoice?.deltaCashflow ?? 0) >= 0 ? "text-emerald-400" : "text-amber-400",
                  )}
                >
                  {(lastChoice?.deltaCashflow ?? 0) >= 0 ? "+" : ""}
                  {money(lastChoice?.deltaCashflow ?? 0)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Nido</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    (lastChoice?.deltaShield ?? 0) >= 0 ? "text-teal-300" : "text-amber-400",
                  )}
                >
                  {(lastChoice?.deltaShield ?? 0) >= 0 ? "+" : ""}
                  {money(lastChoice?.deltaShield ?? 0)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Cortisol</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    (lastChoice?.deltaCortisol ?? 0) <= 0 ? "text-emerald-400" : "text-amber-400",
                  )}
                >
                  {(lastChoice?.deltaCortisol ?? 0) > 0 ? "+" : ""}
                  {lastChoice?.deltaCortisol ?? 0}%
                </span>
              </div>
            </div>

            {/* Botón de Siguiente Ronda */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleProceedNextRound}
                className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-98 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {gameState.roundIndex + 1 >= dilemmas.length
                    ? "Ver Diagnóstico Final"
                    : "Siguiente Dilema ➔"}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Barra de Atajo entre Pilares UALÍ */}
      <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-slate-500">
        <Link
          to={APP_ROUTES.INICIO}
          className="hover:text-slate-300 flex items-center gap-1 transition"
        >
          <Home className="size-3" />
          <span>Inicio</span>
        </Link>
        <span className="text-slate-700">•</span>
        <Link
          to={APP_ROUTES.PRESUPUESTO}
          className="hover:text-slate-300 flex items-center gap-1 transition"
        >
          <PieChart className="size-3" />
          <span>Presupuesto</span>
        </Link>
        <span className="text-slate-700">•</span>
        <span className="text-purple-400 font-medium">Simulador Activo</span>
      </div>
    </div>
  );
}
