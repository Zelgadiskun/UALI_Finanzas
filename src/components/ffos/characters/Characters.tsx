export function ChispaCharacter({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center animate-float ${className}`}>
      <svg className="w-full h-full drop-shadow-md overflow-visible" viewBox="0 0 140 140">
        {/* Chispas laterales */}
        <path
          d="M22 45 L25 55 L35 58 L25 61 L22 71 L19 61 L9 58 L19 55 Z"
          fill="#F6BE22"
          opacity="0.85"
        />
        <path
          d="M120 75 L122 83 L130 85 L122 87 L120 95 L118 87 L110 85 L118 83 Z"
          fill="#F6BE22"
          opacity="0.8"
        />
        {/* Piernitas */}
        <path
          d="M52 114 L50 128 L42 130"
          fill="none"
          stroke="#501A8A"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="6"
        />
        <path
          d="M88 114 L90 128 L98 130"
          fill="none"
          stroke="#501A8A"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="6"
        />
        {/* Bracitos alegres */}
        <path
          d="M38 88 Q20 78 28 65"
          fill="none"
          stroke="#7A39B8"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path
          d="M102 88 Q120 78 112 65"
          fill="none"
          stroke="#7A39B8"
          strokeLinecap="round"
          strokeWidth="5"
        />
        {/* Cuerpo triangular morado Chispa (#7952B3) */}
        <polygon
          fill="#7952B3"
          points="70,22 118,114 22,114"
          stroke="#68399E"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {/* Estrella dorada en la cima */}
        <g transform="translate(70, 20) scale(0.95)">
          <path
            d="M0 -18 C1 -6 6 -1 18 0 C6 1 1 6 0 18 C-1 6 -6 1 -18 0 C-6 -1 -1 -6 0 -18 Z"
            fill="#F6BE22"
            stroke="#D99B08"
            strokeWidth="2"
          />
        </g>
        {/* Ojos brillantes redondos */}
        <g transform="translate(54, 76)">
          <circle cx="0" cy="0" fill="#FFFFFF" r="7.5" />
          <circle cx="1.2" cy="0.5" fill="#1E0E38" r="4.2" />
          <circle cx="-1" cy="-2" fill="#FFFFFF" r="2.2" />
        </g>
        <g transform="translate(86, 76)">
          <circle cx="0" cy="0" fill="#FFFFFF" r="7.5" />
          <circle cx="-1.2" cy="0.5" fill="#1E0E38" r="4.2" />
          <circle cx="-3.4" cy="-2" fill="#FFFFFF" r="2.2" />
        </g>
        {/* Cejitas curvas */}
        <path
          d="M47 65 Q54 62 61 66"
          fill="none"
          stroke="#481880"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <path
          d="M93 65 Q86 62 79 66"
          fill="none"
          stroke="#481880"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        {/* Boca alegre */}
        <path d="M63 88 Q70 97 77 88 Z" fill="#4B0F75" />
        <path d="M65 91 Q70 96 75 91" fill="#FF708F" />
      </svg>
    </div>
  );
}

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
      className={`relative flex items-center justify-center ${isWorried ? "animate-worry" : "animate-float"} ${className}`}
      style={{ animationDelay: "0.5s" }}
    >
      <svg className="w-full h-full drop-shadow-md overflow-visible" viewBox="0 0 140 140">
        {/* Orejitas aro doradas */}
        <ellipse
          cx="38"
          cy={isWorried ? 40 : 38}
          fill="#20B2AA"
          rx={isWorried ? 9.5 : 10}
          ry={isWorried ? 11.5 : 12}
          stroke="#107C74"
          strokeWidth="2"
          transform={isWorried ? "rotate(-28 38 40)" : "rotate(-20 38 38)"}
        />
        <ellipse
          cx="38"
          cy={isWorried ? 40 : 38}
          fill="#F59E0B"
          rx={isWorried ? 5 : 5.5}
          ry={isWorried ? 6.5 : 7}
          stroke="#D97706"
          strokeWidth="1.8"
          transform={isWorried ? "rotate(-28 38 40)" : "rotate(-20 38 38)"}
        />
        <ellipse
          cx="102"
          cy={isWorried ? 40 : 38}
          fill="#20B2AA"
          rx={isWorried ? 9.5 : 10}
          ry={isWorried ? 11.5 : 12}
          stroke="#107C74"
          strokeWidth="2"
          transform={isWorried ? "rotate(28 102 40)" : "rotate(20 102 38)"}
        />
        <ellipse
          cx="102"
          cy={isWorried ? 40 : 38}
          fill="#F59E0B"
          rx={isWorried ? 5 : 5.5}
          ry={isWorried ? 6.5 : 7}
          stroke="#D97706"
          strokeWidth="1.8"
          transform={isWorried ? "rotate(28 102 40)" : "rotate(20 102 38)"}
        />
        {/* Ranura para monedas en la cabeza */}
        <rect fill="#0C655E" height="3" rx="1.5" width="16" x="62" y="30" />
        {/* Cuerpo de pera turquesa (#2EC4B6) */}
        <path
          d="M70 32 C50 32 44 48 42 66 C38 82 32 94 36 112 C40 126 56 130 70 130 C84 130 100 126 104 112 C108 94 102 82 98 66 C96 48 90 32 70 32 Z"
          fill="#2EC4B6"
          stroke="#1EA89B"
          strokeWidth="2.5"
        />
        {/* Moneda dorada que abraza en la panza */}
        <circle cx="70" cy="98" fill="#F59E0B" r="21" stroke="#D97706" strokeWidth="2.5" />
        <circle cx="70" cy="98" fill="#FCD34D" r="15" />
        <rect fill="#D97706" height="8" opacity="0.6" rx="2" width="8" x="66" y="94" />
        {/* Patitas abrazando la moneda */}
        <path
          d="M42 86 C46 88 56 94 60 97 C57 103 48 103 44 98 Z"
          fill="#24B3A5"
          stroke="#158277"
          strokeWidth="1.8"
        />
        <path
          d="M98 86 C94 88 84 94 80 97 C83 103 92 103 96 98 Z"
          fill="#24B3A5"
          stroke="#158277"
          strokeWidth="1.8"
        />

        {/* Worried Eyebrows */}
        {isWorried && (
          <>
            <path
              d="M50 54 Q56 50 62 55"
              fill="none"
              stroke="#063E39"
              strokeLinecap="round"
              strokeWidth="2.2"
            />
            <path
              d="M90 54 Q84 50 78 55"
              fill="none"
              stroke="#063E39"
              strokeLinecap="round"
              strokeWidth="2.2"
            />
            {/* Gota de sudor de preocupación */}
            <path
              d="M95 50 C95 47 98 44 98 44 C98 44 101 47 101 50 C101 51.6 99.7 53 98 53 C96.3 53 95 51.6 95 50 Z"
              fill="#67E8F9"
              opacity="0.9"
            />
          </>
        )}

        {/* Ojos brillantes */}
        <circle cx="56" cy="62" fill="#FFFFFF" r={isWorried ? 6 : 5.5} />
        <circle cx="57" cy="62" fill="#063E39" r={3.2} />
        <circle cx="55" cy="60.5" fill="#FFFFFF" r="1.3" />
        <circle cx="84" cy="62" fill="#FFFFFF" r={isWorried ? 6 : 5.5} />
        <circle cx="83" cy="62" fill="#063E39" r={3.2} />
        <circle cx="81.5" cy="60.5" fill="#FFFFFF" r="1.3" />

        {/* Mejillas rosadas */}
        <ellipse cx="48" cy="70" fill="#FF8A80" opacity="0.7" rx="3.5" ry="2" />
        <ellipse cx="92" cy="70" fill="#FF8A80" opacity="0.7" rx="3.5" ry="2" />

        {/* Trompita guardiana */}
        <rect
          fill="#1CB3A3"
          height="12"
          rx="6"
          stroke="#0E786E"
          strokeWidth="1.5"
          width="18"
          x="61"
          y="65"
        />
        <ellipse cx="66" cy="71" fill="#0C574F" rx="1.8" ry="2.5" />
        <ellipse cx="74" cy="71" fill="#0C574F" rx="1.8" ry="2.5" />
        {isWorried ? (
          <path
            d="M66 79 Q68 76 71 78 Q74 80 76 77"
            fill="none"
            stroke="#0C574F"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        ) : (
          <path
            d="M67 79 Q70 82 73 79"
            fill="none"
            stroke="#0C574F"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        )}
      </svg>
    </div>
  );
}

export function TotoCharacter({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center animate-float ${className}`}
      style={{ animationDelay: "2s" }}
    >
      <svg className="w-full h-full drop-shadow-md overflow-visible" viewBox="0 0 140 140">
        {/* Chispita dorada */}
        <path
          d="M124 35 L126 41 L132 43 L126 45 L124 51 L122 45 L116 43 L122 41 Z"
          fill="#F6BE22"
        />
        {/* Piernitas azules de Toto */}
        <path
          d="M56 104 L56 126 L48 128"
          fill="none"
          stroke="#122C63"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <path
          d="M84 104 L84 126 L92 128"
          fill="none"
          stroke="#122C63"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        {/* Borde exterior dorado */}
        <circle cx="70" cy="68" fill="#F6BE22" r="42" stroke="#CB8E00" strokeWidth="3" />
        <circle cx="70" cy="68" fill="#E5A60B" r="37" />
        {/* Rostro azul Toto (#2563EB) */}
        <circle cx="70" cy="68" fill="#2563EB" r="33" />
        {/* Ojos con media ceja/párpado de confianza */}
        <g transform="translate(56, 62)">
          <circle cx="0" cy="0" fill="#FFFFFF" r="7" />
          <circle cx="2" cy="0" fill="#0C255E" r="4" />
          <circle cx="3" cy="-1.5" fill="#FFFFFF" r="1.5" />
          <path d="M-7 -2 Q0 2 7 -2" fill="#2563EB" stroke="#2563EB" strokeWidth="3.5" />
        </g>
        <g transform="translate(84, 62)">
          <circle cx="0" cy="0" fill="#FFFFFF" r="7" />
          <circle cx="2" cy="0" fill="#0C255E" r="4" />
          <circle cx="3" cy="-1.5" fill="#FFFFFF" r="1.5" />
          <path d="M-7 -2 Q0 2 7 -2" fill="#2563EB" stroke="#2563EB" strokeWidth="3.5" />
        </g>
        {/* Ceja pícara (una alzada más que la otra) */}
        <path
          d="M48 51 Q56 46 64 52"
          fill="none"
          stroke="#0D2D73"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <path
          d="M78 47 Q86 42 94 46"
          fill="none"
          stroke="#0D2D73"
          strokeLinecap="round"
          strokeWidth="2.8"
        />
        {/* Sonrisa confiada / smirk de Toto */}
        <path
          d="M62 78 Q74 86 82 76"
          fill="none"
          stroke="#0D2D73"
          strokeLinecap="round"
          strokeWidth="2.8"
        />
      </svg>
    </div>
  );
}
