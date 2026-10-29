import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GuardianNidoProps {
  porcentajeAhorro?: number;
  isError?: boolean;
  className?: string;
}

export function GuardianNido({
  porcentajeAhorro = 0,
  isError = false,
  className,
}: GuardianNidoProps) {
  // Sanitización de Variables Matemáticas (Zero-Bug Fallback)
  const safePercentage =
    typeof porcentajeAhorro === "number" && !Number.isNaN(porcentajeAhorro)
      ? Math.max(0, porcentajeAhorro)
      : 0;

  // Disparar recompensa de dopamina inmediata si se llega a la meta
  useEffect(() => {
    if (safePercentage >= 100 && !isError) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    }
  }, [safePercentage, isError]);

  /**
   * Regla de Etiología de Fricción Cero:
   * Cualquier animación de error debe durar un 40% más de tiempo de transición (suavizado) que las de victoria.
   * Victoria: duration = 0.30s
   * Error / Alerta: 0.30s * 1.40 = 0.42s (transición lenta y fluida en tonos ámbar que amortiguan la mala noticia financiera).
   */
  const victoryTransition = {
    duration: 0.3,
    ease: [0.22, 1, 0.36, 1] as const, // Salida suave y ágil
  };

  const alertFrictionZeroTransition = {
    duration: 0.42, // +40% de duración respecto a victoria (0.3 * 1.4 = 0.42)
    ease: [0.4, 0, 0.2, 1] as const, // Easing suave y prolongado
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl transition-colors duration-500",
        isError ? "border-amber-500/30 bg-slate-900/95" : "border-emerald-500/20",
        className,
      )}
    >
      <div className="relative w-32 h-32 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isError ? (
            // Escudo Visual: El cerdito Nido en modo alerta amigable (Sanitización de UI)
            // Regla de Etiología de Fricción Cero: duration 0.42s (+40%) en tonos ámbar
            <motion.svg
              key="alerta"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={alertFrictionZeroTransition}
              viewBox="0 0 100 100"
              className="w-full h-full text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.25)]"
              aria-label="Guardián Nido en alerta protectora"
            >
              {/* Resplandor y halo suave */}
              <circle cx="50" cy="50" r="42" fill="currentColor" opacity="0.12" />

              {/* Orejas de Titanio protectoras */}
              <path
                d="M26 30 L34 16 L42 28 Z"
                fill="currentColor"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M74 30 L66 16 L58 28 Z"
                fill="currentColor"
                opacity="0.6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Cabeza / Cuerpo acorazado */}
              <circle
                cx="50"
                cy="52"
                r="38"
                fill="#0F172A"
                stroke="currentColor"
                strokeWidth="3.5"
              />

              {/* Visor de alerta de Titanio (ojos atentos) */}
              <circle cx="38" cy="45" r="4.5" fill="currentColor" />
              <circle cx="62" cy="45" r="4.5" fill="currentColor" />
              <circle cx="40" cy="43.5" r="1.5" fill="#0F172A" />
              <circle cx="64" cy="43.5" r="1.5" fill="#0F172A" />

              {/* Hocico / Cerrojo metálico */}
              <rect
                x="37"
                y="54"
                width="26"
                height="18"
                rx="8"
                fill="currentColor"
                opacity="0.3"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <circle cx="45" cy="63" r="2" fill="currentColor" />
              <circle cx="55" cy="63" r="2" fill="currentColor" />

              {/* Escudo protector exterior en forma de arco (amortigua cortisol) */}
              <path
                d="M24 48 C 24 72, 76 72, 76 48"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="4 3"
                fill="none"
                opacity="0.75"
              />
            </motion.svg>
          ) : (
            // Victoria / Progreso: Nido feliz (0.30s de duración ágil)
            <motion.svg
              key="feliz"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={victoryTransition}
              viewBox="0 0 100 100"
              className="w-full h-full text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]"
              aria-label="Guardián Nido satisfecho y sonriente"
            >
              {/* Resplandor de victoria */}
              <circle cx="50" cy="50" r="42" fill="currentColor" opacity="0.15" />

              {/* Orejas de cerdito sonrientes */}
              <path
                d="M26 30 L34 16 L42 28 Z"
                fill="currentColor"
                opacity="0.8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M74 30 L66 16 L58 28 Z"
                fill="currentColor"
                opacity="0.8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Cuerpo / Cabeza de Titanio */}
              <circle
                cx="50"
                cy="52"
                r="38"
                fill="#0F172A"
                stroke="currentColor"
                strokeWidth="3.5"
              />

              {/* Ojos alegres y guiñando felicidad */}
              <path
                d="M33 46 Q38 41 43 46"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M57 46 Q62 41 67 46"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />

              {/* Sonrisa del cerdito Nido */}
              <path
                d="M34 68 Q50 82 66 68"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />

              {/* Hocico */}
              <rect
                x="37"
                y="52"
                width="26"
                height="16"
                rx="8"
                fill="currentColor"
                opacity="0.35"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="45" cy="60" r="1.8" fill="currentColor" />
              <circle cx="55" cy="60" r="1.8" fill="currentColor" />

              {/* Corona / Destello de ahorro al 100% */}
              {safePercentage >= 100 && (
                <path d="M44 14 L50 6 L56 14 Z" fill="#F6BE22" stroke="#F6BE22" strokeWidth="1.5" />
              )}
            </motion.svg>
          )}
        </AnimatePresence>
      </div>

      {/* Sanitización de Variables Matemáticas (Zero-Bug Fallback) */}
      <h3
        className={cn(
          "mt-4 text-sm font-bold tracking-tight transition-colors duration-300",
          isError ? "text-amber-400" : "text-emerald-300",
        )}
      >
        {isError
          ? "0% utilizado de tu cupo"
          : `${Number.isNaN(safePercentage) ? 0 : safePercentage}% Protegido`}
      </h3>

      {/* Explicación de amortiguación cognitiva no punitiva */}
      <p className="mt-1 text-xs text-slate-400 text-center max-w-xs font-medium">
        {isError
          ? "Modo protección activo: Nido refuerza el escudo sin penalizarte."
          : safePercentage >= 100
            ? "¡Meta alcanzada! El escudo de Nido está al máximo de titanio."
            : "Aportes blindados en la reserva de resguardo familiar."}
      </p>
    </div>
  );
}

export default GuardianNido;
