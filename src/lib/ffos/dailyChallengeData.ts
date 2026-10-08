/**
 * UALÍ — Motor del Desafío Flash de Toto
 * Mecánica de Retención Diaria & Micro-Dilemas de Juicio Financiero Rápido
 */

export interface DailyMicroDilemma {
  id: string;
  situation: string; // [SITUACIÓN LÍMITE EN 1 ORACIÓN] + [EL DILEMA FINANCIERO TÁCTICO]
  options: {
    id: "A" | "B";
    text: string;
    isCorrect: boolean;
    tag: string;
  }[];
  totoCleanDiagnosis: string; // Máx 2 líneas de felicitación estratégica
  totoErrorDiagnosis: string; // Máx 2 líneas de diagnóstico táctico al fallar o indecisión
}

export const DAILY_DILEMMAS: DailyMicroDilemma[] = [
  {
    id: "dilemma-01",
    situation:
      "Tu refrigerador se quemó un día antes de cobrar tu quincena y tienes $45 en cuenta corriente. ¿Financiar uno nuevo a 24 cuotas de $30 o retirar de tu Fondo Nido para comprar uno funcional al contado?",
    options: [
      {
        id: "A",
        text: "Retirar de tu Fondo Nido y comprar al contado sin asumir intereses",
        isCorrect: true,
        tag: "Blindaje Nido Activo",
      },
      {
        id: "B",
        text: "Financiar el modelo nuevo a 24 meses porque la cuota parece baja",
        isCorrect: false,
        tag: "Trampa de Cuota Chiquita",
      },
    ],
    totoCleanDiagnosis:
      "¡Fuerza táctica perfecta! Para esto construiste el Fondo Nido: pulverizar la emergencia sin hipotecar 24 meses de tu futuro.",
    totoErrorDiagnosis:
      "Toto: Financiar a 2 años por ignorar tu fondo de reserva es auto-sabotaje. Las cuotas pequeñas te roban flujo de caja libre.",
  },
  {
    id: "dilemma-02",
    situation:
      "Tu tarjeta de crédito tiene corte mañana y cuentas con $200 de excedente: ¿liquidar el saldo completo o transferirlos a ahorros para 'sentir que tienes efectivo'?",
    options: [
      {
        id: "A",
        text: "Liquidar la tarjeta al 100% para evitar el sangrado por intereses del 38%",
        isCorrect: true,
        tag: "Totalero Disciplinado",
      },
      {
        id: "B",
        text: "Guardar los $200 en ahorros y pagar solo el mínimo requerido",
        isCorrect: false,
        tag: "Ilusión de Liquidez",
      },
    ],
    totoCleanDiagnosis:
      "¡Visión de halcón! Pagar una tarjeta al 38% equivale a una inversión garantizada libre de riesgo. Matas el sangrado bancario.",
    totoErrorDiagnosis:
      "Toto: Ahorrar al 4% mientras el banco te cobra 38% en tarjeta es una sangría oculta. Pagar deuda cara siempre rinde más.",
  },
  {
    id: "dilemma-03",
    situation:
      "Una rotura en la tubería de tu casa exige $120 urgentes hoy, justo cuando ibas a aprovechar un descuento relámpago del 50% en ropa deportiva de temporada.",
    options: [
      {
        id: "A",
        text: "Reparar la fuga de inmediato y congelar el gasto en ropa",
        isCorrect: true,
        tag: "Prioridad Estructural",
      },
      {
        id: "B",
        text: "Comprar la ropa en oferta y postergar el arreglo con un balde",
        isCorrect: false,
        tag: "Falsa Economía",
      },
    ],
    totoCleanDiagnosis:
      "¡Decisión de blindaje! Primero se tapan las vías de agua antes de decorar la cubierta. Cero deudas por daños colaterales.",
    totoErrorDiagnosis:
      "Toto: Un descuento en algo que no necesitas no es un ahorro. Dejar gotear la tubería multiplicará el costo de reparación por diez.",
  },
  {
    id: "dilemma-04",
    situation:
      "Tienes dos deudas activas: una pequeña de $90 al 18% y una grande de $1,200 al 22%. Te llegó un incentivo inesperado de $100 en efectivo.",
    options: [
      {
        id: "A",
        text: "Bola de Nieve: pulverizar la de $90 completa y sumar su cuota a la grande",
        isCorrect: true,
        tag: "Inercia Exponencial",
      },
      {
        id: "B",
        text: "Repartir $50 y $50 a cada una para no descuidar ninguna",
        isCorrect: false,
        tag: "Fuerza Dispersa",
      },
    ],
    totoCleanDiagnosis:
      "¡Impacto concentrado! Al aniquilar la primera deuda liberas su cuota mensual completa, acelerando la bola de nieve contra el pasivo mayor.",
    totoErrorDiagnosis:
      "Toto: Dispersar tu munición no liquida ningún frente. Mata primero el objetivo pequeño para ganar flujo de caja y momentum mental.",
  },
  {
    id: "dilemma-05",
    situation:
      "Tu Clan Financiero propone una salida gastronómica premium, pero el presupuesto de ocio del mes ya está en $0 y faltan 6 días para el cierre.",
    options: [
      {
        id: "A",
        text: "Proponer reunión en casa compartiendo insumos y respetar el cierre de mes",
        isCorrect: true,
        tag: "Pacto de Clan",
      },
      {
        id: "B",
        text: "Aceptar la salida y cargarla a la tarjeta confiando en 'acomodarse luego'",
        isCorrect: false,
        tag: "Presión Social",
      },
    ],
    totoCleanDiagnosis:
      "¡Liderazgo de equipo! Proteger el presupuesto colectivo fortalece la cultura financiera del clan sin aislarse socialmente.",
    totoErrorDiagnosis:
      "Toto: Ceder ante la presión rompiendo el presupuesto compartido fractura la confianza y crea deudas invisibles en el grupo.",
  },
  {
    id: "dilemma-06",
    situation:
      "Recibiste un aumento salarial del 12% neto. Tu mente te pide actualizar tu vehículo; tu plan pide acelerar tu libertad financiera.",
    options: [
      {
        id: "A",
        text: "Automatizar el 12% íntegro directo a ahorro e inversión antes de verlo",
        isCorrect: true,
        tag: "Antídoto Anti-Inflación",
      },
      {
        id: "B",
        text: "Aumentar tus consumos habituales porque tu nuevo estatus lo justifica",
        isCorrect: false,
        tag: "Inflación de Estilo",
      },
    ],
    totoCleanDiagnosis:
      "¡Maestría patrimonial! Neutralizaste la inflación de estilo de vida. Tu nuevo sueldo trabaja para tu libertad, no para apariencias.",
    totoErrorDiagnosis:
      "Toto: Si cada aumento infla tus gastos fijos, serás un prisionero con mejor sueldo. Aumenta tu patrimonio, no tus cadenas.",
  },
  {
    id: "dilemma-07",
    situation:
      "Un conocido te asegura 100% de ganancia en 7 días en un esquema de trading sin riesgo, mientras aún no tienes tu primer mes de fondo de emergencia.",
    options: [
      {
        id: "A",
        text: "Rechazar de plano y seguir consolidando tu fondo de emergencia seguro",
        isCorrect: true,
        tag: "Cimientos Blindados",
      },
      {
        id: "B",
        text: "Invertir tu colchón disponible para multiplicar rápido y armar el fondo luego",
        isCorrect: false,
        tag: "Canto de Sirenas",
      },
    ],
    totoCleanDiagnosis:
      "¡Blindaje de acero! No existe alta rentabilidad sin alto riesgo. Quien construye cimientos sólidos jamás cae en espejismos.",
    totoErrorDiagnosis:
      "Toto: Apostar sin fondo de emergencia es lanzarte al abismo sin paracaídas. La codicia sin reserva es la receta para la quiebra.",
  },
  {
    id: "dilemma-08",
    situation:
      "En el supermercado ves una súper promoción 'Paga 2 y lleva 3' en artículos de lujo que no estaban incluidos en tu lista planificada.",
    options: [
      {
        id: "A",
        text: "Ignorar la oferta y comprar con precisión quirúrgica solo lo presupuestado",
        isCorrect: true,
        tag: "Disciplina Presupuestaria",
      },
      {
        id: "B",
        text: "Comprar el paquete porque 'está regalado y se ahorra a largo plazo'",
        isCorrect: false,
        tag: "Gasto No Planificado",
      },
    ],
    totoCleanDiagnosis:
      "¡Foco total! El verdadero ahorro fue dejar los artículos en la repisa. Gastar en lo no planeado nunca es una oferta.",
    totoErrorDiagnosis:
      "Toto: Comprar con 33% de descuento lo que no necesitas sigue siendo un desperdicio del 100% de tu dinero real.",
  },
];

const DAILY_CHALLENGE_STORAGE_KEY = "uali_toto_daily_challenge_state_v2";

export interface DailyChallengeState {
  date: string; // YYYY-MM-DD
  status: "not_started" | "in_progress" | "completed_clean" | "completed_error" | "completed_timeout" | "abandoned";
  selectedOption: "A" | "B" | null;
  startedAt: number | null;
  finishedAt: number | null;
  xpEarned: number;
  tokensEarned: number;
  hadStressPenalty: boolean;
  dilemmaId: string;
}

/**
 * Obtiene la fecha actual en formato local YYYY-MM-DD
 */
export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Selecciona el dilema del día determinísticamente según la fecha
 */
export function getDilemmaForDate(dateKey: string = getTodayKey()): DailyMicroDilemma {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_DILEMMAS.length;
  return DAILY_DILEMMAS[index];
}

/**
 * Carga el estado guardado del desafío diario
 */
export function loadDailyChallengeState(): DailyChallengeState {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(DAILY_CHALLENGE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyChallengeState;
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading daily challenge state", err);
  }

  // Estado virgen para hoy
  return {
    date: today,
    status: "not_started",
    selectedOption: null,
    startedAt: null,
    finishedAt: null,
    xpEarned: 0,
    tokensEarned: 0,
    hadStressPenalty: false,
    dilemmaId: getDilemmaForDate(today).id,
  };
}

/**
 * Guarda el estado del desafío diario
 */
export function saveDailyChallengeState(state: DailyChallengeState): void {
  try {
    localStorage.setItem(DAILY_CHALLENGE_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Error saving daily challenge state", err);
  }
}
