import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  HeartPulse,
  Wallet,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Trophy,
} from "lucide-react";
import { money, sanitizePercentage } from "@/lib/ffos/format";
import { getLowCortisolTransitionDuration } from "@/lib/ffos/guardianDialoguesEngine";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

interface ShockWave {
  id: number;
  title: string;
  category: string;
  cost: number;
  description: string;
  lessonHeadline: string;
}

const WAVES: ShockWave[] = [
  {
    id: 1,
    title: "La Tubería Rota del Baño",
    category: "Hogar",
    cost: 180,
    description:
      "Una filtración nocturna daña el piso. El fontanero de urgencia cobra $180 por el reemplazo inmediato.",
    lessonHeadline: "Los imprevistos domésticos son inevitables; para esto nació Nido.",
  },
  {
    id: 2,
    title: "Revisión Mecánica Obligatoria",
    category: "Transporte",
    cost: 260,
    description:
      "El freno del auto hace ruido metálico. Seguir conduciendo arriesga un accidente o una reparación de $1,200.",
    lessonHeadline: "El mantenimiento preventivo ahorra el triple a largo plazo.",
  },
  {
    id: 3,
    title: "Consulta Médica y Receta Especial",
    category: "Salud",
    cost: 150,
    description:
      "Una infección gripal fuerte te deja sin energías. Requiere consulta y antibióticos por $150.",
    lessonHeadline: "La salud física jamás se pospone por miedo al dinero.",
  },
  {
    id: 4,
    title: "El Mes con Factura Demorada",
    category: "Ingresos",
    cost: 320,
    description:
      "Tu cliente principal cierra balance y retrasará su transferencia 20 días. Necesitas cubrir tus víveres.",
    lessonHeadline: "El Escudo Nido convierte un pánico financiero en un simple trámite.",
  },
];

interface EmergencyShieldMinigameProps {
  onComplete?: (xp: number) => void;
  className?: string;
}

export function EmergencyShieldMinigame({ onComplete, className }: EmergencyShieldMinigameProps) {
  const [waveIndex, setWaveIndex] = useState(0);
  const [shieldHp, setShieldHp] = useState(1000);
  const [maxShieldHp] = useState(1000);
  const [cashflow, setCashflow] = useState(700);
  const [cortisol, setCortisol] = useState(25);
  const [wisdom, setWisdom] = useState(10);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    text: string;
    isHealthy: boolean;
  } | null>(null);

  const { playSuccessChord, triggerConfetti } = useSound();

  const currentWave = WAVES[waveIndex] || WAVES[WAVES.length - 1];

  // Sanitización estricta de variables matemáticas (Zero-Bug Fallback: jamás NaN%)
  const shieldPct = sanitizePercentage(shieldHp, maxShieldHp);
  const cortisolPct = sanitizePercentage(cortisol, 100);
  const isCriticalCortisol = cortisolPct >= 60;
  const animDuration = getLowCortisolTransitionDuration(cortisolPct);

  // Aplicar estrategia ante el imprevisto (Ensayo y Error)
  const handleApplyStrategy = (strategy: "shield" | "cashflow" | "credit_card" | "negotiate") => {
    setSelectedStrategy(strategy);
    const cost = currentWave.cost;

    let nextShield = shieldHp;
    let nextCashflow = cashflow;
    let nextCortisol = cortisol;
    let nextWisdom = wisdom + 15;
    let feedbackObj = { title: "", text: "", isHealthy: true };

    if (strategy === "shield") {
      // 1. Absorber con Escudo Nido: Protege flujo, reduce estrés
      nextShield = Math.max(0, shieldHp - cost);
      nextCortisol = Math.max(10, cortisol - 10);
      feedbackObj = {
        title: "¡Escudo Nido activado con éxito!",
        text: `Absorbiste los ${money(cost)} desde tu reserva. Tu flujo de caja mensual sigue intacto y tu cortisol bajó gracias a la tranquilidad del fondo.`,
        isHealthy: true,
      };
    } else if (strategy === "cashflow") {
      // 2. Contención con Flujo Toto: Aprieta canasta, escudo intacto
      nextCashflow = Math.max(0, cashflow - cost);
      nextCortisol = Math.min(100, cortisol + 10);
      feedbackObj = {
        title: "Ajuste de cinturón mensual",
        text: `Pagaste los ${money(cost)} recortando salidas y gustos de este mes. Tu Nido sigue intacto, aunque sentirás un poco más de presión en tus compras cotidianas.`,
        isHealthy: true,
      };
    } else if (strategy === "credit_card") {
      // 3. Tarjeta de Crédito (Ensayo y Error: Muestra las consecuencias del CAT)
      nextCortisol = Math.min(100, cortisol + 35);
      nextCashflow = Math.max(0, cashflow - Math.round(cost * 0.15)); // Pago mínimo
      nextWisdom = Math.max(5, wisdom + 5);
      feedbackObj = {
        title: "¡Alerta de Deuda Rotativa!",
        text: `Posponer con tarjeta pagando el mínimo te genera un 45% de CAT anual. Observa cómo tu nivel de cortisol se dispara al acumular compromisos futuros.`,
        isHealthy: false,
      };
    } else if (strategy === "negotiate") {
      // 4. Negociación Chispa: 50% anticipo, 50% próximo mes
      const half = Math.round(cost / 2);
      nextCashflow = Math.max(0, cashflow - half);
      nextCortisol = Math.max(15, cortisol - 5);
      nextWisdom = wisdom + 25;
      feedbackObj = {
        title: "Acuerdo colaborativo Chispa",
        text: `Negociaste pagar ${money(half)} hoy y ${money(half)} al siguiente ciclo. Repartiste el esfuerzo sin quebrar tu liquidez ni endeudarte con bancos.`,
        isHealthy: true,
      };
    }

    setShieldHp(nextShield);
    setCashflow(nextCashflow);
    setCortisol(nextCortisol);
    setWisdom(nextWisdom);
    setFeedback(feedbackObj);

    if (feedbackObj.isHealthy) {
      playSuccessChord();
    }
  };

  const handleNextWave = () => {
    if (waveIndex + 1 >= WAVES.length) {
      setIsGameOver(true);
      triggerConfetti();
      if (onComplete) onComplete(40);
    } else {
      setWaveIndex((w) => w + 1);
      setSelectedStrategy(null);
      setFeedback(null);
    }
  };

  const handleReset = () => {
    setWaveIndex(0);
    setShieldHp(1000);
    setCashflow(700);
    setCortisol(25);
    setWisdom(10);
    setSelectedStrategy(null);
    setIsGameOver(false);
    setFeedback(null);
  };

  // PANTALLA FINAL: CONCLUSIÓN Y DIAGNÓSTICO
  if (isGameOver) {
    const isMasterResilience = cortisolPct <= 45 && shieldHp >= 300;

    return (
      <div className={cn("max-w-xl mx-auto space-y-6 pt-2", className)}>
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-7 backdrop-blur-md shadow-2xl text-center space-y-5">
          <div className="size-16 mx-auto rounded-2xl bg-teal-500/15 border border-teal-500/30 grid place-items-center text-3xl shadow-inner">
            🛡️
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
              Minijuego Concluido • 4 Olas Superadas
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-100">
              {isMasterResilience
                ? "¡Maestría en Blindaje de Nido!"
                : "Defensa Completada con Aprendizajes"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed px-2">
              {isMasterResilience
                ? "Demostraste que tener un fondo de emergencia y negociar acuerdos inteligentes permite absorber cualquier crisis cotidiana sin perder la calma."
                : "Experimentaste cómo las deudas con tarjeta disparan el cortisol. Con un Escudo Nido bien nutrido, esos pánicos desaparecen por completo."}
            </p>
          </div>

          {/* Tres Métricas Sanitizadas */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Nido Remanente
              </span>
              <span className="text-sm sm:text-base font-black text-teal-300 font-mono">
                {money(shieldHp)} ({shieldPct}%)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Flujo Final
              </span>
              <span className="text-sm sm:text-base font-black text-slate-100 font-mono">
                {money(cashflow)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Cortisol
              </span>
              <span
                className={cn(
                  "text-sm sm:text-base font-black font-mono",
                  isCriticalCortisol ? "text-amber-300" : "text-emerald-300",
                )}
              >
                {cortisolPct}%
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-98 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RotateCcw className="size-3.5" />
              <span>Volver a Jugar (Probar Otras Respuestas)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PANTALLA EN CURSO (1 OLA A LA VEZ)
  return (
    <div className={cn("max-w-xl mx-auto space-y-5 pt-1", className)}>
      {/* Cabecera del Minijuego */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-teal-400" />
          <span className="text-xs font-black text-slate-200">Escudo contra Imprevistos</span>
        </div>
        <span className="text-[11px] font-mono font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
          Ola {waveIndex + 1} de {WAVES.length}
        </span>
      </div>

      {/* Regla de los Tres Indicadores Macro Sanitizados */}
      <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md backdrop-blur-md">
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span className="text-[10px] text-teal-400 font-semibold block">Escudo Nido</span>
          <span className="text-sm sm:text-base font-black text-teal-300 font-mono">
            {money(shieldHp)}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">{shieldPct}% activo</span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 font-semibold block">Flujo Toto</span>
          <span className="text-sm sm:text-base font-black text-slate-100 font-mono">
            {money(cashflow)}
          </span>
          <span className="text-[10px] text-slate-500 block">Disponible</span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 font-semibold block">Cortisol</span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-sm sm:text-base font-black font-mono",
                isCriticalCortisol ? "text-amber-300" : "text-emerald-300",
              )}
            >
              {cortisolPct}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {isCriticalCortisol ? "Alerta" : "En calma"}
          </span>
        </div>
      </div>

      {/* Tarjeta de la Ola Actual (Sin Texto Apiñado) */}
      <motion.div
        key={currentWave.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animDuration }}
        className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 backdrop-blur-md shadow-xl space-y-5"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              {currentWave.category} • Imprevisto Real
            </span>
            <span className="text-xs font-mono font-black text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
              Costo: -{money(currentWave.cost)}
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-black text-slate-100 leading-snug">
            {currentWave.title}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {currentWave.description}
          </p>
        </div>

        {/* Palancas de Decisión (Ensayo y Error) */}
        {!feedback ? (
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-bold text-slate-200 block">
              Elige cómo absorber este impacto:
            </span>

            {/* Opción 1: Nido */}
            <button
              type="button"
              onClick={() => handleApplyStrategy("shield")}
              className="w-full text-left p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/60 active:scale-[0.99] border border-teal-500/30 hover:border-teal-500 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0">🐷</span>
                <div>
                  <span className="font-bold text-slate-200 block">
                    Absorber con el Escudo Nido (-{money(currentWave.cost)})
                  </span>
                  <span className="text-[11px] text-teal-400">
                    Tu flujo mensual queda intacto • Cero deudas
                  </span>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-teal-400 shrink-0" />
            </button>

            {/* Opción 2: Flujo Toto */}
            <button
              type="button"
              onClick={() => handleApplyStrategy("cashflow")}
              className="w-full text-left p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/60 active:scale-[0.99] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0">🪙</span>
                <div>
                  <span className="font-bold text-slate-200 block">
                    Pagar con el Flujo Disponible (-{money(currentWave.cost)})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Ajustas la canasta de gustos • Nido intacto
                  </span>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Opción 3: Negociación Chispa */}
            <button
              type="button"
              onClick={() => handleApplyStrategy("negotiate")}
              className="w-full text-left p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/60 active:scale-[0.99] border border-purple-500/30 hover:border-purple-500 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0">📐</span>
                <div>
                  <span className="font-bold text-slate-200 block">
                    Negociar Pago en 2 Partes (Chispa)
                  </span>
                  <span className="text-[11px] text-purple-300">
                    Pagas 50% hoy ({money(Math.round(currentWave.cost / 2))}) y 50% al siguiente mes
                  </span>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-purple-400 shrink-0" />
            </button>

            {/* Opción 4: Tarjeta de Crédito (Ensayo y Error Didáctico) */}
            <button
              type="button"
              onClick={() => handleApplyStrategy("credit_card")}
              className="w-full text-left p-3 rounded-2xl bg-slate-950/40 hover:bg-slate-850 active:scale-[0.99] border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs opacity-80"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0">💳</span>
                <div>
                  <span className="font-semibold text-slate-300 block">
                    Pagar con Tarjeta de Crédito (pago mínimo)
                  </span>
                  <span className="text-[10px] text-red-300">
                    Ensayo y Error: prueba qué le ocurre a tu cortisol
                  </span>
                </div>
              </div>
              <ArrowRight className="size-3 text-red-400 shrink-0" />
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: animDuration }}
            className="p-4 rounded-2xl bg-slate-950 border border-teal-500/30 space-y-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={cn(
                  "size-4 shrink-0",
                  feedback.isHealthy ? "text-teal-400" : "text-amber-400",
                )}
              />
              <h5 className="text-xs sm:text-sm font-black text-slate-100">{feedback.title}</h5>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">{feedback.text}</p>

            <button
              type="button"
              onClick={handleNextWave}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>
                {waveIndex + 1 >= WAVES.length ? "Ver Evaluación Final" : "Siguiente Ola ➔"}
              </span>
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
