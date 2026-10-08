import type { LessonRow, SubLesson } from "@/lib/supabase/queries";

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

export function isLessonDone(
  lesson: LessonRow,
  lessonsDone: string[] | Set<string> | undefined,
): boolean {
  if (!lessonsDone || !lesson) return false;
  const set = lessonsDone instanceof Set ? lessonsDone : new Set(lessonsDone);
  return (
    set.has(lesson.id) ||
    set.has(lesson.slug) ||
    (lesson.slug ? set.has(`lesson-${lesson.slug}`) : false) ||
    (lesson.id ? set.has(lesson.id.replace("lesson-", "")) : false)
  );
}

export function getActiveLesson(
  lessons: LessonRow[],
  lessonsDone: string[] | Set<string> | undefined,
): LessonRow | null {
  if (!lessons || lessons.length === 0) return null;
  const set = lessonsDone instanceof Set ? lessonsDone : new Set(lessonsDone ?? []);
  const pending = lessons.find((l) => !isLessonDone(l, set));
  return pending ?? lessons[0] ?? null;
}

export function addLocalLessonDone(lessonId: string, slug?: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalLessonsDone();
    const set = new Set(existing);
    let updated = false;

    if (lessonId && !set.has(lessonId)) {
      set.add(lessonId);
      updated = true;
    }
    if (slug) {
      if (!set.has(slug)) {
        set.add(slug);
        updated = true;
      }
      const prefixed = `lesson-${slug}`;
      if (!set.has(prefixed)) {
        set.add(prefixed);
        updated = true;
      }
    }
    if (lessonId && lessonId.startsWith("lesson-")) {
      const stripped = lessonId.replace("lesson-", "");
      if (!set.has(stripped)) {
        set.add(stripped);
        updated = true;
      }
    }

    if (updated) {
      const arr = Array.from(set);
      localStorage.setItem(LOCAL_LESSONS_DONE_KEY, JSON.stringify(arr));
      window.dispatchEvent(
        new CustomEvent("uali-lesson-completed", { detail: { lessonId, slug } }),
      );
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
    subLessons: [
      {
        id: "intro-sub-1",
        title: "1. Cada peso con nombre y apellido",
        subtitle: "El dinero sin misión se evapora solo",
        concept:
          "El Presupuesto Base Cero no significa tener $0 en el banco, sino que la resta entre tus ingresos y lo que asignas a cada categoría sea exactamente $0.00.",
        practicalExample:
          "Si cobras $1,200 y solo presupuestas $1,000, esos $200 restantes se van a esfumar en deliveries, cafés y compras por impulso sin que te des cuenta.",
        guardianTip: {
          character: "Toto",
          tip: "Ponle etiqueta a cada dólar antes de que empiece el mes. Lo que no planificas tú, te lo gasta la inercia diaria.",
        },
        keyTakeaway: "Ingreso total - Gastos fijos - Deseos - Ahorro = $0.00 asignados.",
      },
      {
        id: "intro-sub-2",
        title: "2. Las tres canastas de reparto",
        subtitle: "Cómo clasificar tus destinos de dinero",
        concept:
          "Todo gasto pertenece a una de tres canastas: Necesidades (lo vital para funcionar), Deseos (lo que disfrutas hoy) o Futuro (ahorro, fondo Nido y pagos de deuda).",
        practicalExample:
          "El alquiler y el súper son necesidades. La suscripción de streaming o salir a cenar son deseos. Los $50 para Nido son futuro.",
        guardianTip: {
          character: "Nido",
          tip: "Al asignar tu canasta de futuro primero, proteges tu reserva antes de que la tentación toque a tu puerta.",
        },
        keyTakeaway: "Tres canastas claras eliminan la culpa de gastar en lo que te gusta.",
      },
      {
        id: "intro-sub-3",
        title: "3. Ajuste dinámico sin estrés",
        subtitle: "Los planes se adaptan a la vida real",
        concept:
          "Si gastas $20 de más en transporte, no te castigues: compensa restando $20 de tus salidas discrecionales. El presupuesto 0-base es un mapa vivo, no una cárcel.",
        practicalExample:
          "Si surgió una cena imprevista con amigos, ajustas tu presupuesto de compras de ropa de esa semana para mantener el balance a cero.",
        guardianTip: {
          character: "Chispa",
          tip: "¡Equilibrar partidas en 10 segundos es el verdadero superpoder de los maestros financieros!",
        },
        keyTakeaway: "Si una categoría sube, otra baja. El balance final se conserva intacto.",
      },
    ],
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
    subLessons: [
      {
        id: "needs-wants-sub-1",
        title: "1. El 50% No Negociable",
        subtitle: "Lo indispensable para vivir seguro",
        concept:
          "Las necesidades básicas abarcan techo, comida de despensa, servicios de agua/luz/gas, salud básica y transporte para trabajar. Si supera el 60%, es señal de alerta.",
        practicalExample:
          "El arroz, huevos y verduras del supermercado son necesidades. Los snacks importados y el sushi por delivery entran en deseos.",
        guardianTip: {
          character: "Toto",
          tip: "Mantén tus gastos fijos por debajo del 50-60% para que cualquier baja de ingresos no ponga en jaque tu techo.",
        },
        keyTakeaway: "50% para lo esencial: techo, comida básica, transporte y salud.",
      },
      {
        id: "needs-wants-sub-2",
        title: "2. El 30% de Felicidad Presente",
        subtitle: "Gastar sin culpa en lo que amas",
        concept:
          "El dinero no es solo para acumular. Tener un 30% asignado a salidas, entretenimiento, ropa y pasatiempos te mantiene motivado y previene los atracones de compras.",
        practicalExample:
          "Si tienes $300 para diversión este mes, puedes ir a ese recital o pedir esa comida favorita con total tranquilidad.",
        guardianTip: {
          character: "Chispa",
          tip: "¡Gastar en lo que te hace sonreír está perfecto siempre que esté dentro de tu cupo del 30%!",
        },
        keyTakeaway: "El 30% para gustos te da permiso de disfrutar el presente sin culpa.",
      },
      {
        id: "needs-wants-sub-3",
        title: "3. El 20% de Tu Yo del Futuro",
        subtitle: "Construyendo tu libertad a largo plazo",
        concept:
          "El 20% construye tu colchón de tranquilidad, paga deudas a capital e inicia tus primeras inversiones en Nido.",
        practicalExample:
          "Ahorrar $200 al mes durante un año son $2,400 listos para cualquier oportunidad o imprevisto.",
        guardianTip: {
          character: "Nido",
          tip: "Este 20% es el alquiler que le pagas a tu yo de dentro de 10 años. ¡No lo dejes en visto!",
        },
        keyTakeaway: "20% directo a reserva, desendeudamiento y crecimiento patrimonial.",
      },
    ],
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
    subLessons: [
      {
        id: "emergency-sub-1",
        title: "1. El escudo anti-pánico",
        subtitle: "Por qué es tu primer paso financiero",
        concept:
          "El fondo de emergencia no es para ganar intereses astronómicos, sino para comprar tranquilidad ante emergencias médicas, averías del hogar o pérdida temporal de trabajo.",
        practicalExample:
          "Si se rompe el refrigerador o el coche, pagas de contado con Nido y duermes tranquilo en vez de financiarlo en 12 cuotas con interés.",
        guardianTip: {
          character: "Nido",
          tip: "Un fondo de emergencia sólido convierte una catástrofe financiera en un simple inconveniente administrativo.",
        },
        keyTakeaway: "Tu fondo de emergencia es tu muralla contra las deudas por imprevistos.",
      },
      {
        id: "emergency-sub-2",
        title: "2. ¿Cuánto dinero acumular?",
        subtitle: "Calculando tu meta de 3 a 6 meses",
        concept:
          "Suma solo tus gastos fijos de supervivencia (50% de necesidades). Si tus gastos básicos son $800 al mes, tu meta mínima es $2,400 y la ideal es $4,800.",
        practicalExample:
          "Si eres asalariado con contrato fijo, 3 meses suelen bastar. Si eres freelancer o emprendedor, apunta a 6 meses de respaldo.",
        guardianTip: {
          character: "Toto",
          tip: "No intentes juntar todo el fondo en un mes: empieza con una meta chica de $500 y acelera paso a paso.",
        },
        keyTakeaway: "Multiplica tus gastos vitales por 3 o 6 meses según tu estabilidad laboral.",
      },
      {
        id: "emergency-sub-3",
        title: "3. Liquidez vs Bloqueo",
        subtitle: "Dónde debe vivir tu reserva de emergencia",
        concept:
          "El dinero de emergencia debe estar disponible en menos de 24 horas y sin riesgo de fluctuación (cuentas a la vista o fondos money market de bajo riesgo).",
        practicalExample:
          "Nunca pongas el fondo de emergencia en acciones volátiles ni en plazos fijos bloqueados a 1 año.",
        guardianTip: {
          character: "Nido",
          tip: "Disponible de inmediato y seguro. No arriesgues tu oxígeno financiero.",
        },
        keyTakeaway: "Accesible en 24h, sin riesgo y separado de tu cuenta de gastos diarios.",
      },
    ],
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
    subLessons: [
      {
        id: "savings-basics-sub-1",
        title: "1. La trampa del 'lo que sobre'",
        subtitle: "Por qué casi nunca sobra nada",
        concept:
          "La ley de Parkinson dice que los gastos crecen hasta igualar todos los ingresos disponibles. Si dejas el ahorro para el final, tu mente encontrará cómo gastarlo.",
        practicalExample:
          "Si cobras el día 1 y dejas el dinero en la cuenta, para el día 25 ya encontraste salidas, compras y suscripciones que consumieron todo.",
        guardianTip: {
          character: "Toto",
          tip: "Si no apartas el ahorro de entrada, te conviertes en el último de la fila para cobrar tu propio esfuerzo.",
        },
        keyTakeaway: "Ahorrar al final es una ilusión; el dinero disponible siempre se gasta.",
      },
      {
        id: "savings-basics-sub-2",
        title: "2. Automatización el Día 1",
        subtitle: "Hacer del ahorro un hábito invisible",
        concept:
          "Configura una transferencia automática para el mismo día de cobro hacia tu fondo Nido. Al no ver ese saldo en tu cuenta diaria, tu cerebro se adapta sin dolor.",
        practicalExample:
          "Cobras el 5 de cada mes y el 6 a las 8am se apartan $150 automáticamente. Vives con el resto como si ese fuera tu salario real.",
        guardianTip: {
          character: "Nido",
          tip: "Lo que tus ojos no ven en la cuenta del día a día, tus manos no lo pueden malgastar.",
        },
        keyTakeaway:
          "Automatiza el traspaso el día de cobro y vive tranquilo con el saldo restante.",
      },
      {
        id: "savings-basics-sub-3",
        title: "3. La satisfacción del progreso",
        subtitle: "Ver crecer tu patrimonio mes a mes",
        concept:
          "Pagarle a tu futuro primero crea una sensación inmediata de control y orgullo personal que reduce la ansiedad financiera.",
        practicalExample:
          "En 6 meses verás $900 ahorrados que antes se habrían evaporado en consumos irrelevantes.",
        guardianTip: {
          character: "Chispa",
          tip: "¡Cada aporte a Nido suma Puntos FFOS y te acerca al siguiente nivel de maestría!",
        },
        keyTakeaway: "Trabajas duro para ti: quédate con una parte de tu esfuerzo desde el inicio.",
      },
    ],
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
    subLessons: [
      {
        id: "team-finances-sub-1",
        title: "1. La raíz del conflicto en pareja",
        subtitle: "Diferentes estilos de gasto y expectativas",
        concept:
          "Uno suele ser más ahorrador y otro más disfrutador. Ninguno está mal, pero sin reglas claras surgen reclamos como '¿en qué gastaste tanto?'.",
        practicalExample:
          "Si no tienen un acuerdo, la compra de un videojuego o unos zapatos puede desatar una discusión sobre el pago de la luz.",
        guardianTip: {
          character: "Toto",
          tip: "Cuentas claras conservan el amor y la armonía en casa. Hablar de números debe ser tan normal como planear las vacaciones.",
        },
        keyTakeaway: "La falta de acuerdos genera fricción; el sistema conjunto trae paz.",
      },
      {
        id: "team-finances-sub-2",
        title: "2. El método del Pozo Común Proporcional",
        subtitle: "Equidad justa según los ingresos de cada uno",
        concept:
          "Si una persona gana $1,500 (60%) y la otra $1,000 (40%), los gastos del hogar se dividen 60/40 en lugar de 50/50 estricto para que ambos tengan margen de respiro.",
        practicalExample:
          "Para un alquiler y despensa de $1,000, una persona aporta $600 y la otra $400. Ambas conservan la misma proporción para sus metas personales.",
        guardianTip: {
          character: "Toto",
          tip: "Aportes proporcionales evitan que quien gana menos viva asfixiado financieramente.",
        },
        keyTakeaway: "Aportar según ingresos relativos equilibra el esfuerzo de ambos.",
      },
      {
        id: "team-finances-sub-3",
        title: "3. La cuenta de gastos personales intocable",
        subtitle: "Libertad total dentro de tu propio bolsillo",
        concept:
          "Una vez cubierto el pozo común y el ahorro, cada uno tiene su propio dinero personal donde nadie le cuestiona en qué lo gasta.",
        practicalExample:
          "Tu pareja puede comprarse ropa o tú puedes gastar en tu hobby favorito sin tener que pedir permiso ni dar explicaciones.",
        guardianTip: {
          character: "Nido",
          tip: "El espacio compartido protege el hogar; tu billetera privada protege tu autonomía personal.",
        },
        keyTakeaway: "Un pozo común para el hogar y cupos individuales para gastar con libertad.",
      },
    ],
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
    subLessons: [
      {
        id: "roommates-sub-1",
        title: "1. Los gastos fantasma del departamento",
        subtitle: "Papel, detergente, wifi y artículos comunes",
        concept:
          "En la convivencia con roommates, los pequeños gastos recurrentes de limpieza y despensa compartida generan resentimiento si siempre los compra el mismo.",
        practicalExample:
          "Alguien compra el papel higiénico tres veces seguidas y piensa que los demás se están aprovechando, dañando el ambiente del hogar.",
        guardianTip: {
          character: "Toto",
          tip: "Armen una lista fija de ítems comunitarios con un fondo mensual donde todos ponen lo mismo al inicio.",
        },
        keyTakeaway: "Definir qué es común y qué es personal desde el primer día.",
      },
      {
        id: "roommates-sub-2",
        title: "2. Registro inmediato en 5 segundos",
        subtitle: "Anotar el ticket apenas sales del súper",
        concept:
          "No guardes recibos en cajones ni confíes en la memoria. Carga el gasto compartido en la app apenas lo pagues con la opción 'Compartido'.",
        practicalExample:
          "Compraste el jabón y las bolsas de basura por $18: lo registras en el momento y Ualí calcula el reparto equitativo.",
        guardianTip: {
          character: "Chispa",
          tip: "¡El botón '+' central toma 5 segundos y evita la charla incómoda de 'me debes de hace 3 meses'!",
        },
        keyTakeaway: "Registrar al instante elimina los cobros incómodos a fin de mes.",
      },
      {
        id: "roommates-sub-3",
        title: "3. El cierre de cuentas mensual",
        subtitle: "Saldar diferencias con buena onda",
        concept:
          "El último domingo de cada mes revisan el balance del espacio compartido y quien quedó abajo le transfiere la diferencia al otro.",
        practicalExample:
          "Ualí te muestra: 'Ana pagó $140, Carlos pagó $90'. Carlos transfiere $25 y ambos quedan en paz y listos para el nuevo mes.",
        guardianTip: {
          character: "Toto",
          tip: "Cuentas saldadas mensualmente aseguran amistades y convivencia duradera.",
        },
        keyTakeaway: "Cerrar números cada 30 días mantiene la casa limpia y la amistad sana.",
      },
    ],
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
    subLessons: [
      {
        id: "credit-cards-sub-1",
        title: "1. La trampa psicológica del límite",
        subtitle: "Tu límite no es dinero que te regalaron",
        concept:
          "Un límite de $3,000 en la tarjeta no significa que tengas $3,000 extra. Es un préstamo caro a corto plazo. Si tu cuenta bancaria tiene $500, tu límite real es $500.",
        practicalExample:
          "Si ganas $1,000 y gastas $1,800 con la tarjeta porque el límite te lo permite, el mes que viene estarás atrapado en una bola de nieve.",
        guardianTip: {
          character: "Toto",
          tip: "Solo pasa la tarjeta si ya tienes ese dinero en tu cuenta bancaria para pagarlo hoy.",
        },
        keyTakeaway: "La tarjeta financia tus compras por 30 días, no tu estilo de vida.",
      },
      {
        id: "credit-cards-sub-2",
        title: "2. La vorágine del Pago Mínimo",
        subtitle: "Cómo una deuda de $500 se vuelve impagable",
        concept:
          "El pago mínimo solo cubre intereses y comisiones bancarias, reduciendo casi nada del capital. Las tasas de tarjeta suelen superar el 50-80% anual.",
        practicalExample:
          "Pagar el mínimo en una deuda de $1,000 puede tomarte 12 años y terminarás pagando más de $3,500 al banco.",
        guardianTip: {
          character: "Toto",
          tip: "Sé un cliente 'totalero': paga el 100% de tu resumen antes de la fecha límite y paga cero intereses.",
        },
        keyTakeaway: "Pagar el mínimo enriquece al banco y te mantiene endeudado de por vida.",
      },
      {
        id: "credit-cards-sub-3",
        title: "3. Usar el sistema a tu favor",
        subtitle: "Cashback, puntos y seguridad sin costo",
        concept:
          "Si pagas siempre el total antes del vencimiento, obtienes hasta 45 días de liquidez gratis, protección contra fraudes y millas o cashback sin pagar un solo peso de interés.",
        practicalExample:
          "Pagas el súper y servicios con tarjeta, acumulas puntos para vuelos y el día del resumen pagas el 100% desde tu cuenta.",
        guardianTip: {
          character: "Chispa",
          tip: "¡Aprovecha los beneficios de la tarjeta sin caer en la trampa de los intereses!",
        },
        keyTakeaway: "Totalero = beneficios gratis. Financiar con tarjeta = la deuda más cara.",
      },
    ],
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
    subLessons: [
      {
        id: "debt-order-sub-1",
        title: "1. La matemática contra los intereses",
        subtitle: "Matar primero al enemigo más caro",
        concept:
          "El método avalancha clasifica tus deudas por su tasa de interés anual (de mayor a menor). La que tiene la tasa más alta es la que más dinero te roba cada día.",
        practicalExample:
          "Tienes una tarjeta al 65% anual y un crédito personal al 18%. La avalancha ordena poner todo el dinero extra a liquidar la tarjeta primero.",
        guardianTip: {
          character: "Toto",
          tip: "Matemáticamente, la avalancha es el camino que menos dinero total le deja en el bolsillo al banco.",
        },
        keyTakeaway:
          "Prioriza la deuda con mayor tasa de interés para frenar el sangrado financiero.",
      },
      {
        id: "debt-order-sub-2",
        title: "2. El escudo de los pagos mínimos",
        subtitle: "Cuidar las demás deudas para no caer en mora",
        concept:
          "Mientras atacas la deuda de mayor tasa con todo tu excedente, debes seguir pagando el mínimo en las demás para no dañar tu historial ni generar multas.",
        practicalExample:
          "Si tienes $300 para pagar deudas: pagas el mínimo en dos deudas ($50 c/u) y los $200 restantes van directos a capital de la más cara.",
        guardianTip: {
          character: "Toto",
          tip: "Nunca descuides los pagos mínimos de las demás; la meta es atacar sin generar penalidades en otros lados.",
        },
        keyTakeaway: "Mínimos en todas para protegerte; excedente concentrado en la más cara.",
      },
      {
        id: "debt-order-sub-3",
        title: "3. El efecto dominó",
        subtitle: "Cómo se multiplica tu velocidad",
        concept:
          "Cuando terminas de pagar la primera deuda, todo el dinero que usabas para ella se suma al pago de la siguiente deuda con la segunda tasa más alta.",
        practicalExample:
          "Liberas $200 al mes de la tarjeta liquidada y ahora tienes $400 al mes para arrasar con el crédito personal en tiempo récord.",
        guardianTip: {
          character: "Chispa",
          tip: "¡Cada deuda que eliminas te devuelve flujo de caja libre para acelerar la siguiente!",
        },
        keyTakeaway: "Al eliminar una deuda, su cuota entera potencia el ataque a la que sigue.",
      },
    ],
  },
  {
    id: "lesson-snowball",
    slug: "snowball",
    minLevel: 3,
    title: "La Avalancha Inversa: Bola de Nieve y Efecto Multiplicador",
    body: "Concentra toda tu fuerza en la deuda más pequeña para ganar inercia psicológica. Una vez demolida, esa misma cuota liberada se suma a la siguiente hasta aplastar todos los pasivos y convertirse en motor de interés compuesto.",
    question: "¿Cuál es la regla de oro para activar la fuerza de la bola de nieve?",
    options: [
      "Distribuir el dinero en partes iguales entre todas las deudas",
      "Concentrar todo el excedente en liquidar primero la deuda más pequeña",
      "Pagar únicamente los intereses mínimos y posponer el capital",
    ],
    answer: 1,
    xp: 35,
    subLessons: [
      {
        id: "snowball-sub-1",
        title: "1. Concentración de masa en la menor",
        subtitle: "Aplastamiento táctico paso a paso",
        concept:
          "Si divides tu flujo en cuotas simétricas, la bola se derrite antes del impacto. Concentrar todo el excedente en el bloque menor genera victorias rápidas que liberan flujo de caja de inmediato.",
        practicalExample:
          "Tienes 3 deudas ($150, $800 y $2,500). Abonar el mínimo a las dos mayores y volcar $100 extras a la de $150 la liquida en semanas, liberando su cuota para la siguiente.",
        guardianTip: {
          character: "Toto",
          tip: "¡No disperses tu fuerza! Aplasta primero la deuda pequeña para ganar inercia, reducir estrés mental y liberar flujo operativo.",
        },
        keyTakeaway: "Paga mínimos en todas y vuelca el 100% del excedente al bloque más pequeño.",
      },
      {
        id: "snowball-sub-2",
        title: "2. La inercia de la cuota liberada",
        subtitle: "Cero fricción y aceleración geométrica",
        concept:
          "Al extinguir la primera deuda, su cuota no se gasta: se compacta con el excedente para atacar el segundo bloque con el doble de masa y velocidad destructiva.",
        practicalExample:
          "Comenzaste con $50 de empuje extra. Al eliminar dos deudas, ya cuentas con una bola de nieve de $300 mensuales que pulveriza el préstamo más grande en tiempo récord.",
        guardianTip: {
          character: "Toto",
          tip: "Cada deuda que demueles transfiere su voltaje completo a la siguiente. La velocidad del desapalancamiento se acelera en cada ciclo.",
        },
        keyTakeaway: "El dinero liberado de cada deuda extinta potencia el ataque a la que sigue.",
      },
      {
        id: "snowball-sub-3",
        title: "3. La avalancha inversa: Interés compuesto",
        subtitle: "De triturar deudas a multiplicar patrimonio",
        concept:
          "Cuando todas las deudas se pulverizan a cero, la misma inercia financiera entra al generador de inversión: el interés compuesto multiplica tu patrimonio de forma exponencial.",
        practicalExample:
          "Esos mismos $350 mensuales que antes pagaban cuotas bancarias, ahora en un fondo de inversión al 9% anual se convierten en más de $150,000 con el tiempo.",
        guardianTip: {
          character: "Toto",
          tip: "Esa misma fuerza geométrica que antes te ahogaba con intereses, ahora trabaja a tu favor multiplicando tu libertad financiera.",
        },
        keyTakeaway:
          "La bola de nieve que aplastó tus deudas es la misma máquina que construye tu riqueza futura.",
      },
    ],
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
    subLessons: [
      {
        id: "impulse-sub-1",
        title: "1. El secuestro de la dopamina",
        subtitle: "Cómo el marketing manipula tus emociones",
        concept:
          "Cuando ves una oferta 'por tiempo limitado', tu cerebro libera dopamina por la anticipación de la recompensa. Compras por la emoción, no por la utilidad real del objeto.",
        practicalExample:
          "Ves unas zapatillas con 30% de descuento y sientes una urgencia física de comprarlas antes de que 'se acaben', aunque tienes 4 pares en casa.",
        guardianTip: {
          character: "Chispa",
          tip: "El comercio electrónico está diseñado para que compres en 1 clic antes de que alcances a pensar. ¡Ponle pausa!",
        },
        keyTakeaway:
          "Las compras impulsivas son disparadas por dopamina temporal, no por necesidad.",
      },
      {
        id: "impulse-sub-2",
        title: "2. La regla del enfriamiento",
        subtitle: "Esperar 48 horas antes de pagar",
        concept:
          "Anota el artículo en una lista de deseos o déjalo en el carrito sin pagar. Espera 48 horas enteras. En la mayoría de los casos, a los dos días el interés ha desaparecido por completo.",
        practicalExample:
          "A los dos días miras el carrito y piensas: 'Menos mal que no gasté $90 en esto, en realidad ni lo iba a usar tanto'.",
        guardianTip: {
          character: "Toto",
          tip: "Si después de 48 horas todavía lo deseas y está dentro de tu 30% de gustos, cómpralo con una sonrisa.",
        },
        keyTakeaway: "Si a las 48 horas aún lo quieres y tienes presupuesto, cómpralo sin culpa.",
      },
      {
        id: "impulse-sub-3",
        title: "3. La prueba de las horas de trabajo",
        subtitle: "¿Cuántas horas de tu vida cuesta este capricho?",
        concept:
          "Divide el precio del producto por lo que ganas neto por hora de trabajo. Te ayuda a valorar el verdadero costo de lo que compras.",
        practicalExample:
          "Si ganas $10 la hora y ves una campera de $150, pregúntate: '¿Vale la pena trabajar 15 horas de mi vida para tener esto?'.",
        guardianTip: {
          character: "Nido",
          tip: "Tu tiempo y tu energía son tu recurso más valioso. No los regales en objetos que terminarán juntando polvo.",
        },
        keyTakeaway:
          "Medir los precios en horas de tu vida te da claridad absoluta sobre lo que vale la pena.",
      },
    ],
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
    subLessons: [
      {
        id: "investing-sub-1",
        title: "1. La pirámide financiera",
        subtitle: "El orden inquebrantable de los pasos",
        concept:
          "Invertir antes de tener fondo de emergencia o teniendo deudas al 40% es como construir el techo de una casa sin haber puesto los cimientos.",
        practicalExample:
          "Si inviertes $500 en bolsa pero debes $500 en la tarjeta al 50% de interés, en realidad estás perdiendo dinero todos los días.",
        guardianTip: {
          character: "Toto",
          tip: "Pagar una deuda al 30% es equivalente a tener una inversión garantizada del 30% libre de riesgo.",
        },
        keyTakeaway: "1° Fondo de emergencia, 2° Cero deudas caras, 3° Inversión a largo plazo.",
      },
      {
        id: "investing-sub-2",
        title: "2. Diversificación y horizonte temporal",
        subtitle: "No apostar todo a una sola carta",
        concept:
          "Invertir no es apostar en el casino. Significa comprar partes de cientos de empresas rentables (fondos indexados como el S&P 500 o ETFs globales) y dejarlas crecer por 5, 10 o 20 años.",
        practicalExample:
          "Si una empresa quiebra, las otras 499 siguen generando ganancias y tu capital sigue protegido.",
        guardianTip: {
          character: "Nido",
          tip: "Nunca inviertas en bolsa dinero que vayas a necesitar en los próximos 3 años.",
        },
        keyTakeaway:
          "Diversifica en cientos de empresas y piensa en horizontes de años, no de semanas.",
      },
      {
        id: "investing-sub-3",
        title: "3. La magia del interés compuesto",
        subtitle: "La bola de nieve que trabaja para ti",
        concept:
          "El interés compuesto ocurre cuando las ganancias de tu inversión generan sus propias ganancias año tras año. Con el tiempo, el dinero generado supera a lo que aportaste.",
        practicalExample:
          "Invertir $100 al mes al 8% anual genera más de $150,000 en 30 años, habiendo puesto de tu bolsillo solo $36,000.",
        guardianTip: {
          character: "Chispa",
          tip: "¡El mejor momento para empezar fue hace 10 años, el segundo mejor momento es hoy!",
        },
        keyTakeaway: "La constancia y el tiempo son los mejores amigos de tu libertad financiera.",
      },
    ],
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
    subLessons: [
      {
        id: "inflation-sub-1",
        title: "1. El ladrón silencioso",
        subtitle: "Cómo el dinero quieto pierde poder de compra",
        concept:
          "La inflación hace que los precios suban con el tiempo. Si guardas $1,000 bajo el colchón hoy, en 10 años seguirás teniendo los mismos $1,000 en papel, pero comprarás la mitad de cosas.",
        practicalExample:
          "Lo que hace 10 años comprabas con $10 en el supermercado, hoy cuesta $18 o $20.",
        guardianTip: {
          character: "Toto",
          tip: "El dinero quieto parece seguro porque el saldo no baja, pero en realidad se está derritiendo como un helado al sol.",
        },
        keyTakeaway: "La inflación destruye el poder de compra del dinero quieto.",
      },
      {
        id: "inflation-sub-2",
        title: "2. Cuentas remuneradas y renta fija",
        subtitle: "Hacer que tu reserva genere rendimiento diario",
        concept:
          "Hoy existen cuentas remuneradas y fondos monetarios de bajo riesgo que te pagan intereses diarios o mensuales solo por tener tu dinero allí, manteniendo tu liquidez.",
        practicalExample:
          "Si tu fondo de emergencia de $3,000 está en una cuenta al 5% o 8% anual, genera entre $150 y $240 al año sin hacer nada.",
        guardianTip: {
          character: "Nido",
          tip: "Pon a trabajar cada peso de tu reserva de Nido en instrumentos seguros que amortigüen la subida de precios.",
        },
        keyTakeaway:
          "Tu fondo de reserva debe estar en instrumentos seguros que generen rendimientos diarios.",
      },
      {
        id: "inflation-sub-3",
        title: "3. La mentalidad de patrimonio real",
        subtitle: "Medir tu riqueza en lo que puedes comprar",
        concept:
          "Tu verdadera riqueza no es el número de billetes en tu billetera, sino tu capacidad de cubrir tu estilo de vida, comprar activos y vivir con tranquilidad a largo plazo.",
        practicalExample:
          "Al combinar presupuesto 0-base, reserva protegida e inversiones constantes, creas un escudo financiero a prueba de cualquier crisis.",
        guardianTip: {
          character: "Chispa",
          tip: "¡Dominar estas 12 lecciones te convierte en un estratega financiero con el control absoluto de su futuro!",
        },
        keyTakeaway:
          "El conocimiento aplicado es tu mejor protección y tu mayor multiplicador de riqueza.",
      },
    ],
  },
];
