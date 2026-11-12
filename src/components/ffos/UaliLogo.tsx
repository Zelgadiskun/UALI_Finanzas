import React from "react";
import { cn } from "@/lib/utils";

interface UaliLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showSubtitle?: boolean;
  variant?: "brand" | "clay" | "gold" | "minimal";
}

/**
 * UALÍ Finanzas — Brandmark & Identidad de Marca
 * Símbolo: "El Sello de Babilonia" — Vasija de arcilla ancestral (Nido)
 * abrazando la semilla solar de oro (la décima parte guardada, 590 a.C.).
 */
export function UaliLogo({
  className,
  size = "md",
  showText = true,
  showSubtitle = false,
  variant = "brand",
}: UaliLogoProps) {
  const sizeMap = {
    sm: "size-7",
    md: "size-9",
    lg: "size-11",
    xl: "size-14",
  };

  const textMap = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Isotipo: Sello geométrico Nido + Oro solar */}
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 rounded-2xl transition-transform",
          sizeMap[size],
        )}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md overflow-visible"
        >
          <defs>
            {/* Gradiente Arcilla / Turquesa Ishtar */}
            <linearGradient id="uali-teal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2DD4BF" />
              <stop offset="50%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#115E59" />
            </linearGradient>

            {/* Gradiente Oro Solar Babilónico */}
            <linearGradient id="uali-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Sombra suave de arcilla */}
            <filter id="uali-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="#0D9488"
                floodOpacity="0.35"
              />
            </filter>
          </defs>

          {/* Base / Vasija de Arcilla Sagrada */}
          <rect
            x="4"
            y="4"
            width="40"
            height="40"
            rx="12"
            fill="#09141F"
            stroke="url(#uali-teal-grad)"
            strokeWidth="1.8"
          />

          {/* Arco de Ishtar / Vasija Nido estilizada */}
          <path
            d="M14 18 C14 13 18 10 24 10 C30 10 34 13 34 18 C34 23 38 27 38 33 C38 37 34 39 24 39 C14 39 10 37 10 33 C10 27 14 23 14 18 Z"
            fill="url(#uali-teal-grad)"
            opacity="0.88"
          />

          {/* Ranura del Tesoro / Vasija de Arcilla */}
          <rect x="20" y="13" width="8" height="2" rx="1" fill="#042F2E" />

          {/* La Décima Parte de Oro: Semilla Solar Central */}
          <circle
            cx="24"
            cy="27"
            r="7.5"
            fill="url(#uali-gold-grad)"
            stroke="#B45309"
            strokeWidth="1.2"
          />

          {/* Centro Radiante */}
          <circle cx="24" cy="27" r="4" fill="#FEF3C7" opacity="0.9" />

          {/* Micro-chispita de Babilonia */}
          <path
            d="M33 13 L34 15.5 L36.5 16.5 L34 17.5 L33 20 L32 17.5 L29.5 16.5 L32 15.5 Z"
            fill="#FDE68A"
          />
        </svg>
      </div>

      {/* Logotipo Tipográfico */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={cn("font-black tracking-tight text-slate-100 font-sans", textMap[size])}
            >
              UALÍ
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/30">
              Finanzas
            </span>
          </div>

          {showSubtitle && (
            <span className="text-[10px] font-semibold text-slate-400 tracking-tight mt-0.5">
              En calma y en compañía
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default UaliLogo;
