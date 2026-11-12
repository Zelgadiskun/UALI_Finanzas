import React from "react";

/**
 * UALÍ Finanzas 3.0 — Universo Unificado de Personajes y Marca (Regla 70·20·10)
 *
 * Todos los vectores comparten exactamente el mismo ADN de 4 colores:
 * - Alabastro Cálido: #F7F5F0
 * - Azul Pizarra Profundo: #1B263B (trazos, ojos y estructura)
 * - Verde Salvia Esmeralda: #1F7A68 (estabilidad, ahorro y visión)
 * - Terracota Cálido: #E06D53 (energía, colaboración y foco)
 */

export function UaliBrandLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-[#E3F2EE] dark:bg-[#1F7A68]/20 border border-[#1F7A68]/30 shrink-0 ${className}`}
    >
      <svg className="w-4/5 h-4/5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Tallo y brote de crecimiento en Verde Salvia */}
        <path d="M24 22V10" stroke="#1B263B" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M24 12C24 8 29 5 34 7C34 12 29 15 24 12Z"
          fill="#1F7A68"
          stroke="#1B263B"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M24 16C24 13 19 10 15 12C15 16 19 19 24 16Z"
          fill="#1F7A68"
          stroke="#1B263B"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Moneda cálida en Terracota */}
        <circle cx="29" cy="24" r="6.5" fill="#E06D53" stroke="#1B263B" strokeWidth="2.2" />
        {/* Nido protector */}
        <path
          d="M9 26C11 36 18 41 25 41C33 41 39 35 40 26C34 31 25 32 9 26Z"
          fill="#E06D53"
          stroke="#1B263B"
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
        <path d="M11 29C17 34 27 35 38 29" stroke="#F7F5F0" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/**
 * NIDO: El Cerdito Guardián (Finanzas Personales, Presupuesto y Fondo de Paz)
 */
export function NidoCharacter({
  className = "w-24 h-24",
  mood = "happy",
}: {
  className?: string;
  mood?: "happy" | "worried";
}) {
  const isWorried = mood === "worried";
  return (
    <div
      className={`relative flex items-center justify-center ${
        isWorried ? "animate-worry" : "animate-float"
      } ${className}`}
    >
      <svg
        className="w-full h-full overflow-visible"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Nido, el cerdito guardián del ahorro"
      >
        {/* Sombra base */}
        <ellipse cx="60" cy="110" rx="30" ry="5" fill="#1B263B" fillOpacity="0.12" />
        {/* Orejas de cerdito */}
        <path
          d="M32 38 C20 26 18 42 28 48 Z"
          fill="#F7F5F0"
          stroke="#1B263B"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M29 38 C24 33 23 41 28 44 Z" fill="#E06D53" />
        <path
          d="M88 38 C100 26 102 42 92 48 Z"
          fill="#F7F5F0"
          stroke="#1B263B"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M91 38 C96 33 97 41 92 44 Z" fill="#E06D53" />
        {/* Cuerpo redondeado en Alabastro Cálido */}
        <rect
          x="26"
          y="30"
          width="68"
          height="72"
          rx="34"
          fill="#F7F5F0"
          stroke="#1B263B"
          strokeWidth="3"
        />
        {/* Patitas */}
        <rect x="38" y="96" width="12" height="10" rx="5" fill="#1B263B" />
        <rect x="70" y="96" width="12" height="10" rx="5" fill="#1B263B" />
        {/* Pañuelo / Bandana en Verde Salvia (#1F7A68) */}
        <path
          d="M29 70 Q60 82 91 70 L60 88 Z"
          fill="#1F7A68"
          stroke="#1B263B"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d="M29 70 L18 65 L23 76 Z"
          fill="#1F7A68"
          stroke="#1B263B"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Cejas expresivas si está alerta */}
        {isWorried && (
          <>
            <path
              d="M38 43 Q44 40 49 44"
              fill="none"
              stroke="#1B263B"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M82 43 Q76 40 71 44"
              fill="none"
              stroke="#1B263B"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        )}
        {/* Ojos en Azul Pizarra */}
        <circle cx="44" cy="52" r="4.5" fill="#1B263B" />
        <circle cx="42.5" cy="50.5" r="1.5" fill="#F7F5F0" />
        <circle cx="76" cy="52" r="4.5" fill="#1B263B" />
        <circle cx="74.5" cy="50.5" r="1.5" fill="#F7F5F0" />
        {/* Mejillas en Terracota */}
        <ellipse cx="36" cy="59" rx="5" ry="2.8" fill="#E06D53" fillOpacity="0.65" />
        <ellipse cx="84" cy="59" rx="5" ry="2.8" fill="#E06D53" fillOpacity="0.65" />
        {/* Trompita de cerdito en Terracota Cálido */}
        <rect
          x="49"
          y="51"
          width="22"
          height="14"
          rx="7"
          fill="#E06D53"
          stroke="#1B263B"
          strokeWidth="2.6"
        />
        <ellipse cx="56" cy="58" rx="2" ry="3" fill="#1B263B" />
        <ellipse cx="64" cy="58" rx="2" ry="3" fill="#1B263B" />
        {/* Moneda Escudo en Verde Salvia que sostiene */}
        <circle cx="60" cy="90" r="9.5" fill="#1F7A68" stroke="#1B263B" strokeWidth="2.5" />
        <circle cx="60" cy="90" r="4" fill="#F7F5F0" />
      </svg>
    </div>
  );
}

/**
 * CHISPA: La Zorrita / Vixen de Equidad (Finanzas Familiares, Pareja y Equipo)
 */
export function ChispaCharacter({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center animate-float ${className}`}>
      <svg
        className="w-full h-full overflow-visible"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Chispa, la zorrita mentora de finanzas en familia y equipo"
      >
        <ellipse cx="60" cy="110" rx="30" ry="5" fill="#1B263B" fillOpacity="0.12" />
        {/* Cola esponjosa en Terracota + punta Alabastro */}
        <path
          d="M82 92 C108 90 114 64 98 56 C90 64 88 76 80 84 Z"
          fill="#E06D53"
          stroke="#1B263B"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d="M98 56 C106 60 107 69 101 73 C96 69 94 63 98 56 Z"
          fill="#F7F5F0"
          stroke="#1B263B"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Cuerpo en Terracota */}
        <rect
          x="36"
          y="64"
          width="44"
          height="38"
          rx="18"
          fill="#E06D53"
          stroke="#1B263B"
          strokeWidth="2.8"
        />
        {/* Pecho Alabastro */}
        <path d="M46 66 Q60 76 74 66 L70 96 Q60 100 50 96 Z" fill="#F7F5F0" />
        {/* Patitas */}
        <rect x="41" y="96" width="11" height="10" rx="5" fill="#1B263B" />
        <rect x="64" y="96" width="11" height="10" rx="5" fill="#1B263B" />
        {/* Orejas de zorrita */}
        <path
          d="M31 44 L26 17 L49 31 Z"
          fill="#E06D53"
          stroke="#1B263B"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path d="M33 40 L30 23 L44 32 Z" fill="#F7F5F0" />
        <path
          d="M85 44 L90 17 L67 31 Z"
          fill="#E06D53"
          stroke="#1B263B"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path d="M83 40 L86 23 L72 32 Z" fill="#F7F5F0" />
        {/* Cabeza */}
        <path
          d="M26 52 C26 33 42 26 58 26 C74 26 90 33 90 52 C90 64 74 70 58 70 C42 70 26 64 26 52 Z"
          fill="#E06D53"
          stroke="#1B263B"
          strokeWidth="2.8"
        />
        <path d="M27 53 Q42 50 58 66 Q38 69 27 53 Z" fill="#F7F5F0" />
        <path d="M89 53 Q74 50 58 66 Q78 69 89 53 Z" fill="#F7F5F0" />
        {/* Ojos y nariz */}
        <circle cx="44" cy="48" r="4.5" fill="#1B263B" />
        <circle cx="42.5" cy="46.5" r="1.5" fill="#F7F5F0" />
        <circle cx="72" cy="48" r="4.5" fill="#1B263B" />
        <circle cx="70.5" cy="46.5" r="1.5" fill="#F7F5F0" />
        <ellipse cx="58" cy="57" rx="4" ry="3" fill="#1B263B" />
        {/* Brújula de Equidad en Verde Salvia (#1F7A68) */}
        <circle cx="58" cy="84" r="10.5" fill="#F7F5F0" stroke="#1F7A68" strokeWidth="3" />
        <polygon points="58,77 62,84 58,91 54,84" fill="#E06D53" />
        <circle cx="58" cy="84" r="2" fill="#1B263B" />
      </svg>
    </div>
  );
}

/**
 * TOTO: El Camaleón / Geco Estratega (Simulador de Casos y Visión 360°)
 */
export function TotoCharacter({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center animate-float ${className}`}
      style={{ animationDelay: "0.8s" }}
    >
      <svg
        className="w-full h-full overflow-visible"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Toto, el camaleón estratega del simulador de casos"
      >
        <ellipse cx="58" cy="110" rx="30" ry="5" fill="#1B263B" fillOpacity="0.12" />
        {/* Cola espiral ágil en Verde Salvia */}
        <path
          d="M74 92 C98 96 108 76 96 66 C88 60 78 68 83 76 C86 81 93 78 91 73"
          fill="none"
          stroke="#1F7A68"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M74 92 C98 96 108 76 96 66 C88 60 78 68 83 76 C86 81 93 78 91 73"
          fill="none"
          stroke="#1B263B"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* Cresta dorsal en Terracota */}
        <path
          d="M68 24 C78 30 78 46 72 56"
          fill="none"
          stroke="#E06D53"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="3 6"
        />
        {/* Cuerpo ágil en Verde Salvia (#1F7A68) */}
        <path
          d="M38 60 C36 78 40 96 56 96 C72 96 76 80 72 60 Z"
          fill="#1F7A68"
          stroke="#1B263B"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        {/* Pecho en Terracota Cálido (#E06D53) */}
        <path d="M44 62 C44 78 47 92 56 92 C63 92 65 78 64 62 Z" fill="#E06D53" />
        {/* Patitas */}
        <rect
          x="40"
          y="95"
          width="11"
          height="10"
          rx="5"
          fill="#1F7A68"
          stroke="#1B263B"
          strokeWidth="2.5"
        />
        <rect
          x="59"
          y="95"
          width="11"
          height="10"
          rx="5"
          fill="#1F7A68"
          stroke="#1B263B"
          strokeWidth="2.5"
        />
        {/* Cabeza de Camaleón / Geco */}
        <path
          d="M28 48 C28 30 48 18 64 22 C74 25 76 38 72 52 C68 62 30 62 28 48 Z"
          fill="#1F7A68"
          stroke="#1B263B"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d="M32 53 Q48 60 64 52"
          fill="none"
          stroke="#1B263B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Gafas redondas en Azul Pizarra (#1B263B) */}
        <circle cx="42" cy="42" r="9.5" fill="#F7F5F0" stroke="#1B263B" strokeWidth="3" />
        <circle cx="42" cy="42" r="4" fill="#1B263B" />
        <circle cx="40.5" cy="40.5" r="1.5" fill="#F7F5F0" />
        <circle cx="63" cy="42" r="9.5" fill="#F7F5F0" stroke="#1B263B" strokeWidth="3" />
        <circle cx="63" cy="42" r="4" fill="#1B263B" />
        <circle cx="61.5" cy="40.5" r="1.5" fill="#F7F5F0" />
        <line x1="51.5" y1="42" x2="53.5" y2="42" stroke="#1B263B" strokeWidth="3" />
        {/* Pergamino de Simulación */}
        <g transform="rotate(-18 56 78)">
          <rect
            x="46"
            y="72"
            width="22"
            height="10"
            rx="4"
            fill="#F7F5F0"
            stroke="#1B263B"
            strokeWidth="2.4"
          />
          <line x1="53" y1="72" x2="53" y2="82" stroke="#E06D53" strokeWidth="2.5" />
        </g>
      </svg>
    </div>
  );
}
