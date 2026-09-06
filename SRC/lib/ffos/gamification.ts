export type Level = { level: number; name: string; xpRequired: number };

export const LEVELS: Level[] = [
  { level: 1, name: "Aprendiz", xpRequired: 0 },
  { level: 2, name: "Organizador", xpRequired: 150 },
  { level: 3, name: "Estratega", xpRequired: 350 },
  { level: 4, name: "Planificador", xpRequired: 600 },
  { level: 5, name: "Maestro", xpRequired: 900 },
];

export type LevelInfo = {
  level: number;
  name: string;
  next: Level | null;
  /** 0-100, progress within the current level */
  pct: number;
  xpIntoLevel: number;
  xpForLevel: number;
  xpToNext: number;
};

export function levelInfo(xp: number): LevelInfo {
  let current: Level = LEVELS[0]!;
  let next: Level | null = null;

  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i]!;
    if (xp >= level.xpRequired) {
      current = level;
      next = LEVELS[i + 1] ?? null;
    }
  }

  const xpForLevel = next ? next.xpRequired - current.xpRequired : 0;
  const xpIntoLevel = next ? xp - current.xpRequired : 0;
  const pct = next ? Math.min(100, Math.max(0, (xpIntoLevel / xpForLevel) * 100)) : 100;
  const xpToNext = next ? next.xpRequired - xp : 0;

  return { level: current.level, name: current.name, next, pct, xpIntoLevel, xpForLevel, xpToNext };
}

export type Lesson = {
  id: string;
  /** Level required to unlock this lesson in the learning path */
  minLevel: number;
  title: string;
  body: string;
  question: string;
  options: string[];
  /** Index into `options` of the correct answer */
  answer: number;
  xp: number;
};

export const LESSONS: Lesson[] = [
  {
    id: "intro",
    minLevel: 1,
    xp: 25,
    title: "Presupuesto 0-base",
    body: "Asigná cada peso antes de gastarlo: todo ingreso tiene un destino definido de antemano.",
    question: "¿Cuál es la regla principal del presupuesto 0-base?",
    options: ["Gastar lo menos posible", "Asignar cada peso antes de gastarlo", "Ahorrar el 50% del ingreso"],
    answer: 1,
  },
  {
    id: "needs_wants",
    minLevel: 1,
    xp: 25,
    title: "Necesidades vs deseos",
    body: "Separar los gastos fijos e indispensables de los discrecionales ordena cualquier presupuesto.",
    question: "¿El streaming de series es una necesidad o un deseo?",
    options: ["Necesidad", "Deseo", "Ninguna de las dos"],
    answer: 1,
  },
  {
    id: "emergency",
    minLevel: 1,
    xp: 25,
    title: "Fondo de emergencia",
    body: "El objetivo es cubrir entre 3 y 6 meses de gastos fijos antes de pensar en invertir.",
    question: "¿Cuántos meses de gastos cubre un fondo de emergencia básico?",
    options: ["1 mes", "3 a 6 meses", "12 meses"],
    answer: 1,
  },
  {
    id: "savings_basics",
    minLevel: 2,
    xp: 25,
    title: "Ahorro básico",
    body: "Pagate a vos primero: separá el ahorro apenas entra el ingreso, no con lo que sobra a fin de mes.",
    question: "¿Cuándo conviene apartar el ahorro?",
    options: ["Al final del mes", "Al principio del mes", "Solo cuando sobra dinero"],
    answer: 1,
  },
  {
    id: "credit_cards",
    minLevel: 2,
    xp: 25,
    title: "Tarjetas de crédito",
    body: "Una tarjeta es una herramienta de pago, no una extensión del ingreso mensual.",
    question: "¿Cuándo conviene usar la tarjeta de crédito?",
    options: [
      "Siempre que se pueda",
      "Solo si se paga el total al vencimiento",
      "Solo en emergencias sin plan de pago",
    ],
    answer: 1,
  },
  {
    id: "bank_credit",
    minLevel: 3,
    xp: 25,
    title: "Créditos bancarios",
    body: "Antes de firmar hay que comparar tasa, plazo y seguros incluidos: eso define el costo real del crédito.",
    question: "¿Qué hay que comparar entre créditos?",
    options: ["Solo el monto de la cuota", "Tasa, plazo y seguros", "Solo el banco que lo ofrece"],
    answer: 1,
  },
  {
    id: "debt_order",
    minLevel: 3,
    xp: 25,
    title: "Orden de ataque de deudas",
    body: "El método avalancha prioriza pagar primero la deuda con la tasa de interés más alta.",
    question: "¿En qué consiste el método avalancha?",
    options: ["Pagar primero la deuda más chica", "Pagar primero la deuda con mayor tasa", "Pagar primero la deuda más antigua"],
    answer: 1,
  },
  {
    id: "snowball",
    minLevel: 4,
    xp: 25,
    title: "Bola de nieve",
    body: "El método bola de nieve paga primero la deuda más chica para generar impulso psicológico.",
    question: "¿En qué se basa el método bola de nieve?",
    options: ["Mayor tasa primero", "Deuda más chica primero", "Deuda más antigua primero"],
    answer: 1,
  },
  {
    id: "investing_101",
    minLevel: 4,
    xp: 25,
    title: "Inversión 101",
    body: "El orden correcto es: fondo de emergencia, luego deuda de alta tasa, recién después invertir.",
    question: "¿Qué va primero, antes de empezar a invertir?",
    options: ["Invertir apenas se pueda", "Fondo de emergencia y deudas caras", "Comprar lo que se venía posponiendo"],
    answer: 1,
  },
];

export type Achievement = { id: string; name: string; description: string };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_tx", name: "Primer registro", description: "Registraste tu primer movimiento." },
  { id: "week_streak", name: "Racha semanal", description: "Registraste movimientos 7 días seguidos." },
  { id: "first_lesson", name: "Primera lección", description: "Completaste tu primera lección." },
  { id: "saver", name: "Ahorrista", description: "Registraste tu primer ahorro." },
  { id: "debt_slayer", name: "Cazadeudas", description: "Registraste tu primer pago de deuda." },
];
