/**
 * Motor de Diálogos y Cónclave de Guardianes UALÍ
 *
 * Estructura de conversaciones dinámicas entre Nido 🐷, Chispa 📐 y Toto 🪙.
 * Regla de Oro:
 * - Datos reales y porcentajes siempre sanitizados (Zero-Bug Fallback: jamás NaN%).
 * - Diseñado para mitigar el cortisol de Eduardo evitando el texto apiñado.
 * - Consecuencias transparentes de ensayo y error sin tonos acusatorios.
 */

import { sanitizePercentage } from "./format";

export type GuardianId = "nido" | "chispa" | "toto";

export interface GuardianProfile {
  id: GuardianId;
  name: string;
  emoji: string;
  role: string;
  archetype: string;
  themeColor: string;
  badgeBg: string;
  philosophy: string;
  voiceStyle: string;
}

export const GUARDIAN_PROFILES: Record<GuardianId, GuardianProfile> = {
  nido: {
    id: "nido",
    name: "Nido",
    emoji: "🐷",
    role: "Guardián de la Reserva y la Paz Mental",
    archetype: "El Blindaje Calmado",
    themeColor: "#2EC4B6",
    badgeBg: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    philosophy:
      "Tu salud mental y tu fondo de emergencia son sagrados. El dinero primero debe protegerte.",
    voiceStyle: "Cálido, protector, alivia la ansiedad y valida las emociones sin juzgar.",
  },
  chispa: {
    id: "chispa",
    name: "Chispa",
    emoji: "📐",
    role: "Guardiana de la Equidad y la Estrategia",
    archetype: "La Brújula Social",
    themeColor: "#A855F7",
    badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    philosophy:
      "El dinero es un puente en tus relaciones. Los acuerdos claros y proporcionales evitan rencores.",
    voiceStyle: "Asertiva, ingeniosa, empática, busca soluciones creativas ganar-ganar.",
  },
  toto: {
    id: "toto",
    name: "Toto",
    emoji: "🪙",
    role: "Guardián del Flujo y la Aceleración",
    archetype: "El Motor de Crecimiento",
    themeColor: "#F59E0B",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    philosophy:
      "Cada peso debe multiplicarse o defender tu solvencia. Vence la inercia con el interés compuesto.",
    voiceStyle: "Dinámico, pragmático, enfocado en números claros y libertad a largo plazo.",
  },
};

export interface GuardianOpinion {
  guardianId: GuardianId;
  reaction: "cautious" | "enthusiastic" | "strategic" | "protective";
  headline: string;
  dialogue: string;
  recommendation: string;
  deltaCortisol: number;
  deltaShield: number;
  deltaCashflow: number;
}

export interface DialogueTopic {
  id: string;
  category:
    | "Gasto Impulsivo"
    | "Ingreso Extra"
    | "Finanzas en Pareja"
    | "Deudas vs Inversión"
    | "Estilo de Vida";
  title: string;
  situation: string;
  eduardoDilemma: string;
  amountInvolved: number;
  opinions: Record<GuardianId, GuardianOpinion>;
  testChoices: Array<{
    id: string;
    label: string;
    supporter: GuardianId;
    consequenceTitle: string;
    consequenceText: string;
    cortisolImpact: number; // Negativo = reduce estrés
    shieldImpact: number;
    cashflowImpact: number;
    learningTakeaway: string;
  }>;
}

export const GUARDIAN_TOPICS: DialogueTopic[] = [
  {
    id: "topic_black_friday",
    category: "Gasto Impulsivo",
    title: "La Oferta Relámpago 'Imperdible'",
    situation:
      "Ves una pantalla curva para tu setup con 45% de descuento ($380 USD) que termina en 2 horas.",
    eduardoDilemma:
      "Tienes $600 en tu cuenta corriente para terminar el mes y tu Escudo Nido tiene $850.",
    amountInvolved: 380,
    opinions: {
      nido: {
        guardianId: "nido",
        reaction: "protective",
        headline: "¡Respira, Eduardo! La oferta crea urgencia artificial.",
        dialogue:
          "Si gastas $380 ahora, te quedarás con solo $220 de flujo libre para las próximas 3 semanas. Cualquier imprevisto te obligará a romper tu Nido o endeudarte.",
        recommendation:
          "Aplica la Regla de las 72 Horas: si dentro de 3 días aún lo necesitas y tu canasta de gustos lo cubre, lo planeamos con calma.",
        deltaCortisol: -15,
        deltaShield: 0,
        deltaCashflow: 0,
      },
      chispa: {
        guardianId: "chispa",
        reaction: "strategic",
        headline: "¿Esa pantalla genera ingresos o solo dopamina momentánea?",
        dialogue:
          "Si es una herramienta para trabajar más cómodo y facturar más, presupuestémosla en 2 partes sin tocar el dinero del alquiler.",
        recommendation:
          "Aparta $190 este mes y $190 el siguiente. El placer planificado sabe 10 veces mejor que la culpa post-compra.",
        deltaCortisol: -5,
        deltaShield: 0,
        deltaCashflow: -190,
      },
      toto: {
        guardianId: "toto",
        reaction: "cautious",
        headline: "Un descuento de $300 no es ahorro si no lo ibas a comprar.",
        dialogue:
          "Esos $380 colocados a rendir a una tasa moderada del 8% anual equivaldrían a $820 en tu patrimonio futuro. ¿Prefieres plástico en tu escritorio o libertad en tus bolsillos?",
        recommendation:
          "Si vas a comprarla, paga de contado asegurando que tus costos fijos del mes ya están blindados.",
        deltaCortisol: 0,
        deltaShield: 0,
        deltaCashflow: -380,
      },
    },
    testChoices: [
      {
        id: "choice_wait_72h",
        label: "Aplicar la Regla de las 72 Horas de Nido y posponer la compra.",
        supporter: "nido",
        consequenceTitle: "¡Cortisol bajo control!",
        consequenceText:
          "La adrenalina de la oferta se disipó y tus $380 siguen protegiendo tu tranquilidad mensual.",
        cortisolImpact: -25,
        shieldImpact: 0,
        cashflowImpact: 0,
        learningTakeaway:
          "La urgencia artificial de los comercios se apaga esperando 72 horas. Tu paz mental vale más que un descuento.",
      },
      {
        id: "choice_budget_two_months",
        label: "Crear un cupo en la Canasta de Deseos y comprarla el próximo mes (Chispa).",
        supporter: "chispa",
        consequenceTitle: "Compra consciente y sin culpa",
        consequenceText:
          "Disfrutarás la pantalla sin haber puesto en riesgo tu comida ni el alquiler.",
        cortisolImpact: -10,
        shieldImpact: 0,
        cashflowImpact: -190,
        learningTakeaway:
          "Planificar un gusto no es privarse, es decidir conscientemente cuándo disfrutarlo sin remordimiento.",
      },
      {
        id: "choice_buy_credit_card",
        label: "Comprarla hoy con tarjeta de crédito en 12 cuotas (Ensayo y Error).",
        supporter: "toto",
        consequenceTitle: "Carga mensual acumulada",
        consequenceText:
          "Tienes la pantalla en tu cuarto, pero ahora arrastras una cuota mensual que te restará liquidez durante un año entero.",
        cortisolImpact: +30,
        shieldImpact: 0,
        cashflowImpact: -45,
        learningTakeaway:
          "Las micro-cuotas son fugas invisibles: tres compras pequeñas a meses crean una hipoteca informal que eleva el cortisol.",
      },
    ],
  },
  {
    id: "topic_unexpected_bonus",
    category: "Ingreso Extra",
    title: "El Bono Inesperado del Trabajo",
    situation:
      "Recibes una gratificación imprevista de $650 USD por el éxito de un proyecto especial.",
    eduardoDilemma:
      "Tienes tentación de gastarlo todo en ropa y una fiesta, pero tu fondo Nido aún no llega a 3 meses de gastos.",
    amountInvolved: 650,
    opinions: {
      nido: {
        guardianId: "nido",
        reaction: "protective",
        headline: "¡Nido puede fortalecer su armadura con este regalo!",
        dialogue:
          "Si enviamos al menos $350 al Fondo de Emergencia, tu blindaje subirá 15 puntos porcentuales. Saber que tienes ese colchón te permitirá dormir como un bebé.",
        recommendation: "Destina el 55% a Nido y quédate con el 45% para celebrar tu esfuerzo.",
        deltaCortisol: -30,
        deltaShield: +350,
        deltaCashflow: +300,
      },
      chispa: {
        guardianId: "chispa",
        reaction: "enthusiastic",
        headline: "¡Celébralo, te lo ganaste con horas de vida!",
        dialogue:
          "El error común es reprimir todo el dinero y sentirse amargado, o quemarlo en 48 horas. La equidad también aplica contigo mismo.",
        recommendation:
          "Aplica la Regla 50 / 30 / 20 de los ingresos extraordinarios: 50% Nido, 30% Gusto libre, 20% Crecimiento.",
        deltaCortisol: -20,
        deltaShield: +325,
        deltaCashflow: +195,
      },
      toto: {
        guardianId: "toto",
        reaction: "strategic",
        headline: "Es combustible puro para la aceleración patrimonial.",
        dialogue:
          "Si tienes deudas con interés, liquidarlas con este bono es ganar un 40% de retorno inmediato garantizado. Y si estás libre de deudas, ¡hola interés compuesto!",
        recommendation: "Elimina deudas caras primero; si no tienes, potencia tus activos.",
        deltaCortisol: -25,
        deltaShield: +200,
        deltaCashflow: +450,
      },
    },
    testChoices: [
      {
        id: "choice_bonus_balanced",
        label:
          "Aplicar la fórmula Chispa: 50% al Nido ($325), 30% disfrute ($195), 20% crecimiento ($130).",
        supporter: "chispa",
        consequenceTitle: "Armonía total de bienestar",
        consequenceText:
          "Tu Nido creció, premiaste tu esfuerzo con una cena y ropa nueva, y tu patrimonio avanzó.",
        cortisolImpact: -35,
        shieldImpact: +325,
        cashflowImpact: +195,
        learningTakeaway:
          "Celebrar sin desprotegerte refuerza la motivación neurológica de seguir ahorrando.",
      },
      {
        id: "choice_bonus_100_shield",
        label: "Destinar el 100% ($650) a cerrar la meta del Escudo Nido.",
        supporter: "nido",
        consequenceTitle: "Blindaje de Titanio",
        consequenceText:
          "Tu reserva de emergencia quedó sólida como roca, aunque no te diste ningún gusto inmediato.",
        cortisolImpact: -30,
        shieldImpact: +650,
        cashflowImpact: 0,
        learningTakeaway:
          "Maximizar la seguridad alivia la incertidumbre, aunque de vez en cuando un micro-premio evita la fatiga de ahorro.",
      },
      {
        id: "choice_bonus_party",
        label: "Gastar el 100% este fin de semana celebrando con amigos (Ensayo y Error).",
        supporter: "toto",
        consequenceTitle: "Resaca financiera el lunes",
        consequenceText:
          "La fiesta fue divertida pero fugaz. El lunes tus preocupaciones financieras siguen exactamente iguales.",
        cortisolImpact: +20,
        shieldImpact: 0,
        cashflowImpact: 0,
        learningTakeaway:
          "El dinero extra gastado por impulso no deja huella constructiva. Tu 'yo' del futuro sigue desprotegido ante emergencias.",
      },
    ],
  },
  {
    id: "topic_roommate_split",
    category: "Finanzas en Pareja",
    title: "La División de Gastos del Hogar",
    situation:
      "Vives en compañía o con tu pareja. Uno de los dos gana $2,200 USD y el otro $1,100 USD. Los gastos comunes suman $1,200 USD.",
    eduardoDilemma: "¿Dividir 50/50 o proporcional al ingreso para evitar que uno quede ahogado?",
    amountInvolved: 1200,
    opinions: {
      nido: {
        guardianId: "nido",
        reaction: "protective",
        headline: "La desigualdad financiera genera rencor silencioso.",
        dialogue:
          "Si la persona que gana $1,100 paga $600 (50%), le queda solo el 45% de su sueldo para vivir. Estará estresada todo el mes y cualquier salida provocará discusiones.",
        recommendation:
          "Protejan el bienestar emocional del hogar cuidando que ambos conserven margen para sus gastos personales.",
        deltaCortisol: -20,
        deltaShield: 0,
        deltaCashflow: 0,
      },
      chispa: {
        guardianId: "chispa",
        reaction: "strategic",
        headline: "¡Para eso inventé el Trazo de la Equidad Proporcional!",
        dialogue:
          "Quien gana el 67% aporta el 67% ($800) y quien gana el 33% aporta el 33% ($400). Así ambos aportan el mismo esfuerzo porcentual de su ingreso.",
        recommendation:
          "Aporte Proporcional: justicia matemática donde ninguno subsidia al otro pero nadie se siente asfixiado.",
        deltaCortisol: -35,
        deltaShield: 0,
        deltaCashflow: 0,
      },
      toto: {
        guardianId: "toto",
        reaction: "cautious",
        headline: "Cuentas claras conservan amistades y parejas.",
        dialogue:
          "Tener una cuenta común exclusiva para gastos compartidos donde se deposite ese dinero el día 1 de cada mes elimina los cobros incómodos diarios.",
        recommendation: "Caja común transparente y 0 conversaciones de dinero a la hora de cenar.",
        deltaCortisol: -15,
        deltaShield: 0,
        deltaCashflow: 0,
      },
    },
    testChoices: [
      {
        id: "choice_proportional_equity",
        label: "Aplicar la División Proporcional 67% / 33% (Chispa).",
        supporter: "chispa",
        consequenceTitle: "Paz conyugal y financiera",
        consequenceText:
          "Ambos conservan liquidez para sus gustos y el ambiente en casa se llena de cooperación y confianza.",
        cortisolImpact: -40,
        shieldImpact: +50,
        cashflowImpact: 0,
        learningTakeaway:
          "La equidad no es dividir a partes iguales números fríos, sino balancear el esfuerzo relativo de cada persona.",
      },
      {
        id: "choice_strict_5050",
        label: "Exigir división 50/50 estricta sin importar ingresos (Ensayo y Error).",
        supporter: "toto",
        consequenceTitle: "Tensión y resentimiento",
        consequenceText:
          "Quien gana menos no puede acompañar a salidas ni ahorrar, acumulando frustración que estalla en disputas cotidianas.",
        cortisolImpact: +35,
        shieldImpact: -100,
        cashflowImpact: 0,
        learningTakeaway:
          "La división 50/50 cuando los ingresos son dispares destruye la intimidad y convierte el hogar en una transacción comercial.",
      },
    ],
  },
];

/**
 * Sanitiza cualquier cálculo matemático de simulación para prevenir NaN%
 */
export function sanitizeSimulationMetric(used: number, total: number, maxCap = 100): number {
  return sanitizePercentage(used, total, maxCap);
}

/**
 * Calcula la duración de amortiguación visual según la Ley de Etiología de Fricción Cero
 * Si el cortisol es alto (>= 60%), ralentiza la animación en un 40% (0.42s vs 0.30s)
 * para suavizar el impacto emocional en el usuario Eduardo.
 */
export function getLowCortisolTransitionDuration(cortisolLevel: number): number {
  const safeCortisol =
    typeof cortisolLevel === "number" && !Number.isNaN(cortisolLevel)
      ? Math.max(0, Math.min(100, cortisolLevel))
      : 0;

  const esAlertaCritica = safeCortisol >= 60;
  return esAlertaCritica ? 0.42 : 0.3;
}
