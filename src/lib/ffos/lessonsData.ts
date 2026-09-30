import type { LessonRow } from "@/lib/supabase/queries";

export interface SpacedReviewData {
  lessonId: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  intervalDays: number;
  repetitionCount: number;
}

export type ConfidenceLevel = "facil" | "bien" | "dificil";

const SPACED_STORAGE_KEY = "uali_spaced_repetition_v1";
const LOCAL_LESSONS_DONE_KEY = "uali_lessons_done_fallback_v1";

export function getLocalLessonsDone(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_LESSONS_DONE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalLessonDone(lessonId: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalLessonsDone();
    if (!existing.includes(lessonId)) {
      existing.push(lessonId);
      localStorage.setItem(LOCAL_LESSONS_DONE_KEY, JSON.stringify(existing));
    }
  } catch {
    // ignore
  }
}

export function getAllSpacedReviews(): Record<string, SpacedReviewData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SPACED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getSpacedReview(lessonId: string): SpacedReviewData | null {
  const all = getAllSpacedReviews();
  return all[lessonId] ?? null;
}

export function isLessonDueForReview(lessonId: string): boolean {
  const data = getSpacedReview(lessonId);
  if (!data) return false;
  return new Date(data.nextReviewAt).getTime() <= Date.now();
}

export function recordSpacedReview(
  lessonId: string,
  confidence: ConfidenceLevel,
): SpacedReviewData {
  const all = getAllSpacedReviews();
  const prev = all[lessonId];
  const now = new Date();

  let nextInterval = 1;
  let count = 1;

  if (prev) {
    count = prev.repetitionCount + 1;
    if (confidence === "facil") {
      nextInterval = Math.max(2, Math.round(prev.intervalDays * 2.5));
    } else if (confidence === "bien") {
      nextInterval = Math.max(1, Math.round(prev.intervalDays * 1.6));
    } else {
      nextInterval = 1; // reset for difficult recall
    }
  } else {
    if (confidence === "facil") nextInterval = 3;
    else if (confidence === "bien") nextInterval = 2;
    else nextInterval = 1;
  }

  const nextDate = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  const updated: SpacedReviewData = {
    lessonId,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextDate.toISOString(),
    intervalDays: nextInterval,
    repetitionCount: count,
  };

  all[lessonId] = updated;
  if (typeof window !== "undefined") {
    localStorage.setItem(SPACED_STORAGE_KEY, JSON.stringify(all));
  }

  return updated;
}

export const DEFAULT_LESSONS: LessonRow[] = [
  {
    id: "lesson-intro",
    slug: "intro",
    minLevel: 1,
    title: "Presupuesto 0-base",
    body: "Asigna cada peso antes de gastarlo: todo ingreso tiene un destino definido de antemano (necesidades, gustos o ahorro). Si te sobran $100 sin asignar, van a desaparecer en gastos hormiga.",
    question: "¿Cuál es la regla principal del presupuesto 0-base?",
    options: [
      "Gastar lo menos posible",
      "Asignar cada peso antes de gastarlo",
      "Ahorrar el 50% de tu sueldo",
    ],
    answer: 1,
    xp: 25,
  },
  {
    id: "lesson-needs-wants",
    slug: "needs_wants",
    minLevel: 1,
    title: "Necesidades vs Deseos (50/30/20)",
    body: "El 50% va a lo no negociable (alquiler, comida básica, servicios). El 30% a lo que te da felicidad hoy (salidas, gustos). El 20% a tu futuro (ahorro e inversión). Separarlos te quita la culpa al gastar.",
    question: "¿El delivery del fin de semana o streaming es una necesidad o un gusto?",
    options: ["Necesidad vital", "Gusto / Discrecional", "Gasto fijo"],
    answer: 1,
    xp: 25,
  },
  {
    id: "lesson-emergency",
    slug: "emergency",
    minLevel: 1,
    title: "Fondo de Emergencia",
    body: "Tu escudo de paz mental: guarda entre 3 y 6 meses de gastos fijos en un lugar seguro y líquido antes de invertir. Si se rompe el auto o surge un problema médico, no te endeudas.",
    question: "¿Cuántos meses de gastos básicos debería cubrir un buen fondo de emergencia?",
    options: ["1 semana", "3 a 6 meses", "5 años"],
    answer: 1,
    xp: 25,
  },
  {
    id: "lesson-savings-basics",
    slug: "savings_basics",
    minLevel: 1,
    title: "Págate a ti primero",
    body: "No ahorres lo que sobra después de gastar. Apenas recibas tu sueldo o ingreso, aparta tu ahorro automáticamente el primer día. Lo que queda es tu presupuesto real para el mes.",
    question: "¿Cuándo es el momento ideal para apartar el ahorro?",
    options: [
      "Apenas cobras tu ingreso (Día 1)",
      "Al final del mes con lo que sobre",
      "Solo cuando alguien te lo pide",
    ],
    answer: 0,
    xp: 25,
  },
  {
    id: "lesson-team-finances",
    slug: "team_finances",
    minLevel: 2,
    title: "Finanzas en Pareja o Equipo",
    body: "El 70% de las discusiones de convivencia son por plata. La solución: pozo común transparente para gastos compartidos (alquiler, compras, servicios) y presupuestos individuales 100% privados para gustos de cada uno.",
    question: "¿Cuál es la mejor fórmula para evitar roces de dinero en pareja o equipo?",
    options: [
      "Compartir todas las cuentas al 100% sin privacidad",
      "Fondo común para lo compartido y cuentas privadas para gustos propios",
      "Que uno solo pague todo siempre",
    ],
    answer: 1,
    xp: 30,
  },
  {
    id: "lesson-roommates-split",
    slug: "roommates_split",
    minLevel: 2,
    title: "Convivencia y Roommates sin dramas",
    body: "Para vivir con compas de departamento: definir cupos fijos para víveres comunitarios (artículos de limpieza, wifi, servicios). Registrar el gasto al instante evita el incómodo '¿quién compró el detergente?'",
    question: "¿Cómo se gestionan mejor los gastos del hogar compartido?",
    options: [
      "Hacer cuentas de memoria al final del año",
      "Definir presupuesto compartido y registrar aportes al instante",
      "Esperar a que corten el servicio",
    ],
    answer: 1,
    xp: 30,
  },
  {
    id: "lesson-credit-cards",
    slug: "credit_cards",
    minLevel: 2,
    title: "Tarjetas de crédito inteligentes",
    body: "La tarjeta de crédito es solo un medio de pago, NUNCA una extensión de tu salario. El truco maestro: pagar SIEMPRE el total del resumen antes del vencimiento. Pagar el mínimo es una trampa de intereses compuestos.",
    question: "¿Qué ocurre cuando pagas solo el pago mínimo de tu tarjeta?",
    options: [
      "El banco te premia por lealtad",
      "La deuda genera intereses compuestos muy caros y se alarga",
      "Se cancela el total de la deuda",
    ],
    answer: 1,
    xp: 30,
  },
  {
    id: "lesson-debt-order",
    slug: "debt_order",
    minLevel: 3,
    title: "Método Avalancha para deudas",
    body: "El método avalancha es matemáticamente el más eficiente: pagas el mínimo en todas tus deudas y vuelcas todo el dinero extra a la deuda con la TASA DE INTERÉS MÁS ALTA. Te ahorras miles en intereses.",
    question: "¿En qué consiste el método avalancha?",
    options: [
      "Pagar primero la deuda más pequeña",
      "Pagar con prioridad la deuda con mayor tasa de interés",
      "Esperar a que prescriban",
    ],
    answer: 1,
    xp: 35,
  },
  {
    id: "lesson-snowball",
    slug: "snowball",
    minLevel: 3,
    title: "Método Bola de Nieve",
    body: "Si necesitas motivación psicológica rápida: ordena las deudas de menor a mayor monto y liquida la más chica primero. La sensación de victoria te da energía para liquidar las siguientes.",
    question: "¿Cuál es el beneficio principal de la bola de nieve?",
    options: ["Ahorro matemático de tasa", "Impulso psicológico y victorias rápidas", "Ninguno"],
    answer: 1,
    xp: 35,
  },
  {
    id: "lesson-impulse-spending",
    slug: "impulse_spending",
    minLevel: 3,
    title: "El truco de las 48 horas",
    body: "Cuando sientas ganas irresistibles de comprar algo no esencial, espera 48 horas. En el 80% de los casos, la dopamina del momento baja y te das cuenta de que no lo necesitabas.",
    question: "¿Para qué sirve la regla de las 48 horas?",
    options: [
      "Para que aumente el precio del producto",
      "Para enfriar el impulso emocional y evitar compras innecesarias",
      "Para pedir prestado dinero",
    ],
    answer: 1,
    xp: 35,
  },
  {
    id: "lesson-investing-101",
    slug: "investing_101",
    minLevel: 4,
    title: "Inversión 101: La jerarquía",
    body: "El orden del éxito: 1° Fondo de emergencia, 2° Cero deudas de alta tasa, 3° Invertir en fondos diversificados a largo plazo. Nunca inviertas plata que vas a necesitar el mes que viene.",
    question: "¿Qué paso va primero antes de invertir en bolsa o fondos?",
    options: [
      "Pedir un préstamo para invertir más",
      "Tener fondo de emergencia y liquidar deudas de alta tasa",
      "Comprar criptomonedas de moda",
    ],
    answer: 1,
    xp: 40,
  },
  {
    id: "lesson-inflation-shield",
    slug: "inflation_shield",
    minLevel: 4,
    title: "El dinero bajo el colchón pierde valor",
    body: "Tener todo en efectivo o en una cuenta a la vista que no genera rendimiento significa que la inflación devora tu poder de compra año a año. El dinero ahorrado debe buscar ganarle a la inflación.",
    question: "¿Qué efecto tiene la inflación sobre el dinero quieto?",
    options: [
      "Lo multiplica automáticamente",
      "Reduce su poder adquisitivo real con el tiempo",
      "No tiene ningún efecto",
    ],
    answer: 1,
    xp: 40,
  },
];
