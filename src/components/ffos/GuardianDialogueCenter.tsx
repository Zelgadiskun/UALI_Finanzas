import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Sparkles,
  Shield,
  HeartPulse,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  GUARDIAN_PROFILES,
  GUARDIAN_TOPICS,
  getLowCortisolTransitionDuration,
  type DialogueTopic,
  type GuardianId,
} from "@/lib/ffos/guardianDialoguesEngine";
import { money, sanitizePercentage } from "@/lib/ffos/format";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

interface GuardianDialogueCenterProps {
  onGainXp?: (xp: number) => void;
  className?: string;
}

export function GuardianDialogueCenter({ onGainXp, className }: GuardianDialogueCenterProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(GUARDIAN_TOPICS[0].id);
  const [activeGuardianTab, setActiveGuardianTab] = useState<GuardianId>("nido");
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [userSimulatedCortisol, setUserSimulatedCortisol] = useState<number>(30);
  const [expandedRationale, setExpandedRationale] = useState<boolean>(false);

  const { playSuccessChord, triggerConfetti } = useSound();

  const currentTopic = GUARDIAN_TOPICS.find((t) => t.id === selectedTopicId) || GUARDIAN_TOPICS[0];

  const currentChoice = currentTopic.testChoices.find((c) => c.id === selectedChoiceId) || null;

  // Sanitización de Variables Matemáticas (Zero-Bug Fallback: jamás NaN%)
  const cortisolPct = sanitizePercentage(userSimulatedCortisol, 100);
  const esAlertaCritica = cortisolPct >= 60;
  const animDuration = getLowCortisolTransitionDuration(cortisolPct);

  // Manejo de la elección experimental del usuario (ensayo y error)
  const handleSelectChoice = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
    const chosen = currentTopic.testChoices.find((c) => c.id === choiceId);
    if (chosen) {
      const nextCortisol = Math.max(
        5,
        Math.min(100, userSimulatedCortisol + chosen.cortisolImpact),
      );
      setUserSimulatedCortisol(nextCortisol);

      if (chosen.cortisolImpact < 0) {
        playSuccessChord();
        triggerConfetti();
        if (onGainXp) onGainXp(25);
      }
    }
  };

  const handleResetTopic = () => {
    setSelectedChoiceId(null);
    setUserSimulatedCortisol(30);
    setExpandedRationale(false);
  };

  return (
    <div className={cn("space-y-6 max-w-2xl mx-auto", className)}>
      {/* 1. CABECERA: TÍTULO Y CONTROL DE CORTISOL SANITIZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 grid place-items-center text-xl shrink-0">
            💬
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                Cónclave de Guardianes UALÍ
              </span>
              <span className="text-amber-300 text-xs">✨</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-100 leading-tight">
              Debate de Sabiduría Financiera
            </h3>
          </div>
        </div>

        {/* Medidor de Cortisol Sanitizado con Regla de Fricción Cero */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 shrink-0">
          <HeartPulse
            className={cn(
              "size-4 shrink-0 transition-colors",
              esAlertaCritica ? "text-amber-400 animate-pulse" : "text-emerald-400",
            )}
          />
          <div className="flex flex-col text-right min-w-[70px]">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Cortisol</span>
            <span
              className={cn(
                "text-xs font-mono font-black",
                esAlertaCritica ? "text-amber-300" : "text-emerald-300",
              )}
            >
              {cortisolPct}% {esAlertaCritica ? "(Alerta)" : "(Calma)"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SELECTOR DE TEMAS DILEMÁTICOS (OCULTAMIENTO PROGRESIVO) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {GUARDIAN_TOPICS.map((topic) => {
          const isActive = topic.id === currentTopic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => {
                setSelectedTopicId(topic.id);
                handleResetTopic();
              }}
              className={cn(
                "px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border",
                isActive
                  ? "bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-xs"
                  : "bg-slate-900/60 text-slate-400 border-slate-800/70 hover:text-slate-200",
              )}
            >
              <span>
                {topic.category === "Gasto Impulsivo"
                  ? "🛒"
                  : topic.category === "Ingreso Extra"
                    ? "🎁"
                    : "🤝"}
              </span>
              <span>{topic.title}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TARJETA PRINCIPAL DEL DILEMA CON ESPACIADO AMPLIO (SIN TEXTO APIÑADO) */}
      <motion.div
        key={currentTopic.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animDuration }}
        className="rounded-3xl bg-slate-900/70 border border-slate-800/90 p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-5"
      >
        {/* Contexto del dilema de Eduardo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 uppercase">
              {currentTopic.category}
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">
              En juego: {money(currentTopic.amountInvolved)}
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-black text-slate-100 leading-snug">
            {currentTopic.situation}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {currentTopic.eduardoDilemma}
          </p>
        </div>

        {/* Pestañas de los Tres Guardianes (Nido, Chispa, Toto) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          {(["nido", "chispa", "toto"] as GuardianId[]).map((gid) => {
            const guardian = GUARDIAN_PROFILES[gid];
            const isActive = activeGuardianTab === gid;
            return (
              <button
                key={gid}
                type="button"
                onClick={() => setActiveGuardianTab(gid)}
                className={cn(
                  "py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  isActive
                    ? guardian.badgeBg + " shadow-sm font-black"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                <span>{guardian.emoji}</span>
                <span className="truncate">{guardian.name}</span>
              </button>
            );
          })}
        </div>

        {/* Diálogo del Guardián Activo */}
        {(() => {
          const guardian = GUARDIAN_PROFILES[activeGuardianTab];
          const opinion = currentTopic.opinions[activeGuardianTab];

          return (
            <motion.div
              key={activeGuardianTab}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{guardian.emoji}</span>
                  <div>
                    <span className="text-xs font-black text-slate-200 block">
                      {guardian.name} • {guardian.archetype}
                    </span>
                    <span className="text-[10px] text-slate-400">{guardian.role}</span>
                  </div>
                </div>
              </div>

              <h5 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                "{opinion.headline}"
              </h5>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {opinion.dialogue}
              </p>

              {/* Recomendación Práctica */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 space-y-1">
                <span className="font-bold block text-[11px] text-purple-300 uppercase tracking-wider">
                  Recomendación UALÍ:
                </span>
                <p className="text-[11px] text-purple-200 leading-relaxed">
                  {opinion.recommendation}
                </p>
              </div>
            </motion.div>
          );
        })()}

        {/* 4. SECCIÓN INTERACTIVA: ENSAYO Y ERROR PARA EDUARDO */}
        <div className="space-y-3 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              ¿Qué camino decides experimentar?
            </span>
            <span className="text-[10px] text-slate-400">Prueba y observa las consecuencias</span>
          </div>

          <div className="space-y-2">
            {currentTopic.testChoices.map((choice) => {
              const isSelected = selectedChoiceId === choice.id;
              const guardian = GUARDIAN_PROFILES[choice.supporter];

              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelectChoice(choice.id)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs",
                    isSelected
                      ? "bg-slate-800/90 border-teal-500/50 shadow-md ring-1 ring-teal-500/30"
                      : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{guardian.emoji}</span>
                    <span className="font-medium text-slate-200 leading-snug">{choice.label}</span>
                  </div>
                  <span className="shrink-0 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                    <ArrowRight className="size-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. DEBRIEFING DIDÁCTICO DEL ENSAYO Y ERROR (OCULTAMIENTO PROGRESIVO) */}
        <AnimatePresence>
          {currentChoice && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: animDuration, ease: [0.25, 1, 0.5, 1] }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-teal-400" />
                    <span className="text-xs font-black text-slate-100">
                      Resultado del Experimento: {currentChoice.consequenceTitle}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetTopic}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reintentar</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {currentChoice.consequenceText}
                </p>

                {/* Lección de aprendizaje cognitivo */}
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200">
                  <span className="font-bold block text-[10px] text-teal-300 uppercase tracking-wider mb-0.5">
                    Lección de Aprendizaje de {GUARDIAN_PROFILES[currentChoice.supporter].name}:
                  </span>
                  <p className="text-[11px] text-teal-100 leading-relaxed">
                    {currentChoice.learningTakeaway}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
