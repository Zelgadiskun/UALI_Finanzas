import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  Shield,
  ShieldAlert,
  Zap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Snowflake,
  Flame,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Eye,
  Info,
  Trophy,
  X,
  Volume2,
  VolumeX,
  ShoppingBag,
  Home,
  Tv,
  Coffee,
  HeartPulse,
  UtensilsCrossed,
  Lightbulb,
} from "lucide-react";
import { NidoCharacter } from "@/components/ffos/characters/Characters";
import { useUserPoints } from "@/lib/ffos/points";
import { useTransactionsQuery, useCurrentUserId } from "@/lib/supabase/queries";
import { addLocalLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { cn } from "@/lib/utils";

// --- Web Audio API sintetizador táctil ---
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    return new AudioCtx();
  } catch {
    return null;
  }
}

let sharedAudioCtx: AudioContext | null = null;
function getSharedAudio(): AudioContext | null {
  if (!sharedAudioCtx) sharedAudioCtx = getAudioContext();
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playClink() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    /* audio failure ignored */
  }
}

function playFreeze() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    /* audio failure ignored */
  }
}

function playSteamLeak() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch {
    /* audio failure ignored */
  }
}

function playPowerUpSound() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /* audio failure ignored */
  }
}

function playVictorySound() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + idx * 0.1;
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch {
    /* audio failure ignored */
  }
}

// --- Modelado de Items de Gasto ---
export type FlowClassification = "need" | "want" | "hybrid";

export interface ExpenseFlowItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  actualType: FlowClassification;
  explanation: string;
  isRealTelemetry?: boolean;
  hybridNeedRatio?: number; // Para calibración (0 = 100% deseo, 100 = 100% necesidad)
}

const ARCHETYPAL_FLOW_ITEMS: ExpenseFlowItem[] = [
  {
    id: "item-renta",
    name: "Alquiler / Hipoteca del Hogar",
    amount: 450,
    category: "Vivienda",
    actualType: "need",
    explanation: "Oxígeno vital: el techo es la primera barrera de seguridad del hogar.",
  },
  {
    id: "item-streaming",
    name: "Suscripción Premium 4K + Cine",
    amount: 19.99,
    category: "Entretenimiento",
    actualType: "want",
    explanation: "Luz de bengala: entretenimiento prescindible ante emergencias.",
  },
  {
    id: "item-super",
    name: "Despensa Básica (Arroz, Huevos, Verduras)",
    amount: 72.5,
    category: "Alimentos",
    actualType: "need",
    explanation: "Nutrición esencial: combustible no negociable para tu familia.",
  },
  {
    id: "item-cafe",
    name: "Café de Especialidad + Muffin",
    amount: 7.25,
    category: "Café",
    actualType: "want",
    explanation: "Gasto hormiga: micro-deseo que drena la reserva si se vuelve diario.",
  },
  {
    id: "item-seguro",
    name: "Póliza de Salud & Medicamentos Vitales",
    amount: 85,
    category: "Salud",
    actualType: "need",
    explanation: "Blindaje sanitario: previene deudas catastróficas por urgencias.",
  },
  {
    id: "item-sushi",
    name: "Delivery Gourmet de Sushi",
    amount: 38,
    category: "Restaurantes",
    actualType: "want",
    explanation: "Antojo prescindible: comer en casa protege el lomo de Nido.",
  },
  {
    id: "item-ropa-hibrida",
    name: "Calzado / Ropa para el Trabajo",
    amount: 55,
    category: "Vestimenta",
    actualType: "hybrid",
    explanation:
      "Gasto híbrido: ¿Calzado ergonómico de trabajo (Necesidad) o marca de lujo (Deseo)?",
    hybridNeedRatio: 65,
  },
  {
    id: "item-luz",
    name: "Recibo de Electricidad & Agua",
    amount: 44,
    category: "Servicios",
    actualType: "need",
    explanation: "Servicio básico de infraestructura del hogar.",
  },
];

interface NidoMechanicalClassifierProps {
  onClose?: () => void;
  onCompleted?: () => void;
}

export function NidoMechanicalClassifier({ onClose, onCompleted }: NidoMechanicalClassifierProps) {
  const userId = useCurrentUserId();
  const { ffosTokens, awardPoints, spendTokens } = useUserPoints();
  const transactionsQuery = useTransactionsQuery(userId || undefined);
  const { completeSubLesson } = useEducationProgress();

  // 1. Construir lista de fichas mezclando telemetría real con arquetipos
  const flowItems = useMemo<ExpenseFlowItem[]>(() => {
    const realTx = (transactionsQuery.data || []).filter((t) => t.type === "gasto").slice(0, 4);

    const mappedReal: ExpenseFlowItem[] = realTx.map((t, idx) => {
      const lowerCat = (t.category || "").toLowerCase();
      const lowerNote = (t.note || "").toLowerCase();
      const isEssential =
        lowerCat.includes("super") ||
        lowerCat.includes("comida") ||
        lowerCat.includes("vivienda") ||
        lowerCat.includes("alquiler") ||
        lowerCat.includes("salud") ||
        lowerCat.includes("med") ||
        lowerCat.includes("servicios") ||
        lowerNote.includes("arroz") ||
        lowerNote.includes("farmacia");

      return {
        id: `real-${t.id || idx}`,
        name: t.note ? t.note : `Gasto en ${t.category}`,
        amount: Number(t.amount) || 20,
        category: t.category || "General",
        actualType: isEssential ? "need" : "want",
        explanation: isEssential
          ? "Detectado en tu app UALÍ como gasto de supervivencia indispensable."
          : "Detectado en tu app UALÍ como desembolso discrecional prescindible.",
        isRealTelemetry: true,
      };
    });

    return [...mappedReal, ...ARCHETYPAL_FLOW_ITEMS].slice(0, 8);
  }, [transactionsQuery.data]);

  // Bono inicial de blindaje si el usuario tiene disciplina real en UALÍ
  const hasSavingsOrBuffer = useMemo(() => {
    const list = transactionsQuery.data || [];
    const hasAhorro = list.some((t) => t.type === "ahorro");
    return hasAhorro;
  }, [transactionsQuery.data]);

  const maxShieldHp = hasSavingsOrBuffer ? 120 : 100;

  // Estado del juego
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shieldHp, setShieldHp] = useState(maxShieldHp);
  const [gameState, setGameState] = useState<"intro" | "playing" | "game_over" | "victory">(
    "intro",
  );
  const [nidoMood, setNidoMood] = useState<"happy" | "worried">("happy");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [airLeakActive, setAirLeakActive] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);
  const [clinkActive, setClinkActive] = useState(false);

  // Power-up «Rayo X de Impulso» (Costo 45 FFOS, dura 2 turnos)
  const [xRayTurnsRemaining, setXRayTurnsRemaining] = useState(0);

  // Palanca de Calibración (Slider de Prioridad)
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationRatio, setCalibrationRatio] = useState<number>(50); // 0 a 100

  // Desvío y arrastre
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartX = useRef<number | null>(null);

  const currentItem: ExpenseFlowItem | undefined = flowItems[currentIndex];

  // Restablecer ánimo tras alerta
  useEffect(() => {
    if (shieldHp < maxShieldHp * 0.4) {
      setNidoMood("worried");
    } else {
      setNidoMood("happy");
    }
  }, [shieldHp, maxShieldHp]);

  // Manejo de sonido táctil
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Activar Power-up Rayo X
  function handleActivateXRay() {
    if (xRayTurnsRemaining > 0) {
      toast.info("Rayo X de Impulso ya está activo", {
        description: `Quedan ${xRayTurnsRemaining} turnos de escaneo.`,
      });
      return;
    }
    if (ffosTokens < 45) {
      toast.error("FFOS insuficientes", {
        description: "Necesitas 45 FFOS para activar el Rayo X de Impulso.",
      });
      return;
    }

    const spent = spendTokens(45, "Power-up FFOS: Rayo X de Impulso");
    if (spent) {
      setXRayTurnsRemaining(2);
      if (soundEnabled) playPowerUpSound();
      toast.success("⚡ ¡Rayo X de Impulso Activado!", {
        description:
          "El filtro óptico revelará los gastos trampa antes de tocar la ranura de Nido.",
      });
    }
  }

  // Clasificar acción (Swipe Derecha = Necesidad / Ranura Nido, Swipe Izquierda = Deseo / Criocámara)
  function handleClassify(direction: "need" | "want") {
    if (!currentItem || gameState !== "playing") return;

    // Reducir turnos de Rayo X si estaba activo
    if (xRayTurnsRemaining > 0) {
      setXRayTurnsRemaining((prev) => Math.max(0, prev - 1));
    }

    // Caso 1: Enviar a la ranura de Nido (Necesidad)
    if (direction === "need") {
      if (
        currentItem.actualType === "need" ||
        (currentItem.actualType === "hybrid" && calibrationRatio >= 50)
      ) {
        // Acierto vital: Nido fortalece su escudo
        setShieldHp((prev) => Math.min(maxShieldHp, prev + 15));
        setClinkActive(true);
        setTimeout(() => setClinkActive(false), 800);
        if (soundEnabled) playClink();
        setFeedbackMessage(`✨ ¡CLINK! ${currentItem.name} es oxígeno vital. Escudo +15 HP.`);
        nextItem();
      } else {
        // FALLO GRAVE: Metió un deseo en la ranura de supervivencia
        // Nido se satura, chirrido metálico, fuga de aire
        setShieldHp((prev) => {
          const next = Math.max(0, prev - 25);
          if (next === 0) handleGameOver();
          return next;
        });
        setAirLeakActive(true);
        setTimeout(() => setAirLeakActive(false), 1200);
        if (soundEnabled) playSteamLeak();
        setFeedbackMessage(
          `🚨 ¡Fuga de aire metálica! Saturaste a Nido con un deseo (${currentItem.name}). -25 HP Escudo.`,
        );
        toast.error("¡Sobrecarga de deseo en la alcancía!", {
          description: currentItem.explanation,
        });
        nextItem();
      }
    }

    // Caso 2: Mandar a la Cámara Criogénica (Deseo)
    if (direction === "want") {
      if (
        currentItem.actualType === "want" ||
        (currentItem.actualType === "hybrid" && calibrationRatio < 50)
      ) {
        // Acierto: Deseo congelado exitosamente
        setFreezeActive(true);
        setTimeout(() => setFreezeActive(false), 800);
        if (soundEnabled) playFreeze();
        setFeedbackMessage(`❄️ ¡CONGELADO! Deseo prescindible desactivado. Liquidez blindada.`);
        nextItem();
      } else {
        // Error: Congeló una necesidad vital básica
        setShieldHp((prev) => {
          const next = Math.max(0, prev - 15);
          if (next === 0) handleGameOver();
          return next;
        });
        if (soundEnabled) playSteamLeak();
        setFeedbackMessage(
          `⚠️ ¡Error de privación! ${currentItem.name} es vital, no debes congelar tu oxígeno básico. -15 HP.`,
        );
        toast.warning("Privación indebida", {
          description: currentItem.explanation,
        });
        nextItem();
      }
    }
  }

  // Avanzar a la siguiente ficha o declarar victoria
  function nextItem() {
    setIsCalibrating(false);
    setCalibrationRatio(50);
    setDragOffset(0);

    if (currentIndex + 1 >= flowItems.length) {
      handleVictory();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handleGameOver() {
    setGameState("game_over");
    setNidoMood("worried");
    toast.error("El escudo de Nido se ha fracturado", {
      description:
        "Las impurezas de deseos saturaron la tolva. ¡Recalibra tu filtro y reinténtalo!",
    });
  }

  async function handleVictory() {
    setGameState("victory");
    setNidoMood("happy");
    if (soundEnabled) playVictorySound();

    // Recompensas de la Misión 04
    await awardPoints({
      xpToAdd: 50,
      tokensToAdd: 75,
      reason: "Misión 04: El Clasificador Mecánico superado",
    });

    // Guardar en progreso de habilidades
    addLocalLessonDone("mission-04-classifier", "needs_wants");
    completeSubLesson("lesson-needs-wants", "needs_wants", "needs-wants-sub-1", 0);

    toast.success("🎉 ¡Misión 04 Completada con Éxito!", {
      description: "+50 XP y +75 FFOS otorgados. Insignia «Filtro de Titanio» desbloqueada.",
      duration: 5000,
    });

    if (onCompleted) onCompleted();
  }

  function handleRestart() {
    setCurrentIndex(0);
    setShieldHp(maxShieldHp);
    setGameState("playing");
    setNidoMood("happy");
    setFeedbackMessage(null);
    setXRayTurnsRemaining(0);
    setIsCalibrating(false);
    setDragOffset(0);
  }

  // Gestos táctiles
  function onTouchStart(e: React.TouchEvent | React.MouseEvent) {
    if (isCalibrating || gameState !== "playing") return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    setIsDragging(true);
  }

  function onTouchMove(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging || dragStartX.current === null) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - dragStartX.current;
    setDragOffset(Math.max(-140, Math.min(140, diff)));
  }

  function onTouchEnd() {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 70) {
      handleClassify("need");
    } else if (dragOffset < -70) {
      handleClassify("want");
    } else {
      setDragOffset(0);
    }
    dragStartX.current = null;
  }

  // Color del escáner láser dinámico
  const laserColor = useMemo(() => {
    if (xRayTurnsRemaining > 0 && currentItem?.actualType === "want") {
      return "from-purple-500 via-fuchsia-400 to-purple-500 shadow-purple-500/80";
    }
    if (isCalibrating) {
      if (calibrationRatio >= 70)
        return "from-emerald-400 via-teal-300 to-emerald-400 shadow-emerald-500/80";
      if (calibrationRatio <= 30)
        return "from-amber-500 via-orange-400 to-amber-500 shadow-amber-500/80";
      return "from-yellow-400 via-amber-300 to-yellow-400 shadow-yellow-500/80";
    }
    return "from-teal-400 via-cyan-300 to-teal-400 shadow-teal-500/60";
  }, [xRayTurnsRemaining, currentItem, isCalibrating, calibrationRatio]);

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-6 transition-all">
      {/* 1. Header de la Misión */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="grid size-10 place-items-center rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 shadow-inner">
              <Shield className="size-5" />
            </span>
            <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded-full">
                Misión 04 • Nodo Fase 1
              </span>
              <span className="text-[10px] font-bold text-slate-400">Skill Tree</span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-100 tracking-tight">
              El Clasificador Mecánico
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? "Silenciar" : "Activar sonido"}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pantalla INTRODUCCIÓN */}
      {gameState === "intro" && (
        <div className="py-4 space-y-4 text-center">
          <div className="flex justify-center my-2">
            <NidoCharacter className="w-28 h-28" mood="happy" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-teal-300">
              «La Tolva de Clasificación de Nido»
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Soy <strong className="text-teal-400">Nido</strong>, tu alcancía de titanio. Cada peso
              gastado en un deseo impulsivo es un agujero en tu blindaje. Separemos el{" "}
              <em>oxígeno vital</em> de las <em>luces de bengala</em> efímeras.
            </p>
          </div>

          {/* Tarjeta de telemetría */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-left space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-amber-300">
              <Sparkles className="size-4" />
              <span>Lógica Adaptativa & Telemetría Real</span>
            </div>
            <p className="text-[11px] text-slate-400">
              La tolva leerá gastos reales de tu cuenta UALÍ para transformarlos en fichas en vivo.
              {hasSavingsOrBuffer && (
                <span className="block text-emerald-400 font-bold mt-1">
                  🛡️ ¡Bono detectado! Tu ahorro previo en UALÍ refuerza el escudo a 120 HP.
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left text-xs">
            <div className="bg-teal-950/40 border border-teal-800/40 p-2.5 rounded-xl">
              <span className="font-black text-teal-300 flex items-center gap-1">
                <ArrowRight className="size-3.5" /> Swipe Derecha
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Envía Necesidades vitales al lomo de Nido para cargar su blindaje.
              </p>
            </div>
            <div className="bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-xl">
              <span className="font-black text-sky-300 flex items-center gap-1">
                <ArrowLeft className="size-3.5" /> Swipe Izquierda
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Manda Deseos prescindibles a la criocámara para congelar el gasto.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGameState("playing")}
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-4"
          >
            <span>Iniciar Tolva de Clasificación</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* Pantalla JUEGO EN VIVO */}
      {gameState === "playing" && currentItem && (
        <div className="space-y-4">
          {/* Indicadores superiores: Escudo de Titanio y Power-up */}
          <div className="flex items-center justify-between gap-3">
            {/* Barra de Salud del Escudo */}
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs font-black mb-1">
                <span className="flex items-center gap-1 text-teal-300">
                  <Shield className="size-3.5 text-teal-400" />
                  <span>Escudo de Titanio</span>
                </span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    shieldHp > maxShieldHp * 0.5 ? "text-emerald-400" : "text-amber-400",
                  )}
                >
                  {shieldHp}/{maxShieldHp} HP
                </span>
              </div>
              <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    shieldHp > maxShieldHp * 0.5
                      ? "bg-gradient-to-r from-teal-400 to-emerald-400 shadow-sm shadow-emerald-400/50"
                      : "bg-gradient-to-r from-amber-500 to-rose-500 shadow-sm shadow-rose-500/50",
                  )}
                  style={{ width: `${Math.max(0, (shieldHp / maxShieldHp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Botón Power-up Rayo X */}
            <button
              type="button"
              onClick={handleActivateXRay}
              disabled={xRayTurnsRemaining > 0 || ffosTokens < 45}
              className={cn(
                "px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition active:scale-95",
                xRayTurnsRemaining > 0
                  ? "bg-purple-950/80 border-purple-500 text-purple-300 animate-pulse shadow-lg shadow-purple-500/20"
                  : ffosTokens >= 45
                    ? "bg-slate-900 border-purple-500/60 text-purple-300 hover:bg-purple-950/40"
                    : "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed",
              )}
            >
              <Eye className="size-3.5" />
              <span>
                {xRayTurnsRemaining > 0 ? `Rayo X (${xRayTurnsRemaining})` : "Rayo X (45 F)"}
              </span>
            </button>
          </div>

          {/* Turno actual */}
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>
              Ficha {currentIndex + 1} de {flowItems.length}
            </span>
            {currentItem.isRealTelemetry && (
              <span className="text-amber-400 font-bold bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-800/40">
                📡 Gasto Real UALÍ
              </span>
            )}
          </div>

          {/* LA TOLVA VISUAL: Escáner láser y Zonas de desvío */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-4 overflow-hidden min-h-[260px] flex flex-col justify-between">
            {/* Escáner Láser horizontal animado */}
            <div className="relative w-full my-1">
              <div
                className={cn(
                  "h-1 w-full bg-gradient-to-r rounded-full shadow-lg transition-all duration-300",
                  laserColor,
                )}
              />
              <div className="flex justify-between text-[9px] font-mono font-bold text-slate-500 mt-1 uppercase">
                <span>← Zona Criocámara</span>
                <span className="text-teal-400">Escáner Nido</span>
                <span>Ranura Titanio →</span>
              </div>
            </div>

            {/* Efectos de Fuga de Aire (Shake/Steam) */}
            {airLeakActive && (
              <div className="absolute inset-0 bg-rose-500/10 pointer-events-none flex items-center justify-center animate-pulse z-30">
                <div className="bg-rose-950/90 border border-rose-500 text-rose-300 px-4 py-2 rounded-2xl font-black text-xs shadow-xl flex items-center gap-2">
                  <AlertTriangle className="size-4 text-rose-400" />
                  <span>¡CHIRRIDO METÁLICO! FUGA DE AIRE EN EL BLINDAJE</span>
                </div>
              </div>
            )}

            {/* Efecto de Congelación */}
            {freezeActive && (
              <div className="absolute inset-0 bg-sky-500/10 pointer-events-none flex items-center justify-center z-30">
                <div className="bg-sky-950/90 border border-sky-400 text-sky-200 px-4 py-2 rounded-2xl font-black text-xs shadow-xl flex items-center gap-2">
                  <Snowflake className="size-4 text-sky-300 animate-spin" />
                  <span>¡CRIOCÁMARA ACTIVADA! DESEO CONGELADO</span>
                </div>
              </div>
            )}

            {/* Efecto Clink */}
            {clinkActive && (
              <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none flex items-center justify-center z-30">
                <div className="bg-emerald-950/90 border border-emerald-400 text-emerald-200 px-4 py-2 rounded-2xl font-black text-xs shadow-xl flex items-center gap-2">
                  <Sparkles className="size-4 text-emerald-300" />
                  <span>¡CLINK! BLINDAJE DE TITANIO REFORZADO</span>
                </div>
              </div>
            )}

            {/* FICHA FLOTANTE CENTRAL INTERACTIVA (Swipeable) */}
            <div
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onTouchStart}
              onMouseMove={onTouchMove}
              onMouseUp={onTouchEnd}
              style={{
                transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.08}deg)`,
                transition: isDragging ? "none" : "transform 0.25s ease-out",
              }}
              className={cn(
                "relative z-20 mx-auto my-3 w-full max-w-[320px] rounded-2xl p-4 cursor-grab active:cursor-grabbing select-none border shadow-2xl transition-colors",
                xRayTurnsRemaining > 0 && currentItem.actualType === "want"
                  ? "bg-purple-950/90 border-purple-400 ring-2 ring-purple-500/50 shadow-purple-500/30"
                  : dragOffset > 40
                    ? "bg-teal-950/80 border-teal-400 shadow-teal-500/20"
                    : dragOffset < -40
                      ? "bg-sky-950/80 border-sky-400 shadow-sky-500/20"
                      : "bg-slate-900 border-slate-700 hover:border-slate-600",
              )}
            >
              {/* Rayo X Banner de advertencia */}
              {xRayTurnsRemaining > 0 && currentItem.actualType === "want" && (
                <div className="mb-2 bg-purple-900/60 border border-purple-400/80 text-purple-200 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 animate-pulse">
                  <Eye className="size-3" />
                  <span>⚠️ Detector Rayo X: Trampa Impulsiva Detectada</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid size-10 place-items-center rounded-xl bg-slate-800 border border-slate-700 text-teal-300 shrink-0">
                    <ShoppingBag className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                      {currentItem.category}
                    </span>
                    <h4 className="text-sm font-black text-slate-100 truncate">
                      {currentItem.name}
                    </h4>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black text-emerald-400 font-mono">
                    ${currentItem.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pistas tácticas */}
              <p className="text-[11px] text-slate-400 mt-2.5 leading-snug">
                {currentItem.explanation}
              </p>

              {/* Indicador visual de arrastre */}
              <div className="mt-3 flex justify-between items-center text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-800">
                <span className={cn(dragOffset < -20 && "text-sky-400 font-black")}>
                  ← Arrastra a Criocámara
                </span>
                <span className={cn(dragOffset > 20 && "text-teal-400 font-black")}>
                  Arrastra a Nido →
                </span>
              </div>
            </div>

            {/* BASE DE LA TOLVA: Criocámara vs Ranura de Nido */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Criocámara (Izquierda) */}
              <button
                type="button"
                onClick={() => handleClassify("want")}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-sky-950/40 border border-sky-800/60 hover:bg-sky-950/70 text-sky-300 text-xs font-black transition active:scale-95 shadow-md"
              >
                <Snowflake className="size-4" />
                <span>Congelar Deseo</span>
              </button>

              {/* Ranura Nido (Derecha) */}
              <button
                type="button"
                onClick={() => handleClassify("need")}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-teal-950/40 border border-teal-800/60 hover:bg-teal-950/70 text-teal-300 text-xs font-black transition active:scale-95 shadow-md"
              >
                <span>Ranura Nido</span>
                <Shield className="size-4" />
              </button>
            </div>
          </div>

          {/* PALANCA DE CALIBRACIÓN / SLIDER DE PRIORIDAD */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCalibrating((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-black text-amber-300 hover:text-amber-200 transition"
              >
                <Sliders className="size-3.5" />
                <span>Palanca de Calibración de Prioridad</span>
              </button>
              <span className="text-[10px] font-bold text-slate-400">
                {isCalibrating ? "Ajuste Activo" : "Para Gastos Híbridos"}
              </span>
            </div>

            {isCalibrating && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-sky-400">Deseo (0%)</span>
                  <span className="text-amber-300 font-mono">{calibrationRatio}% Calibrado</span>
                  <span className="text-teal-400">Necesidad (100%)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={calibrationRatio}
                  onChange={(e) => setCalibrationRatio(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleClassify(calibrationRatio >= 50 ? "need" : "want")}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition shadow"
                  >
                    Fijar Calibración ({calibrationRatio >= 50 ? "Vital" : "Deseo"})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Feedback interactivo de Nido */}
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
            <NidoCharacter className="w-14 h-14 shrink-0" mood={nidoMood} />
            <p className="text-xs text-slate-300 leading-snug">
              {feedbackMessage ||
                "Clasifica con precisión. Si metes un deseo prescindible en mi ranura, sufriré una fuga de aire metálica."}
            </p>
          </div>
        </div>
      )}

      {/* Pantalla GAME OVER */}
      {gameState === "game_over" && (
        <div className="py-6 space-y-4 text-center">
          <div className="flex justify-center">
            <NidoCharacter className="w-24 h-24" mood="worried" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-rose-400">
              ¡Sobrecarga de Deseos en la Ranura!
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              El blindaje de Nido sufrió demasiadas fugas de aire. Confundir deseos efímeros con
              necesidades vitales drena cualquier fondo de reserva.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
          >
            <RotateCcw className="size-4" />
            <span>Recalibrar y Volver a Intentar</span>
          </button>
        </div>
      )}

      {/* Pantalla VICTORIA */}
      {gameState === "victory" && (
        <div className="py-6 space-y-4 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <NidoCharacter className="w-28 h-28" mood="happy" />
              <span className="absolute -top-2 -right-2 text-2xl animate-bounce">🏆</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
              ¡Filtro de Titanio Desbloqueado!
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-100">
              ¡Misión 04 Superada con Éxito!
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Has demostrado maestría separando el oxígeno vital de las luces de bengala. La
              alcancía de Nido conserva su blindaje de titanio al 100%.
            </p>
          </div>

          {/* Recompensas otorgadas */}
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <span className="text-xs text-slate-400 font-bold block">Experiencia</span>
              <span className="text-base font-black text-amber-300">+50 XP</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <span className="text-xs text-slate-400 font-bold block">Tokens FFOS</span>
              <span className="text-base font-black text-teal-300">+75 FFOS</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose || handleRestart}
            className="w-full py-3.5 bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="size-4" />
            <span>Continuar en el Skill Tree</span>
          </button>
        </div>
      )}
    </div>
  );
}
