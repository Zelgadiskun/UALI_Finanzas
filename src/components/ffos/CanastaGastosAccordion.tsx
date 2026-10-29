import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface CanastaItem {
  concepto: string;
  monto: number;
}

export interface CanastaGastosAccordionProps {
  titulo: string;
  montoUtilizado: number;
  montoMaximo: number;
  items?: CanastaItem[];
  defaultOpen?: boolean;
  className?: string;
}

export function CanastaGastosAccordion({
  titulo,
  montoUtilizado = 0,
  montoMaximo = 0,
  items = [],
  defaultOpen = false,
  className = "",
}: CanastaGastosAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Sanitización estricta de variables matemáticas (Zero-Bug Fallback: evita inestabilidad cognitiva por NaN%)
  const safeMontoUtilizado =
    typeof montoUtilizado === "number" && !Number.isNaN(montoUtilizado)
      ? Math.max(0, montoUtilizado)
      : 0;
  const safeMontoMaximo =
    typeof montoMaximo === "number" && !Number.isNaN(montoMaximo) ? Math.max(0, montoMaximo) : 0;

  const baseCalculada = safeMontoMaximo > 0 ? (safeMontoUtilizado / safeMontoMaximo) * 100 : 0;
  const porcentaje =
    Number.isNaN(baseCalculada) || !isFinite(baseCalculada)
      ? 0
      : Math.min(Math.round(baseCalculada), 100);

  // Detección de peligro financiero para aplicar la Ley de Etiología de Fricción Cero
  const esAlertaCritica = porcentaje >= 90;

  // Regla Psicológica: Amortiguación visual ralentizando la transición un 40% en estados estresantes (0.3s * 1.4 = 0.42s)
  const duracionTransicion = esAlertaCritica ? 0.42 : 0.3;

  return (
    <div
      className={`w-full max-w-md mx-auto mb-3 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm transition-colors ${className}`}
    >
      {/* Cabecera del Acordeón (Control de Exposición Progresiva / Anti Data-Dumping) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 focus:outline-none transition-colors hover:bg-slate-800/30 cursor-pointer text-left"
        aria-expanded={isOpen}
      >
        <div className="flex flex-col text-left pr-2 min-w-0">
          <span className="text-sm font-semibold text-slate-200 truncate">{titulo}</span>
          <span className="text-xs text-slate-400 mt-0.5 truncate">
            {/* Zero-Bug Fallback en texto adaptado al bienestar del jugador */}
            {porcentaje === 0
              ? "0% utilizado de tu cupo"
              : `${porcentaje}% consumido de forma consciente`}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Barra de progreso minimalista no punitiva */}
          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${esAlertaCritica ? "bg-amber-500" : "bg-emerald-400"}`}
              initial={{ width: 0 }}
              animate={{ width: `${porcentaje}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Icono indicador con rotación orgánica */}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: duracionTransicion }}
            className="text-slate-400 text-xs inline-block"
            aria-hidden="true"
          >
            ▼
          </motion.span>
        </div>
      </button>

      {/* Contenido Desplegable Seguro (Etiología de Fricción Cero) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duracionTransicion, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="p-4 pt-0 border-t border-slate-800/40 bg-slate-950/30 space-y-2">
              {items.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  No hay transacciones registradas en este ciclo.
                </p>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 text-xs">
                    <span className="text-slate-400 truncate pr-2">{item.concepto}</span>
                    <span className="font-mono font-medium text-slate-300 shrink-0">
                      ${(item.monto || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}

              {/* Balance final macro aclaratorio */}
              <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Total Consumido:</span>
                <span className={esAlertaCritica ? "text-amber-400" : "text-emerald-400"}>
                  ${safeMontoUtilizado.toLocaleString("es-MX", { minimumFractionDigits: 2 })} / $
                  {safeMontoMaximo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CanastaGastosAccordion;
