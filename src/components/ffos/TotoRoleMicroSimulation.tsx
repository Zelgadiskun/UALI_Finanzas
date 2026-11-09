import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  CreditCard,
  ShieldAlert,
  Sparkles,
  Zap,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  TrendingDown,
  TrendingUp,
  Award,
} from "lucide-react";
import { TotoCharacter } from "@/components/ffos/characters/Characters";
import { money } from "@/lib/ffos/format";
import { cn } from "@/lib/utils";

// Definición de las opciones y consecuencias de cada paso
interface StepChoice {
  id: string;
  label: string;
  subtext: string;
  deltaXP: number;
  esDecisionEstresante: boolean;
  totoReaction: "approving" | "cautious" | "supportive";
  feedbackTitle: string;
  feedbackText: string;
}

interface SimulationStep {
  numero: number;
  titulo: string;
  contexto: string;
  pregunta: string;
  opciones: StepChoice[];
}

const PASOS_SIMULACION: SimulationStep[] = [
  {
    numero: 1,
    titulo: "Paso 1: El Dilema Crítico",
    contexto:
      "Eduardo, tu vehículo de trabajo tiene una falla mecánica urgente en los frenos ($450 USD). Paralelamente, hoy vence el saldo de tu tarjeta de crédito por $400 USD (con un CAT del 52% anual si no pagas). Tu liquidez disponible en cuenta es de exactamente $500 USD.",
    pregunta: "¿Cómo distribuyes tus $500 disponibles sin quebrar tu seguridad?",
    opciones: [
      {
        id: "p1_negociar",
        label:
          "Opción A: Reparar frenos ($350) + Pago parcial de tarjeta ($150) y diferir a tasa fija.",
        subtext: "Priorizas tu integridad física y evitas la mora legal negociando el remanente.",
        deltaXP: +30,
        esDecisionEstresante: false,
        totoReaction: "approving",
        feedbackTitle: "¡Excelente criterio de seguridad y flujo!",
        feedbackText:
          "La seguridad física jamás se negocia. Reparaste el auto para seguir trabajando y evitaste la morosidad pactando un plan ordenado.",
      },
      {
        id: "p1_tarjeta_todo",
        label: "Opción B: Pagar el 100% de la tarjeta ($400) e ignorar la falla del auto.",
        subtext: "Salvas tu historial bancario pero manejas con riesgo vital.",
        deltaXP: -15,
        esDecisionEstresante: true,
        totoReaction: "cautious",
        feedbackTitle: "Amortiguación Activa: Cuidado con la ilusión de orden",
        feedbackText:
          "Dejaste tu tarjeta en cero, pero arriesgas un accidente o una rotura de motor que te costará $1,500 el mes entrante.",
      },
      {
        id: "p1_tarjeta_minimo",
        label:
          "Opción C: Pagar el mínimo de la tarjeta ($30) y gastar el resto en reparaciones y compras.",
        subtext: "Alivio ilusorio hoy con intereses que crecerán en bola de nieve.",
        deltaXP: -25,
        esDecisionEstresante: true,
        totoReaction: "supportive",
        feedbackTitle: "Contención Segura: Trampa de intereses detectada",
        feedbackText:
          "Pagar solo el mínimo activa intereses rotativos del 52%. Respiremos: en el siguiente paso veremos cómo reestructurarlo.",
      },
    ],
  },
  {
    numero: 2,
    titulo: "Paso 2: La Consecuencia Operativa",
    contexto:
      "Dos semanas después, el costo de combustible sube un 12% y un cliente se retrasa 10 días en transferir tus honorarios. Necesitas generar $180 USD para cubrir la despensa.",
    pregunta: "¿Qué palanca activas para equilibrar el presupuesto?",
    opciones: [
      {
        id: "p2_canasta_recorte",
        label: "Opción A: Recortar salidas de ocio y activar la Canasta de Consumo Consciente.",
        subtext: "Ajustas temporalmente tus deseos sin tocar préstamos ni pedir fiado.",
        deltaXP: +25,
        esDecisionEstresante: false,
        totoReaction: "approving",
        feedbackTitle: "¡Dominio de la Ley de Conservación!",
        feedbackText:
          "Comprimir temporalmente la canasta prescindible protegió tu flujo de caja sin recurrir a deuda externa.",
      },
      {
        id: "p2_prestamo_express",
        label: "Opción B: Pedir un micro-préstamo por app con tasa del 30% mensual.",
        subtext: "Liquidez inmediata en 5 minutos pero con interés usurero.",
        deltaXP: -20,
        esDecisionEstresante: true,
        totoReaction: "cautious",
        feedbackTitle: "Fricción Cero: Alerta de asfixia financiera",
        feedbackText:
          "Las apps de micropréstamos cobran hasta un 300% anualizado. Desplegamos el Escudo Visual para frenar esa sangría.",
      },
      {
        id: "p2_escudo_nido",
        label: "Opción C: Retirar $180 del Fondo de Emergencia Nido y programar su reposición.",
        subtext: "Uso canónico de la reserva para contingencias reales de comida y movilidad.",
        deltaXP: +20,
        esDecisionEstresante: false,
        totoReaction: "approving",
        feedbackTitle: "¡Uso impecable del Escudo Nido!",
        feedbackText:
          "Para esto construyes tu reserva: absorbió el bache sin pedir prestado ni pagar un solo centavo de intereses.",
      },
    ],
  },
  {
    numero: 3,
    titulo: "Paso 3: Cierre y Blindaje de Ciclo",
    contexto:
      "Cobras finalmente tus honorarios acumulados más un pequeño bono ($1,100 USD). Tienes la oportunidad de sellar tu aprendizaje antes de cerrar el ciclo de Toto.",
    pregunta: "¿Cómo blindas tu patrimonio para que esta angustia no se repita?",
    opciones: [
      {
        id: "p3_reponer_nido",
        label: "Opción A: Reponer Nido ($300), liquidar saldo pendiente ($400) y separar 50/30/20.",
        subtext: "Cierras el ciclo en verde y con el escudo recargado.",
        deltaXP: +35,
        esDecisionEstresante: false,
        totoReaction: "approving",
        feedbackTitle: "¡Maestría en Resiliencia Financiera!",
        feedbackText:
          "Restableciste tu reserva, mataste la deuda con interés alto y dejaste tu flujo mensual oxigenado para el futuro.",
      },
      {
        id: "p3_gasto_premios",
        label: "Opción B: Gastar el 80% en celebraciones y ropa porque 'te lo mereces'.",
        subtext: "Vuelves a quedar sin colchón para el próximo mes.",
        deltaXP: -15,
        esDecisionEstresante: true,
        totoReaction: "supportive",
        feedbackTitle: "Contención Afectiva: El espejismo de la recompensa",
        feedbackText:
          "Premiarse es humano y vital, pero gastar el 80% sin reponer el nido te deja vulnerable ante el próximo imprevisto.",
      },
      {
        id: "p3_inversion_toto",
        label: "Opción C: Poner $200 en inversión a interés compuesto y liquidar compromisos.",
        subtext: "Equilibrio entre atacar el presente y construir riqueza a largo plazo.",
        deltaXP: +30,
        esDecisionEstresante: false,
        totoReaction: "approving",
        feedbackTitle: "¡El Engranaje de Toto en marcha!",
        feedbackText:
          "Pusiste a trabajar tu dinero mientras controlabas los pasivos. El tiempo multiplicará este acierto.",
      },
    ],
  },
];

export interface TotoRoleMicroSimulationProps {
  onXpChange?: (totalXpGained: number) => void;
  className?: string;
}

export function TotoRoleMicroSimulation({ onXpChange, className }: TotoRoleMicroSimulationProps) {
  // Estado de progresión del flujo de 3 pasos
  const [pasoActualIndex, setPasoActualIndex] = useState<number>(0);
  const [userXP, setUserXP] = useState<number>(100);
  const [historiaDecisiones, setHistoriaDecisiones] = useState<
    Array<{ paso: number; choice: StepChoice }>
  >([]);
  const [decisionActiva, setDecisionActiva] = useState<StepChoice | null>(null);
  const [mostrarDebrief, setMostrarDebrief] = useState<boolean>(false);
  const [simulacionTerminada, setSimulacionTerminada] = useState<boolean>(false);

  // SANITIZACIÓN DE VARIABLES MATEMÁTICAS (Zero-Bug Fallback)
  // Evita rupturas visuales de código (NaN% o divisiones por cero)
  const baseXPMax = 200;
  const baseCalculada = (userXP / baseXPMax) * 100;
  const porcentaje =
    Number.isNaN(baseCalculada) || !isFinite(baseCalculada)
      ? 0
      : Math.max(0, Math.min(Math.round(baseCalculada), 100));
  const renderPorcentaje = Number.isNaN(porcentaje) ? 0 : porcentaje;
  const porcentajeXP = renderPorcentaje;

  // LEY DE ETIOLOGÍA DE FRICCIÓN CERO:
  // Ralentiza la transición en un 40% (0.42s vs 0.30s) si se detecta una decisión estresante
  // para amortiguar el impacto psicológico y mitigar el cortisol en el usuario Eduardo.
  const esDecisionEstresante = decisionActiva?.esDecisionEstresante ?? false;
  const duracionTransicion = esDecisionEstresante ? 0.42 : 0.3;
  const easeCurve = esDecisionEstresante
    ? [0.4, 0, 0.2, 1] // Easing suave, prolongado y sedante
    : [0.22, 1, 0.36, 1]; // Easing ágil y satisfactorio

  const pasoData = PASOS_SIMULACION[pasoActualIndex];

  // Ejecución de la toma de decisión (Suma/Resta de XP instantánea y cambio visual)
  const handleTomarDecision = (choice: StepChoice) => {
    setDecisionActiva(choice);
    setMostrarDebrief(true);

    // Actualización inmediata de XP en la UI con piso de cero
    setUserXP((prev) => {
      const nuevo = Math.max(0, prev + choice.deltaXP);
      return nuevo;
    });

    setHistoriaDecisiones((prev) => [...prev, { paso: pasoActualIndex + 1, choice }]);
  };

  // Avanzar al siguiente paso del desafío
  const handleAvanzarPaso = () => {
    setMostrarDebrief(false);
    setDecisionActiva(null);

    if (pasoActualIndex + 1 >= PASOS_SIMULACION.length) {
      setSimulacionTerminada(true);
      if (onXpChange) {
        onXpChange(userXP);
      }
    } else {
      setPasoActualIndex((prev) => prev + 1);
    }
  };

  // Reiniciar micro-simulación para ensayo y error
  const handleReiniciar = () => {
    setPasoActualIndex(0);
    setUserXP(100);
    setHistoriaDecisiones([]);
    setDecisionActiva(null);
    setMostrarDebrief(false);
    setSimulacionTerminada(false);
  };

  return (
    <div
      className={cn(
        "w-full max-w-xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6 text-slate-100",
        className,
      )}
    >
      {/* 1. CABECERA: TOTO FLASH + REGLA DE LOS 3 DATOS MACRO (XP, PASO Y ESTADO) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
            🪙
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Desafío Flash de Toto
              </span>
              <span className="text-xs">⚡</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-100 truncate">
              Micro-Simulación: Reparación vs Tarjeta
            </h3>
          </div>
        </div>

        {/* Contador Reactivo de XP con Mutación Visual Inmediata */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
          <Sparkles className="size-3.5 text-amber-400" />
          <span className="text-xs font-mono font-black text-amber-300">{userXP} XP</span>
        </div>
      </div>

      {/* 2. BARRA DE RESILIENCIA MATEMÁTICAMENTE SANITIZADA (ZERO-BUG FALLBACK) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            {simulacionTerminada ? "Simulación Completada" : `Paso ${pasoActualIndex + 1} de 3`}
          </span>
          <span className="text-amber-400 font-mono font-bold">Resiliencia: {porcentajeXP}%</span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-teal-400 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${porcentajeXP}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* 3. CONTENIDO PRINCIPAL: FLUJO DE 3 PASOS VS PANTALLA FINAL */}
      {!simulacionTerminada ? (
        <div className="space-y-5">
          {/* Tarjeta del Dilema con Espaciado Generoso (Sin Texto Apiñado) */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
              {pasoData.titulo}
            </span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              {pasoData.contexto}
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs font-bold text-slate-100">
              <span className="size-1.5 rounded-full bg-amber-400" />
              <span>{pasoData.pregunta}</span>
            </div>
          </div>

          {/* Opciones de Decisión (Ensayo y Error) */}
          {!mostrarDebrief ? (
            <div className="space-y-2.5">
              {pasoData.opciones.map((opcion) => (
                <button
                  key={opcion.id}
                  type="button"
                  onClick={() => handleTomarDecision(opcion)}
                  className="w-full text-left p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-850 active:scale-[0.99] border border-slate-800/80 hover:border-amber-500/40 transition-all cursor-pointer flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                        {opcion.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{opcion.subtext}</p>
                  </div>

                  {/* Badge de Impacto de XP Inmediato */}
                  <span
                    className={cn(
                      "px-2 py-1 rounded-xl text-[10px] font-black font-mono shrink-0 border",
                      opcion.deltaXP > 0
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30",
                    )}
                  >
                    {opcion.deltaXP > 0 ? `+${opcion.deltaXP}` : opcion.deltaXP} XP
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* 4. FEEDBACK CON LEY DE ETIOLOGÍA DE FRICCIÓN CERO */
            /* Si la decisión es estresante, duracionTransicion = 0.42s (+40%) con tonos ámbar suaves */
            <AnimatePresence mode="wait">
              <motion.div
                key={`debrief-${decisionActiva?.id}`}
                initial={{ opacity: 0, scale: 0.98, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -6 }}
                transition={{ duration: duracionTransicion, ease: easeCurve }}
                className={cn(
                  "p-5 rounded-2xl border backdrop-blur-md space-y-4 transition-colors",
                  esDecisionEstresante
                    ? "bg-slate-950/90 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
                    : "bg-slate-950/90 border-teal-500/40 shadow-[0_0_20px_rgba(46,196,182,0.12)]",
                )}
              >
                {/* Encabezado del Debriefing con Reacción de Toto */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">
                      {decisionActiva?.totoReaction === "approving" ? "🪙✨" : "🪙🛡️"}
                    </span>
                    <div>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider block",
                          esDecisionEstresante ? "text-amber-400" : "text-teal-400",
                        )}
                      >
                        {esDecisionEstresante
                          ? "Ley de Fricción Cero (Amortiguación Activa)"
                          : "Resonancia Positiva de Toto"}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-100">
                        {decisionActiva?.feedbackTitle}
                      </h4>
                    </div>
                  </div>

                  {/* Variación de XP */}
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-mono font-black border",
                      (decisionActiva?.deltaXP ?? 0) >= 0
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30",
                    )}
                  >
                    {(decisionActiva?.deltaXP ?? 0) >= 0 ? "+" : ""}
                    {decisionActiva?.deltaXP} XP
                  </span>
                </div>

                {/* Explicación Didáctica y de Contención Afectiva */}
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {decisionActiva?.feedbackText}
                </p>

                {/* Botón de Siguiente Paso */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleAvanzarPaso}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>
                      {pasoActualIndex + 1 >= PASOS_SIMULACION.length
                        ? "Ver Balance Final de Toto"
                        : "Continuar al Siguiente Paso ➔"}
                    </span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      ) : (
        /* PANTALLA FINAL: DIAGNÓSTICO DE LA MICRO-SIMULACIÓN */
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="text-center space-y-5 p-2"
        >
          <div className="size-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 grid place-items-center text-3xl shadow-inner">
            🏆
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Desafío de Toto Superado
            </span>
            <h4 className="text-lg sm:text-xl font-black text-slate-100">
              {porcentajeXP >= 60
                ? "Estratega de Flujo Consciente"
                : "Aprendiz de Resiliencia Empírica"}
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed pt-1">
              Experimentaste cómo una sola decisión sobre la tarjeta o el auto puede evitar la bola
              de nieve de intereses sin poner en riesgo tu seguridad.
            </p>
          </div>

          {/* Resumen de XP y Métricas Finales */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                XP Acumulada
              </span>
              <span className="text-base font-black text-amber-300 font-mono">{userXP} XP</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Índice de Resiliencia
              </span>
              <span className="text-base font-black text-teal-300 font-mono">{porcentajeXP}%</span>
            </div>
          </div>

          {/* Botón de Reinicio para Practicar Otras Rutas (Ensayo y Error) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleReiniciar}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700/80"
            >
              <RotateCcw className="size-3.5" />
              <span>Probar Otra Combinación de Decisiones</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
