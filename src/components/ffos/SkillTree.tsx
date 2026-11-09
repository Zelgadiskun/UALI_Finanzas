import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUserId } from "@/lib/supabase/queries";
import { Zap, Sparkles, Trophy, CheckCircle2, PartyPopper } from "lucide-react";

export interface SkillNode {
  id: number;
  titulo: string;
  xp_requerida: number;
  descripcion?: string;
}

// Simulación y catálogo de nodos desde la base de datos (Supabase)
export const NODOS_LECCION: SkillNode[] = [
  { id: 1, titulo: "Diagnóstico de Cortisol", xp_requerida: 0 },
  { id: 2, titulo: "El Escudo de Nido (Ahorro)", xp_requerida: 250 },
  { id: 3, titulo: "Desafío Flash de Toto", xp_requerida: 500 },
  { id: 4, titulo: "Domando Fugas Silenciosas", xp_requerida: 750 },
  { id: 5, titulo: "La Liga de Tiburones", xp_requerida: 1000 },
];

/**
 * Dispara una ráfaga festiva de confeti canvas adaptada a celebraciones de hitos financieros.
 * Utiliza colores asociados a prosperidad y abundancia (esmeralda, oro ámbar, cian y púrpura).
 */
export function fireMilestoneConfetti(coords?: { x?: number; y?: number }) {
  if (typeof window === "undefined") return;

  try {
    if (coords?.x && coords?.y) {
      const originX = Math.max(0.1, Math.min(0.9, coords.x / window.innerWidth));
      const originY = Math.max(0.1, Math.min(0.9, coords.y / window.innerHeight));
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { x: originX, y: originY },
        colors: ["#10b981", "#34d399", "#fbbf24", "#38bdf8", "#a855f7"],
        disableForReducedMotion: true,
      });
    }

    // Doble cañón lateral para el estímulo de dopamina del hito
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 55,
      origin: { x: 0.15, y: 0.75 },
      colors: ["#10b981", "#34d399", "#fbbf24", "#38bdf8", "#818cf8"],
      disableForReducedMotion: true,
    });

    confetti({
      particleCount: 45,
      angle: 120,
      spread: 55,
      origin: { x: 0.85, y: 0.75 },
      colors: ["#10b981", "#34d399", "#fbbf24", "#38bdf8", "#818cf8"],
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.warn("No se pudo disparar confeti canvas:", err);
  }
}

export interface SkillTreeProps {
  userId?: string | null;
  userXP?: number;
  nodos?: SkillNode[];
  onSelectNode?: (nodo: SkillNode) => void;
  onMilestoneReached?: (nodo: SkillNode) => void;
  className?: string;
}

export function SkillTree({
  userId: propUserId,
  userXP: initialUserXP = 0,
  nodos = NODOS_LECCION,
  onSelectNode,
  onMilestoneReached,
  className = "",
}: SkillTreeProps) {
  const currentAuthUserId = useCurrentUserId();
  const effectiveUserId = propUserId ?? currentAuthUserId;

  // Estado local para la XP en tiempo real con Zero-Bug Fallback
  const [userXP, setUserXP] = useState<number>(() =>
    typeof initialUserXP === "number" && !Number.isNaN(initialUserXP)
      ? Math.max(0, initialUserXP)
      : 0,
  );
  const [loading, setLoading] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  // Sincronizar estado local si la prop externa cambia
  useEffect(() => {
    if (typeof initialUserXP === "number" && !Number.isNaN(initialUserXP)) {
      setUserXP(Math.max(0, initialUserXP));
    }
  }, [initialUserXP]);

  // 1. Carga inicial de datos desde Supabase
  useEffect(() => {
    if (!effectiveUserId) return;

    let isMounted = true;
    async function obtenerProgresoInicial() {
      try {
        const { data, error } = await supabase
          .from("user_progress")
          .select("xp")
          .eq("user_id", effectiveUserId!)
          .maybeSingle();

        if (error) {
          console.warn("Aviso cargando progreso inicial Supabase:", error.message);
          return;
        }

        if (isMounted && data && typeof data.xp === "number" && !Number.isNaN(data.xp)) {
          setUserXP(data.xp);
        }
      } catch (err) {
        console.error("Error cargando progreso inicial:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    obtenerProgresoInicial();
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  // 2. Suscripción en Tiempo Real con supabase.channel() y Fallback Dinámico por Polling (>3s / desconexión)
  useEffect(() => {
    if (!effectiveUserId) return;

    let isMounted = true;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    let connectionWatchdogTimer: ReturnType<typeof setTimeout> | null = null;

    // Función de consulta directa de respaldo (fetch / polling a user_progress)
    const ejecutarPollingRespaldo = async () => {
      try {
        console.log(
          `[SkillTree Realtime Fallback] Ejecutando consulta de respaldo (polling) para usuario: ${effectiveUserId}`,
        );
        const { data, error } = await supabase
          .from("user_progress")
          .select("xp")
          .eq("user_id", effectiveUserId)
          .maybeSingle();

        if (error) {
          console.warn(
            "[SkillTree Realtime Fallback] Error en consulta de respaldo:",
            error.message,
          );
          return;
        }

        if (isMounted && data && typeof data.xp === "number" && !Number.isNaN(data.xp)) {
          setUserXP((currentXP) => (currentXP !== data.xp ? data.xp : currentXP));
        }
      } catch (err) {
        console.error("[SkillTree Realtime Fallback] Excepción en polling de respaldo:", err);
      }
    };

    // Iniciar polling si el WebSocket falla o tarda más de 3 segundos
    const activarFallbackPolling = (motivo: string) => {
      console.warn(
        `[SkillTree Realtime] Activando sistema de fallback por polling (Motivo: ${motivo})`,
      );
      if (!fallbackInterval) {
        // Ejecución inmediata y ciclo recurrente de respaldo cada 3.5 segundos
        ejecutarPollingRespaldo();
        fallbackInterval = setInterval(ejecutarPollingRespaldo, 3500);
      }
    };

    const desactivarFallbackPolling = () => {
      if (fallbackInterval) {
        console.log("[SkillTree Realtime] Canal restaurado; desactivando polling de respaldo.");
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }
    };

    // Temporizador guardián: si a los 3 segundos no se ha confirmado SUBSCRIBED, activar polling
    connectionWatchdogTimer = setTimeout(() => {
      if (isMounted) {
        activarFallbackPolling("El WebSocket tardó más de 3 segundos en responder");
      }
    }, 3000);

    // Canal de escucha en tiempo real
    const canalProgreso = supabase
      .channel(`cambios_progreso_${effectiveUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_progress",
          filter: `user_id=eq.${effectiveUserId}`,
        },
        (payload) => {
          console.log("[SkillTree Realtime] Payload recibido en tiempo real:", payload);
          const nuevoRegistro = payload.new as { xp?: number } | undefined;
          if (
            isMounted &&
            nuevoRegistro &&
            typeof nuevoRegistro.xp === "number" &&
            !Number.isNaN(nuevoRegistro.xp)
          ) {
            setUserXP(nuevoRegistro.xp);
          }
        },
      )
      .subscribe((status, err) => {
        console.log(`[SkillTree Realtime] Estado del canal: ${status}`, err || "");

        switch (status) {
          case "SUBSCRIBED":
            console.log(
              `[SkillTree Realtime] SUBSCRIBED: Conexión WebSocket activa para usuario: ${effectiveUserId}`,
            );
            if (connectionWatchdogTimer) {
              clearTimeout(connectionWatchdogTimer);
              connectionWatchdogTimer = null;
            }
            setIsRealtimeActive(true);
            desactivarFallbackPolling();
            break;

          case "CLOSED":
            console.log("[SkillTree Realtime] CLOSED: Conexión de canal cerrada.");
            setIsRealtimeActive(false);
            activarFallbackPolling("Conexión WebSocket cerrada (CLOSED)");
            break;

          case "CHANNEL_ERROR":
            console.error(
              "[SkillTree Realtime] CHANNEL_ERROR: Error crítico en canal WebSocket:",
              err,
            );
            setIsRealtimeActive(false);
            activarFallbackPolling("Fallo en canal de WebSocket (CHANNEL_ERROR)");
            break;

          case "TIMED_OUT":
            console.warn("[SkillTree Realtime] TIMED_OUT: El canal excedió el tiempo de espera.");
            setIsRealtimeActive(false);
            activarFallbackPolling("Tiempo de espera agotado (TIMED_OUT)");
            break;

          default:
            break;
        }
      });

    // Limpieza robusta al desmontar o cambiar userId
    return () => {
      isMounted = false;
      if (connectionWatchdogTimer) clearTimeout(connectionWatchdogTimer);
      if (fallbackInterval) clearInterval(fallbackInterval);
      supabase.removeChannel(canalProgreso);
      setIsRealtimeActive(false);
    };
  }, [effectiveUserId]);

  // Sanitización de Variable Matemática (Zero-Bug Fallback)
  const safeXP = typeof userXP === "number" && !Number.isNaN(userXP) ? Math.max(0, userXP) : 0;

  // Fórmula matemática exacta integrada para los niveles
  const nivelActual = Math.floor(safeXP / 250) + 1;

  // Parámetros de la onda sinusoidal del camino
  const anchoSVG = 500;
  const altoSVG = 800;
  const listaNodos = nodos.length > 0 ? nodos : NODOS_LECCION;
  const pasos = listaNodos.length;

  // Referencia a XP anterior para detectar transiciones de desbloqueo de nodo
  const prevXPRef = useRef<number | null>(null);
  const [celebratingNode, setCelebratingNode] = useState<SkillNode | null>(null);

  // Detección automática al alcanzar el siguiente nodo en el árbol de habilidades
  useEffect(() => {
    // Primera carga o línea base: registramos la XP actual sin disparar confeti retrospectivo
    if (prevXPRef.current === null) {
      prevXPRef.current = safeXP;
      return;
    }

    const previousXP = prevXPRef.current;
    if (safeXP > previousXP) {
      // Identificar si algún nodo pasó de bloqueado a desbloqueado/alcanzado
      const nuevosNodosDesbloqueados = listaNodos.filter(
        (nodo) => previousXP < nodo.xp_requerida && safeXP >= nodo.xp_requerida,
      );

      if (nuevosNodosDesbloqueados.length > 0) {
        const nodoAlcanzado = nuevosNodosDesbloqueados[nuevosNodosDesbloqueados.length - 1];
        setCelebratingNode(nodoAlcanzado);
        fireMilestoneConfetti();

        if (onMilestoneReached) {
          onMilestoneReached(nodoAlcanzado);
        }

        const timer = window.setTimeout(() => {
          setCelebratingNode(null);
        }, 6000);
        return () => window.clearTimeout(timer);
      }
    }
    prevXPRef.current = safeXP;
  }, [safeXP, listaNodos, onMilestoneReached]);

  // Siguiente nodo en la ruta de aprendizaje
  const siguienteNodo = listaNodos.find((n) => safeXP < n.xp_requerida);
  const faltaXP = siguienteNodo ? Math.max(0, siguienteNodo.xp_requerida - safeXP) : 0;

  // Cálculo de progreso hacia el siguiente hito con Zero-Bug Fallback
  const xpBaseSiguiente = siguienteNodo?.xp_requerida ?? (safeXP > 0 ? safeXP : 1000);
  const porcentaje = xpBaseSiguiente > 0 ? (safeXP / xpBaseSiguiente) * 100 : 0;
  const renderPorcentaje = Number.isNaN(porcentaje) ? 0 : porcentaje;

  // Generar los puntos coordenados de la curva sinusoidal
  const puntos = Array.from({ length: 100 }, (_, i) => {
    const y = (i / 99) * (altoSVG - 120) + 60;
    // Función seno para generar el zigzag orgánico y fluido
    const x = Math.sin((y / altoSVG) * Math.PI * 3) * 110 + anchoSVG / 2;
    return `${x},${y}`;
  }).join(" ");

  // Calcular la posición exacta de cada nodo sobre la onda
  const obtenerCoordenadasNodo = (index: number) => {
    const divisor = Math.max(1, pasos - 1);
    const y = (index / divisor) * (altoSVG - 120) + 60;
    const x = Math.sin((y / altoSVG) * Math.PI * 3) * 110 + anchoSVG / 2;
    return { x, y };
  };

  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto bg-slate-950 p-12 rounded-3xl text-center border border-slate-900 shadow-2xl">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 mt-4">Sincronizando con el servidor seguro...</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full max-w-lg mx-auto bg-slate-950 p-6 rounded-3xl overflow-hidden shadow-2xl border border-slate-900 ${className}`}
    >
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-xs">
            NIVEL {nivelActual}
          </span>
          {isRealtimeActive && (
            <span
              className="text-[10px] font-bold text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse"
              title="Suscripción Supabase Realtime activa (<100ms)"
            >
              <Zap className="size-2.5 text-teal-400 fill-current" />
              <span>Realtime</span>
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-slate-100 mt-2 tracking-tight">
          Tu Mapa de Resiliencia Realtime
        </h2>
        <p className="text-xs text-slate-400 mt-1">{safeXP} XP Acumulada</p>

        {/* Tracker del Siguiente Hito */}
        {siguienteNodo ? (
          <div className="mt-3 p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-left flex items-center justify-between gap-2 shadow-xs">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                  <Sparkles className="size-3 shrink-0" />
                  <span className="truncate">Siguiente Hito: {siguienteNodo.titulo}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                  {Math.round(renderPorcentaje)}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                Faltan {faltaXP} XP para alcanzar este logro
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, renderPorcentaje))}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                // Simular el alcance del siguiente nodo para festejar con confeti
                const nuevaXP = siguienteNodo.xp_requerida;
                setUserXP(nuevaXP);
                setCelebratingNode(siguienteNodo);
                fireMilestoneConfetti();
                if (onMilestoneReached) {
                  onMilestoneReached(siguienteNodo);
                }
              }}
              className="px-2.5 py-1 text-[10px] sm:text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl transition cursor-pointer shrink-0 active:scale-95 flex items-center gap-1"
              title="Simular alcance del siguiente hito para festejar con confeti"
            >
              <PartyPopper className="size-3" />
              <span>Probar Hito</span>
            </button>
          </div>
        ) : (
          <div className="mt-3 p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
            <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              <span>¡Completaste todos los hitos del mapa de resiliencia!</span>
            </p>
          </div>
        )}

        {/* Notificación de Celebración con Dopamina Visual */}
        <AnimatePresence>
          {celebratingNode && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mt-3 p-3 bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-amber-500/25 border border-emerald-400/40 rounded-2xl shadow-xl flex items-center justify-between gap-2.5 text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-9 rounded-xl bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center text-lg shrink-0">
                  <Trophy className="size-5 text-amber-300 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-wider text-emerald-400 uppercase">
                    ¡Hito Financiero Alcanzado!
                  </p>
                  <p className="text-xs font-extrabold text-slate-100 truncate">
                    {celebratingNode.titulo}
                  </p>
                  <p className="text-[10px] text-slate-300">
                    {celebratingNode.xp_requerida} XP Requerida dominada con éxito
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => fireMilestoneConfetti()}
                  className="px-2 py-1 text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                  title="Disparar más confeti"
                >
                  <PartyPopper className="size-3" />
                  <span>Celebrar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCelebratingNode(null)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition rounded-lg hover:bg-slate-800 cursor-pointer"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative justify-center flex">
        <svg
          viewBox={`0 0 ${anchoSVG} ${altoSVG}`}
          className="w-full h-auto max-h-[70vh] select-none"
        >
          {/* Línea base del camino (Bloqueado / Inactivo) */}
          <polyline
            points={puntos}
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Renderizado de Nodos */}
          {listaNodos.map((nodo, index) => {
            const { x, y } = obtenerCoordenadasNodo(index);
            const estaDesbloqueado = safeXP >= nodo.xp_requerida;
            const esSiguiente =
              safeXP < nodo.xp_requerida &&
              (index === 0 || safeXP >= listaNodos[index - 1].xp_requerida);
            const esCelebrando = celebratingNode?.id === nodo.id;

            const isRightSide = x > anchoSVG / 2;
            const labelX = isRightSide ? x - 180 : x + 38;
            const textAlignClass = isRightSide ? "text-right pr-2" : "text-left pl-2";

            const handleClick = (e: React.MouseEvent) => {
              if (onSelectNode && (estaDesbloqueado || esSiguiente)) {
                onSelectNode(nodo);
              }
              if (estaDesbloqueado) {
                fireMilestoneConfetti({ x: e.clientX, y: e.clientY });
              }
            };

            return (
              <g
                key={nodo.id}
                onClick={handleClick}
                className={
                  estaDesbloqueado || esSiguiente ? "cursor-pointer" : "cursor-not-allowed"
                }
              >
                {/* Aura festiva al celebrar el hito alcanzado */}
                {esCelebrando && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="40"
                    className="fill-emerald-400/20 stroke-emerald-400"
                    strokeWidth="2.5"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.25, 1], opacity: [0.9, 0.3, 0.9] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Aura pulsante del siguiente hito en camino */}
                {esSiguiente && !esCelebrando && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="36"
                    className="fill-amber-400/10 stroke-amber-400/50"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Niebla de Guerra Dinámica */}
                {!estaDesbloqueado && (
                  <circle
                    cx={x}
                    cy={y}
                    r="45"
                    className="fill-slate-950/40 backdrop-blur-md stroke-slate-800"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Transición fluida cuando cambia el estado por la suscripción */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r="28"
                  className={`${
                    estaDesbloqueado
                      ? "fill-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer"
                      : esSiguiente
                        ? "fill-amber-500/30 stroke-amber-400 stroke-2 cursor-pointer"
                        : "fill-slate-800 cursor-not-allowed"
                  }`}
                  animate={estaDesbloqueado ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  whileHover={
                    estaDesbloqueado || esSiguiente
                      ? { scale: 1.15, transition: { type: "spring", stiffness: 400, damping: 15 } }
                      : {}
                  }
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />

                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  className="text-xs font-bold fill-slate-950 select-none pointer-events-none"
                >
                  {estaDesbloqueado ? "✓" : esSiguiente ? "●" : "🔒"}
                </text>

                {/* Etiqueta del Nodo con Contención Cognitiva y Transición Suave */}
                <foreignObject x={labelX} y={y - 22} width="160" height="54">
                  <div
                    className={`${textAlignClass} transition-all duration-500 ${
                      estaDesbloqueado
                        ? "text-slate-200"
                        : esSiguiente
                          ? "text-amber-400 font-medium"
                          : "text-slate-600 select-none filter blur-[1px]"
                    }`}
                  >
                    <p className="text-xs font-bold leading-tight">{nodo.titulo}</p>
                    <p className="text-[10px] text-slate-500">{nodo.xp_requerida} XP</p>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export const SkillTreeRealtime = SkillTree;
export default SkillTree;
