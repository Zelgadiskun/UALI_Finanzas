/**
 * Motor de Videojuegos UALÍ: Simulación de Vida Financiera
 * 
 * Basado en roles y toma de decisiones rápidas con aprendizaje por ensayo y error.
 * Diseñado con protección contra la sobrecarga cognitiva de Eduardo:
 * - Regla de 3 indicadores macro (Flujo Toto, Blindaje Nido, Cortisol).
 * - 1 dilema a la vez en pantalla.
 * - Consecuencias didácticas sin castigo punitivo: el error es fuente de aprendizaje.
 */

export type SimulationRoleKey = "freelance" | "salaried" | "entrepreneur";

export interface SimulationRole {
  id: SimulationRoleKey;
  title: string;
  characterName: string;
  tagline: string;
  avatarEmoji: string;
  initialCashflow: number; // Flujo líquido inicial ($)
  initialShield: number;   // Fondo de emergencia Nido ($)
  initialCortisol: number; // Nivel de estrés (0-100)
  initialWisdom: number;   // Sabiduría acumulada
  description: string;
  vulnerability: string;
  superpower: string;
}

export interface DilemmaChoice {
  id: string;
  label: string;
  subtext: string;
  deltaCashflow: number;
  deltaShield: number;
  deltaCortisol: number; // Negativo = calma, Positivo = estrés
  deltaWisdom: number;
  feedbackTitle: string;
  feedbackLesson: string;
  guardian: "nido" | "chispa" | "toto";
  badge: "Prudente" | "Equilibrado" | "Impulsivo" | "Creativo";
}

export interface SimulationDilemma {
  id: number;
  roundNumber: number;
  contextTag: string;
  title: string;
  narrative: string;
  question: string;
  choices: DilemmaChoice[];
}

export interface SimulationState {
  role: SimulationRole;
  roundIndex: number; // 0 a 4 (5 rondas por simulación)
  cashflow: number;
  shield: number;
  cortisol: number; // Clamp 0 a 100
  wisdom: number;
  xpEarned: number;
  isComplete: boolean;
  history: Array<{
    dilemma: SimulationDilemma;
    choice: DilemmaChoice;
  }>;
}

export const SIMULATION_ROLES: Record<SimulationRoleKey, SimulationRole> = {
  freelance: {
    id: "freelance",
    title: "Creador Digital Freelancer",
    characterName: "Mateo",
    tagline: "Ingresos por hitos y flujo oscilante",
    avatarEmoji: "💻",
    initialCashflow: 1400,
    initialShield: 800,
    initialCortisol: 30,
    initialWisdom: 15,
    description: "Vives de proyectos y clientes internacionales. La libertad es tu bandera, pero los pagos tardíos pueden descolocarte si tu Nido está vacío.",
    vulnerability: "Pagos retrasados a 45 días e incertidumbre de ingresos.",
    superpower: "Capacidad rápida de generar ingresos extras con nuevos proyectos.",
  },
  salaried: {
    id: "salaried",
    title: "Asalariada en Crecimiento",
    characterName: "Sofía",
    tagline: "Sueldo fijo con presión social de consumo",
    avatarEmoji: "🏢",
    initialCashflow: 950,
    initialShield: 1600,
    initialCortisol: 35,
    initialWisdom: 20,
    description: "Cobras puntual cada quincena en una agencia en expansión. El gran reto es la inflación de estilo de vida ('lifestyle creep') y las ofertas a meses sin intereses.",
    vulnerability: "Gasto hormiga social y tarjetas de crédito con CAT elevado.",
    superpower: "Flujo predecible que facilita la automatización de la Canasta 50/30/20.",
  },
  entrepreneur: {
    id: "entrepreneur",
    title: "Emprendedor Gastronómico",
    characterName: "Leo",
    tagline: "Ventas diarias y costos operativos de local",
    avatarEmoji: "☕",
    initialCashflow: 2100,
    initialShield: 700,
    initialCortisol: 50,
    initialWisdom: 25,
    description: "Administras una cafetería de especialidad. La facturación parece alta, pero si mezclas el dinero del negocio con tus finanzas personales, quedas sin oxígeno.",
    vulnerability: "Rotura de equipamiento e inventario perecedero.",
    superpower: "Alto potencial de multiplicar patrimonio si reinviertes con prudencia.",
  },
};

/**
 * Banco de dilemas por rol (5 rondas de decisión rápida cada uno)
 */
export const ROLE_DILEMMAS: Record<SimulationRoleKey, SimulationDilemma[]> = {
  freelance: [
    {
      id: 101,
      roundNumber: 1,
      contextTag: "Semana 1 • Equipo de Trabajo",
      title: "La Falla en la Máquina de Producción",
      narrative: "Tu laptop principal empieza a parpadear con artefactos en pantalla justo antes de entregar un render publicitario para un cliente clave.",
      question: "¿Cómo solucionas esta emergencia operativa?",
      choices: [
        {
          id: "f1_a",
          label: "Usar $180 del Fondo de Emergencia Nido para reparar el panel hoy mismo.",
          subtext: "Priorizas continuar trabajando sin endeudarte.",
          deltaCashflow: 0,
          deltaShield: -180,
          deltaCortisol: -10,
          deltaWisdom: 20,
          feedbackTitle: "¡Escudo Nido en acción!",
          feedbackLesson: "Para esto existe el fondo de emergencia: absorbió el golpe sin alterar tu presupuesto del mes ni generar deudas de tarjeta.",
          guardian: "nido",
          badge: "Prudente",
        },
        {
          id: "f1_b",
          label: "Comprar el modelo tope de gama a 24 cuotas de $85 ($2,040 total).",
          subtext: "Te entusiasma la potencia, pero creas una deuda fija mensual.",
          deltaCashflow: -85,
          deltaShield: 0,
          deltaCortisol: +25,
          deltaWisdom: 5,
          feedbackTitle: "Atención al compromiso futuro",
          feedbackLesson: "Resolviste el problema inmediato, pero agregaste un costo fijo mensual que pesará en los meses con pocos proyectos.",
          guardian: "toto",
          badge: "Impulsivo",
        },
        {
          id: "f1_c",
          label: "Alquilar un equipo por 3 días ($45) y llevar la laptop al servicio técnico.",
          subtext: "Gasto mínimo temporal mientras diagnosticas.",
          deltaCashflow: -45,
          deltaShield: 0,
          deltaCortisol: +5,
          deltaWisdom: 15,
          feedbackTitle: "Solución táctica intermedia",
          feedbackLesson: "Mantuviste la entrega a tiempo sin desgastar tus reservas principales.",
          guardian: "chispa",
          badge: "Creativo",
        },
      ],
    },
    {
      id: 102,
      roundNumber: 2,
      contextTag: "Semana 2 • Negociación",
      title: "El Cliente que Pospone el Pago",
      narrative: "El cliente aprueba el trabajo pero contabilidad avisa que el pago de $1,200 saldrá en 45 días en vez de inmediato.",
      question: "¿Cómo cubres tus costos personales del mes?",
      choices: [
        {
          id: "f2_a",
          label: "Ofrecer 5% de descuento si liquidan en 48 horas ($1,140 netos recibidos).",
          subtext: "Cedes una pequeña ganancia a cambio de liquidez certera.",
          deltaCashflow: +1140,
          deltaShield: 0,
          deltaCortisol: -20,
          deltaWisdom: 25,
          feedbackTitle: "Prontopago inteligente",
          feedbackLesson: "Tener el dinero hoy suele ser más rentable que esperar 45 días y estresarte con deudas de corto plazo.",
          guardian: "toto",
          badge: "Equilibrado",
        },
        {
          id: "f2_b",
          label: "Pagar el alquiler con tarjeta de crédito pagando solo el mínimo.",
          subtext: "Retrasas el pago personal esperando que el cliente cumpla.",
          deltaCashflow: -50,
          deltaShield: 0,
          deltaCortisol: +30,
          deltaWisdom: 5,
          feedbackTitle: "Trampa del pago mínimo",
          feedbackLesson: "Los intereses rotativos de tarjetas crecen al 60% anual. Tu cortisol aumenta porque la deuda ahora rueda como bola de nieve.",
          guardian: "nido",
          badge: "Impulsivo",
        },
        {
          id: "f2_c",
          label: "Ajustar la canasta no esencial y tomar un micro-proyecto flash de 2 días ($350).",
          subtext: "Generas puente de caja con trabajo rápido.",
          deltaCashflow: +350,
          deltaShield: 0,
          deltaCortisol: +5,
          deltaWisdom: 20,
          feedbackTitle: "Agilidad freelance",
          feedbackLesson: "Activaste tu capacidad productiva sin generar intereses ni quemar tus ahorros.",
          guardian: "chispa",
          badge: "Creativo",
        },
      ],
    },
    {
      id: 103,
      roundNumber: 3,
      contextTag: "Semana 3 • Tentación de Suscripciones",
      title: "El Bundle Anual de Herramientas IA",
      narrative: "Aparece una promoción del 50% de descuento si pagas $360 por un año entero de software de diseño y plugins generativos.",
      question: "¿Cómo evalúas esta adquisición?",
      choices: [
        {
          id: "f3_a",
          label: "Pagar solo el plan mensual de $35 por 30 días para validar el retorno real.",
          subtext: "Compruebas si realmente aumenta tus ingresos antes de comprometer $360.",
          deltaCashflow: -35,
          deltaShield: 0,
          deltaCortisol: -5,
          deltaWisdom: 25,
          feedbackTitle: "Validación lean sin fricción",
          feedbackLesson: "Muchos profesionales caen en la 'trampa del software': pagar licencias anuales que solo usan un mes. Validar mes a mes protege tu caja.",
          guardian: "chispa",
          badge: "Prudente",
        },
        {
          id: "f3_b",
          label: "Comprar el paquete anual de $360 aprovechando el descuento promocional.",
          subtext: "Ahorras en papel a largo plazo, pero sale de tu liquidez inmediata.",
          deltaCashflow: -360,
          deltaShield: 0,
          deltaCortisol: +10,
          deltaWisdom: 10,
          feedbackTitle: "Descuento con costo de oportunidad",
          feedbackLesson: "Ahorrar 50% solo tiene sentido si tenías el dinero presupuestado; de lo contrario drena tu flujo disponible.",
          guardian: "toto",
          badge: "Equilibrado",
        },
        {
          id: "f3_c",
          label: "Usar herramientas open source gratuitas y posponer la compra.",
          subtext: "Priorizas mantener cada peso en tu cuenta.",
          deltaCashflow: 0,
          deltaShield: 0,
          deltaCortisol: 0,
          deltaWisdom: 15,
          feedbackTitle: "Cero impacto en caja",
          feedbackLesson: "Mantuviste tu presupuesto intacto. Si la demanda del cliente lo exige en el futuro, podrás facturárselo directamente.",
          guardian: "nido",
          badge: "Prudente",
        },
      ],
    },
    {
      id: 104,
      roundNumber: 4,
      contextTag: "Semana 4 • Retención Fiscal",
      title: "El Aviso Impositivo Trimestral",
      narrative: "Llega el corte contable: debes declarar y pagar $320 de impuestos por los ingresos facturados el trimestre anterior.",
      question: "¿De dónde extraes los fondos para cumplir?",
      choices: [
        {
          id: "f4_a",
          label: "Pagar de la sub-cuenta de impuestos que fuiste apartando del 15% de cada factura.",
          subtext: "Automatización preventiva al estilo Págate Primero.",
          deltaCashflow: 0,
          deltaShield: 0,
          deltaCortisol: -20,
          deltaWisdom: 30,
          feedbackTitle: "¡Paz mental absoluta!",
          feedbackLesson: "Separar impuestos al momento de cobrar es la clave para que la declaración fiscal no sea un evento traumático ni requiera deudas.",
          guardian: "nido",
          badge: "Prudente",
        },
        {
          id: "f4_b",
          label: "Pagarlo de tu liquidez general del mes, apretando la canasta de gustos.",
          subtext: "Cumples la obligación pero recortas tus salidas y placeres.",
          deltaCashflow: -320,
          deltaShield: 0,
          deltaCortisol: +15,
          deltaWisdom: 15,
          feedbackTitle: "Ajuste de cinturón necesario",
          feedbackLesson: "Cumpliste con la ley sin pedir prestado, pero sufriste fatiga de consumo por no haberlo apartado progresivamente.",
          guardian: "toto",
          badge: "Equilibrado",
        },
        {
          id: "f4_c",
          label: "Pedir prórroga con recargo del 8% mensual esperando cobrar más proyectos.",
          subtext: "Pateas el problema para el próximo mes con intereses de mora.",
          deltaCashflow: 0,
          deltaShield: 0,
          deltaCortisol: +35,
          deltaWisdom: 5,
          feedbackTitle: "Costo psicológico y financiero",
          feedbackLesson: "Los recargos fiscales crecen más rápido que cualquier ahorro. Tu nivel de cortisol se dispara por el recordatorio pendiente.",
          guardian: "chispa",
          badge: "Impulsivo",
        },
      ],
    },
    {
      id: 105,
      roundNumber: 5,
      contextTag: "Semana 5 • Cierre de Ciclo",
      title: "Bono Extraordinario y Cosecha",
      narrative: "Un cliente corporativo queda fascinado con tu campaña y deposita un bono de gratificación de $900.",
      question: "¿Cómo distribuyes este superávit para sellar tu ciclo?",
      choices: [
        {
          id: "f5_a",
          label: "Aplicar la Regla UALÍ: 50% al Escudo Nido ($450), 30% a reinversión ($270) y 20% a disfrute ($180).",
          subtext: "Equilibrio armónico entre seguridad, crecimiento y recompensa.",
          deltaCashflow: +180,
          deltaShield: +450,
          deltaCortisol: -30,
          deltaWisdom: 35,
          feedbackTitle: "Arquitectura de Riqueza Consciente",
          feedbackLesson: "Fortaleciste tu nido para futuros meses bajos, premiaste tu esfuerzo y alimentaste tu negocio sin culpa.",
          guardian: "nido",
          badge: "Prudente",
        },
        {
          id: "f5_b",
          label: "Destinar el 100% a un viaje de fin de semana de lujo para celebrar.",
          subtext: "Dopamina inmediata sin reserva para contingencias.",
          deltaCashflow: 0,
          deltaShield: 0,
          deltaCortisol: +10,
          deltaWisdom: 10,
          feedbackTitle: "Celebración efímera",
          feedbackLesson: "Disfrutaste el momento, pero tu negocio sigue igual de vulnerable ante el próximo imprevisto de clientes.",
          guardian: "toto",
          badge: "Impulsivo",
        },
        {
          id: "f5_c",
          label: "Dejarlo 100% en la cuenta corriente disponible sin etiquetar.",
          subtext: "Dinero sin destino asignado que se disuelve en micro-gastos.",
          deltaCashflow: +900,
          deltaShield: 0,
          deltaCortisol: -5,
          deltaWisdom: 15,
          feedbackTitle: "Peligro de dinero huérfano",
          feedbackLesson: "La regla de Presupuesto Base Cero enseña que cada peso debe tener un trabajo asignado, o la canasta de gastos invisibles lo devorará.",
          guardian: "chispa",
          badge: "Equilibrado",
        },
      ],
    },
  ],
  salaried: [
    {
      id: 201,
      roundNumber: 1,
      contextTag: "Semana 1 • Presión Social",
      title: "La Cena de Cumpleaños Corporativa",
      narrative: "Tus colegas organizan una cena en un restaurante de moda para celebrar un ascenso del equipo. La cuenta estimada por persona es de $95.",
      question: "¿Cómo manejas la invitación sin desarmar tu presupuesto?",
      choices: [
        {
          id: "s1_a",
          label: "Asistir y tomar un plato principal más bebida moderada presupuestando $45 con honestidad.",
          subtext: "Compartes el momento sin ceder a la presión de pagar rondas de tragos caros.",
          deltaCashflow: -45,
          deltaShield: 0,
          deltaCortisol: -10,
          deltaWisdom: 25,
          feedbackTitle: "Asertividad financiera",
          feedbackLesson: "Cuidar tus límites con naturalidad genera respeto y demuestra madurez en tu relación con el dinero.",
          guardian: "nido",
          badge: "Prudente",
        },
        {
          id: "s1_b",
          label: "Dividir la cuenta en partes iguales con todos aunque pidieron vino de reserva ($120).",
          subtext: "Pagas de más para no pasar incomodidad frente al grupo.",
          deltaCashflow: -120,
          deltaShield: 0,
          deltaCortisol: +20,
          deltaWisdom: 5,
          feedbackTitle: "Sobrecarga por complacencia",
          feedbackLesson: "Pagar por los excesos ajenos solo por miedo al qué dirán es una de las mayores fugas de capital en la vida profesional.",
          guardian: "toto",
          badge: "Impulsivo",
        },
        {
          id: "s1_c",
          label: "Proponer reunirse para un café o postre después de la cena ($15).",
          subtext: "Mantienes la conexión social con mínimo impacto en tus metas.",
          deltaCashflow: -15,
          deltaShield: 0,
          deltaCortisol: -5,
          deltaWisdom: 20,
          feedbackTitle: "Alternativa empática",
          feedbackLesson: "Participaste del festejo sin comprometer la canasta de necesidades básicas de la quincena.",
          guardian: "chispa",
          badge: "Creativo",
        },
      ],
    },
    {
      id: 202,
      roundNumber: 2,
      contextTag: "Semana 2 • Crédito y Tarjetas",
      title: "El Incremento de Línea de Crédito",
      narrative: "Tu banco te envía un mensaje: '¡Felicidades Sofía, duplicamos tu límite de tarjeta de $2,000 a $4,500!'.",
      question: "¿Cómo reaccionas ante esta oferta de crédito?",
      choices: [
        {
          id: "s2_a",
          label: "Mantener el límite anterior o configurar un tope de gasto en la app en $1,000.",
          subtext: "El crédito es una herramienta de pago, no una extensión de tu sueldo.",
          deltaCashflow: 0,
          deltaShield: 0,
          deltaCortisol: -15,
          deltaWisdom: 30,
          feedbackTitle: "Blindaje contra el sobreendeudamiento",
          feedbackLesson: "Tener más crédito disponible aumenta la probabilidad estadística de gastar más. Ponerte un límite voluntario protege tu bienestar.",
          guardian: "nido",
          badge: "Prudente",
        },
        {
          id: "s2_b",
          label: "Aceptar y aprovechar el nuevo margen para comprar ropa y accesorios de marca.",
          subtext: "Confundes capacidad de crédito con capacidad de pago real.",
          deltaCashflow: -350,
          deltaShield: 0,
          deltaCortisol: +25,
          deltaWisdom: 5,
          feedbackTitle: "Trampa del CAT invisible",
          feedbackLesson: "Comprar pasivos que pierden valor a crédito reduce tu salario neto futuro. La ansiedad por pagar la tarjeta subirá a fin de mes.",
          guardian: "toto",
          badge: "Impulsivo",
        },
        {
          id: "s2_c",
          label: "Aceptar el límite para mejorar tu score crediticio pero usarla únicamente como método de débito (totalera).",
          subtext: "Pagas el 100% de lo consumido antes de la fecha de corte.",
          deltaCashflow: 0,
          deltaShield: 0,
          deltaCortisol: -5,
          deltaWisdom: 25,
          feedbackTitle: "Uso maestro del crédito",
          feedbackLesson: "Ser cliente totalero te permite acumular puntos y mejorar tu historial sin pagar un solo centavo de intereses.",
          guardian: "chispa",
          badge: "Equilibrado",
        },
      ],
    },
    {
      id: 203,
      roundNumber: 3,
      contextTag: "Semana 3 • Salud y Bienestar",
      title: "El Tratamiento Dental Imprevisto",
      narrative: "En tu revisión semestral el dentista detecta una caries profunda que requiere endodoncia y corona urgente ($380).",
      question: "¿Cómo solventas este gasto de salud?",
      choices: [
        {
          id: "s3_a",
          label: "Utilizar $380 de tu fondo Nido acumulado.",
          subtext: "Para esto construiste tu reserva: la salud no se negocia.",
          deltaCashflow: 0,
          deltaShield: -380,
          deltaCortisol: -20,
          deltaWisdom: 30,
          feedbackTitle: "La salud es la primera riqueza",
          feedbackLesson: "Nido cumplió su propósito heroico: atendiste tu bienestar físico de inmediato sin pedir préstamos de nómina con interés usurero.",
          guardian: "nido",
          badge: "Prudente",
        },
        {
          id: "s3_b",
          label: "Posponer el tratamiento 6 meses esperando que no duela más.",
          subtext: "Ignoras el problema médico para no ver bajar tus números.",
          deltaCashflow: 0,
          deltaShield: 0,
          deltaCortisol: +40,
          deltaWisdom: 5,
          feedbackTitle: "Falsa economía con dolor",
          feedbackLesson: "Posponer problemas de salud siempre resulta en tratamientos 3 veces más caros y dolor crónico que nubla tu productividad.",
          guardian: "toto",
          badge: "Impulsivo",
        },
        {
          id: "s3_c",
          label: "Solicitar descuento por pago al contado y consultar si tu seguro laboral cubre un porcentaje.",
          subtext: "Investigas coberturas antes de desembolsar.",
          deltaCashflow: 0,
          deltaShield: -220,
          deltaCortisol: -10,
          deltaWisdom: 25,
          feedbackTitle: "Gestión inteligente de pólizas",
          feedbackLesson: "Aprovechaste los beneficios de tu empleo y redujiste el impacto en tu fondo de emergencia.",
          guardian: "chispa",
          badge: "Equilibrado",
        },
      ],
    },
    {
      id: 204,
      roundNumber: 4,
      contextTag: "Semana 4 • Automatización",
      title: "El Día del Pago de Nómina",
      narrative: "Cae el sueldo del mes en tu cuenta ($1,500 netos). Está intacto frente a ti.",
      question: "¿Cuál es tu primer movimiento financiero?",
      choices: [
        {
          id: "s4_a",
          label: "Págate Primero: Transferir automáticamente 20% ($300) al Nido antes de gastar.",
          subtext: "Aseguras tu futuro antes de pagar a los comercios.",
          deltaCashflow: +1200,
          deltaShield: +300,
          deltaCortisol: -25,
          deltaWisdom: 35,
          feedbackTitle: "El Hábito de Oro de las Finanzas",
          feedbackLesson: "Al pagarte primero, ajustas tu vida al 80% restante con tranquilidad, eliminando la ilusión de que 'ahorrarás lo que sobre a fin de mes'.",
          guardian: "nido",
          badge: "Prudente",
        },
        {
          id: "s4_b",
          label: "Gastar en comidas y salidas primero, dejando el ahorro para el último día del mes.",
          subtext: "El método tradicional que casi siempre termina en cero ahorrado.",
          deltaCashflow: +1500,
          deltaShield: 0,
          deltaCortisol: +15,
          deltaWisdom: 10,
          feedbackTitle: "Ley de Parkinson del dinero",
          feedbackLesson: "El dinero en la cuenta corriente se expande para llenar todos los deseos disponibles. A fin de mes el ahorro fue cero.",
          guardian: "toto",
          badge: "Impulsivo",
        },
        {
          id: "s4_c",
          label: "Pagar todas las facturas fijas de una vez y programar aportes semanales de $75.",
          subtext: "Distribución fraccionada pero constante.",
          deltaCashflow: +1200,
          deltaShield: +300,
          deltaCortisol: -15,
          deltaWisdom: 25,
          feedbackTitle: "Micro-ahorro disciplinado",
          feedbackLesson: "Fraccionar el ahorro ayuda a quienes sienten vértigo de mover sumas grandes de una sola vez.",
          guardian: "chispa",
          badge: "Equilibrado",
        },
      ],
    },
    {
      id: 205,
      roundNumber: 5,
      contextTag: "Semana 5 • Crecimiento",
      title: "La Oferta del Fondo de Inversión Indexado",
      narrative: "Con tu Nido con más de 3 meses de gastos asegurados, tu asesor te propone colocar $500 en un índice diversificado de bajo costo.",
      question: "¿Cómo das tu siguiente paso patrimonial?",
      choices: [
        {
          id: "s5_a",
          label: "Aportar los $500 a largo plazo para activar el Interés Compuesto de Toto.",
          subtext: "Pones a tu dinero a trabajar para ti sin tocar el fondo de emergencia.",
          deltaCashflow: -500,
          deltaShield: 0,
          deltaCortisol: -20,
          deltaWisdom: 40,
          feedbackTitle: "De Ahorradora a Inversionista",
          feedbackLesson: "Tener el Nido completo te dio el permiso psicológico de invertir sin miedo. El tiempo y el interés compuesto multiplicarán tu esfuerzo.",
          guardian: "toto",
          badge: "Prudente",
        },
        {
          id: "s5_b",
          label: "Dejar el dinero estancado en efectivo bajo el colchón perdiendo 6% anual por inflación.",
          subtext: "Miedo a la inversión que termina erosionando tu poder de compra.",
          deltaCashflow: 0,
          deltaShield: 0,
          deltaCortisol: +10,
          deltaWisdom: 10,
          feedbackTitle: "La pérdida silenciosa",
          feedbackLesson: "El dinero quieto pierde valor todos los días por el aumento de precios. Invertir con prudencia protege tu poder adquisitivo.",
          guardian: "chispa",
          badge: "Impulsivo",
        },
        {
          id: "s5_c",
          label: "Invertir $250 en el índice y $250 en un curso de liderazgo para optar a un aumento salarial.",
          subtext: "Diversificas entre tu capital humano y activos financieros.",
          deltaCashflow: -500,
          deltaShield: 0,
          deltaCortisol: -15,
          deltaWisdom: 35,
          feedbackTitle: "Inversión en capital humano",
          feedbackLesson: "Tu mayor activo generador en los primeros años es tu capacidad de ganar más dinero gracias a mejores competencias.",
          guardian: "nido",
          badge: "Creativo",
        },
      ],
    },
  ],
  entrepreneur: [
    {
      id: 301,
      roundNumber: 1,
      contextTag: "Semana 1 • Separación de Cuentas",
      title: "La Mezcla Peligrosa de Cajas",
      narrative: "Termina el primer fin de semana con ventas récord en la cafetería. Tienes $1,800 en la caja registradora y necesitas comprar ropa personal.",
      question: "¿Cómo administras ese ingreso comercial?",
      choices: [
        {
          id: "301_a",
          label: "Asignarte un sueldo fijo como empleado de tu propio negocio y no tocar la caja para gastos personales.",
          subtext: "Tratas tu negocio como una entidad independiente y respetable.",
          deltaCashflow: +400,
          deltaShield: +100,
          deltaCortisol: -20,
          deltaWisdom: 35,
          feedbackTitle: "¡Regla sagrada del emprendimiento!",
          feedbackLesson: "El 80% de los negocios pequeños quiebran porque el dueño usa la caja como cajero personal. Asignarte un sueldo te da orden y solvencia.",
          guardian: "nido",
          badge: "Prudente",
        },
        {
          id: "301_b",
          label: "Tomar $600 directamente de la caja para compras personales sin registrarlo.",
          subtext: "Dificultas el cálculo de costos reales e inventario de la próxima semana.",
          deltaCashflow: -200,
          deltaShield: 0,
          deltaCortisol: +35,
          deltaWisdom: 5,
          feedbackTitle: "Canibalización de capital de trabajo",
          feedbackLesson: "Gastaste el dinero que correspondía a reponer granos de café y leche. La próxima semana tendrás que pedir fiado a proveedores.",
          guardian: "toto",
          badge: "Impulsivo",
        },
        {
          id: "301_c",
          label: "Registrar un retiro oficial por anticipo de ganancias dejando un pagaré contable.",
          subtext: "Al menos dejas constancia matemática del movimiento.",
          deltaCashflow: +200,
          deltaShield: 0,
          deltaCortisol: +5,
          deltaWisdom: 20,
          feedbackTitle: "Paso intermedio de control",
          feedbackLesson: "El registro ayuda, pero formalizar tu sueldo mensual es el verdadero blindaje para la salud mental del emprendedor.",
          guardian: "chispa",
          badge: "Equilibrado",
        },
      ],
    },
    {
      id: 302,
      roundNumber: 2,
      contextTag: "Semana 2 • Maquinaria Crítica",
      title: "La Bomba de la Máquina de Espresso",
      narrative: "El martes por la mañana la máquina de espresso gotea y pierde presión. El técnico pide $450 por repuesto original garantizado.",
      question: "¿Cómo resuelves la reparación operativa?",
      choices: [
        {
          id: "302_a",
          label: "Cubrir el repuesto con el Fondo de Contingencia Operativa del negocio.",
          subtext: "La máquina es el corazón del flujo; se repara con piezas garantizadas.",
          deltaCashflow: -450,
          deltaShield: 0,
          deltaCortisol: -15,
          deltaWisdom: 30,
          feedbackTitle: "Mantenimiento preventivo de activos",
          feedbackLesson: "Tus herramientas principales no admiten soluciones baratas. Proteger la calidad de tu producto mantiene a tus clientes fieles.",
          guardian: "toto",
          badge: "Prudente",
        },
        {
          id: "302_b",
          label: "Poner un parche casero con cinta y esperar que aguante el fin de semana.",
          subtext: "Ahorro aparente que arriesga quemar el motor entero ($2,000).",
          deltaCashflow: 0,
          deltaShield: 0,
          deltaCortisol: +45,
          deltaWisdom: 5,
          feedbackTitle: "Riesgo catastrófico",
          feedbackLesson: "Operar con parches aumenta el cortisol en cada turno. Si la máquina colapsa un sábado al mediodía, las pérdidas serán gigantes.",
          guardian: "nido",
          badge: "Impulsivo",
        },
        {
          id: "302_c",
          label: "Negociar con el técnico pagar 50% hoy y 50% en 15 días con café de cortesía.",
          subtext: "Negociación colaborativa de flujo de caja.",
          deltaCashflow: -225,
          deltaShield: 0,
          deltaCortisol: -5,
          deltaWisdom: 25,
          feedbackTitle: "Acuerdos ganar-ganar",
          feedbackLesson: "Cuidar las relaciones con tus proveedores técnicos locales es uno de tus mayores activos de resiliencia.",
          guardian: "chispa",
          badge: "Creativo",
        },
      ],
    },
    {
      id: 303,
      roundNumber: 3,
      contextTag: "Semana 3 • Negociación de Insumos",
      title: "La Oportunidad por Volumen de Leche de Avena",
      narrative: "El distribuidor ofrece un 30% de descuento si compras 20 cajas de golpe ($600). Tu consumo mensual habitual es de 6 cajas.",
      question: "¿Aceptas la oferta por volumen?",
      choices: [
        {
          id: "303_a",
          label: "Comprar solo 8 cajas con un descuento menor del 10% para no inmovilizar tanto capital.",
          subtext: "Priorizas la rotación ágil del inventario y la liquidez diaria.",
          deltaCashflow: -240,
          deltaShield: 0,
          deltaCortisol: -10,
          deltaWisdom: 30,
          feedbackTitle: "Flujo antes que almacenamiento",
          feedbackLesson: "El capital inmovilizado en cajas en el depósito no paga la nómina si las ventas bajan. Comprar con moderación reduce el riesgo de caducidad.",
          guardian: "chispa",
          badge: "Prudente",
        },
        {
          id: "303_b",
          label: "Gastar los $600 en las 20 cajas para maximizar el margen teórico de ganancia.",
          subtext: "Agotas el efectivo de reserva esperando vender todo en 3 meses.",
          deltaCashflow: -600,
          deltaShield: 0,
          deltaCortisol: +25,
          deltaWisdom: 10,
          feedbackTitle: "Inventario pesado",
          feedbackLesson: "Ahorraste en costo unitario, pero si surge una emergencia no podrás pagar con cajas de avena. La liquidez manda.",
          guardian: "toto",
          badge: "Impulsivo",
        },
        {
          id: "303_c",
          label: "Coordinar con otra cafetería vecina para comprar juntos las 20 cajas y repartir 50/50.",
          subtext: "Economía de escala colaborativa al estilo UALÍ.",
          deltaCashflow: -300,
          deltaShield: 0,
          deltaCortisol: -20,
          deltaWisdom: 40,
          feedbackTitle: "Poder de compra comunitario",
          feedbackLesson: "Colaborar con otros pequeños empresarios te da precios de gran cadena sin arriesgar tu liquidez. ¡Maestría Chispa!",
          guardian: "nido",
          badge: "Creativo",
        },
      ],
    },
    {
      id: 304,
      roundNumber: 4,
      contextTag: "Semana 4 • Marketing y Crecimiento",
      title: "El Influencer que Pide Canje Completo",
      narrative: "Un creador de contenido local con 50k seguidores ofrece 3 historias y 1 reel a cambio de desayunos gratis para 6 personas ($160 de costo).",
      question: "¿Cómo respondes a la propuesta de difusión?",
      choices: [
        {
          id: "304_a",
          label: "Aceptar pero con un menú especial de degustación valorado en $60 y código de descuento medible.",
          subtext: "Mides el retorno exacto de clientes reales antes de regalar banquetes.",
          deltaCashflow: -60,
          deltaShield: 0,
          deltaCortisol: -10,
          deltaWisdom: 30,
          feedbackTitle: "Marketing con métricas",
          feedbackLesson: "Poner un código promocional te permite saber si los 'likes' se convierten en ventas reales o en puro humo digital.",
          guardian: "chispa",
          badge: "Equilibrado",
        },
        {
          id: "304_b",
          label: "Atender a todos sin condiciones con los platos más costosos esperando magia viral.",
          subtext: "Gasto de comida e insumos sin ninguna garantía de retorno.",
          deltaCashflow: -160,
          deltaShield: 0,
          deltaCortisol: +20,
          deltaWisdom: 5,
          feedbackTitle: "El espejismo de la fama",
          feedbackLesson: "Muchos negocios regalan su producto sin un sistema de captura y terminan trabajando gratis para terceros.",
          guardian: "toto",
          badge: "Impulsivo",
        },
        {
          id: "304_c",
          label: "Agradecer amablemente y enfocar esos $160 en regalar muestras a los vecinos y oficinas cercanas.",
          subtext: "Construyes lealtad hiperlocal con clientes recurrentes diarios.",
          deltaCashflow: -80,
          deltaShield: 0,
          deltaCortisol: -15,
          deltaWisdom: 35,
          feedbackTitle: "Clientela orgánica sólida",
          feedbackLesson: "Los clientes de cercanía que vienen 5 días a la semana valen 10 veces más que una visita única por una foto de Instagram.",
          guardian: "nido",
          badge: "Prudente",
        },
      ],
    },
    {
      id: 305,
      roundNumber: 5,
      contextTag: "Semana 5 • Expansión Sostenible",
      title: "La Oferta del Segundo Local",
      narrative: "Un vecino ofrece traspasar un quiosco al lado de la estación de tren por $3,000 iniciales. Tienes $2,200 acumulados.",
      question: "¿Cómo tomas esta decisión de expansión?",
      choices: [
        {
          id: "305_a",
          label: "Posponer la apertura hasta tener el doble del capital requerido y los procesos del local 1 documentados.",
          subtext: "Crecimiento orgánico sin apalancamiento riesgoso.",
          deltaCashflow: 0,
          deltaShield: +400,
          deltaCortisol: -25,
          deltaWisdom: 40,
          feedbackTitle: "Paciencia estratégica",
          feedbackLesson: "Escalar un negocio antes de tiempo duplica los dolores de cabeza si el primer local aún depende al 100% de tu presencia física.",
          guardian: "nido",
          badge: "Prudente",
        },
        {
          id: "305_b",
          label: "Pedir un préstamo bancario de $2,500 al 35% de interés para firmar el contrato mañana.",
          subtext: "Tomas deuda cara asumiendo que el nuevo local será rentable desde el día uno.",
          deltaCashflow: -450,
          deltaShield: -500,
          deltaCortisol: +45,
          deltaWisdom: 5,
          feedbackTitle: "Riesgo de asfixia por deuda",
          feedbackLesson: "Los nuevos locales tardan entre 3 y 6 meses en madurar. Pagar intereses bancarios altos mientras no hay clientes puede tumbar ambos negocios.",
          guardian: "toto",
          badge: "Impulsivo",
        },
        {
          id: "305_c",
          label: "Buscar un socio inversionista silencioso que aporte el capital a cambio de un porcentaje de utilidades.",
          subtext: "Compartes el riesgo sin endeudar tu flujo mensual fijo.",
          deltaCashflow: +500,
          deltaShield: 0,
          deltaCortisol: -10,
          deltaWisdom: 35,
          feedbackTitle: "Financiamiento inteligente por capital",
          feedbackLesson: "Vender una pequeña porción del nuevo proyecto te permite crecer sin poner una soga mensual al cuello de tu negocio principal.",
          guardian: "chispa",
          badge: "Creativo",
        },
      ],
    },
  ],
};

/**
 * Inicializador de una nueva sesión de simulación
 */
export function initializeSimulation(roleKey: SimulationRoleKey): SimulationState {
  const role = SIMULATION_ROLES[roleKey];
  return {
    role,
    roundIndex: 0,
    cashflow: role.initialCashflow,
    shield: role.initialShield,
    cortisol: role.initialCortisol,
    wisdom: role.initialWisdom,
    xpEarned: 0,
    isComplete: false,
    history: [],
  };
}

/**
 * Aplica la decisión tomada y calcula el nuevo estado con salvaguardas
 */
export function applyDilemmaChoice(
  state: SimulationState,
  choice: DilemmaChoice,
): SimulationState {
  const dilemmas = ROLE_DILEMMAS[state.role.id];
  const currentDilemma = dilemmas[state.roundIndex];

  // Sanitización de valores para evitar desbordes o NaN
  const nextCashflow = Math.max(0, Math.round(state.cashflow + choice.deltaCashflow));
  const nextShield = Math.max(0, Math.round(state.shield + choice.deltaShield));
  const nextCortisol = Math.min(100, Math.max(0, Math.round(state.cortisol + choice.deltaCortisol)));
  const nextWisdom = Math.max(0, Math.round(state.wisdom + choice.deltaWisdom));

  // Cálculo de XP por ronda (mínimo 15 XP + bonificación por sabiduría)
  const roundXp = Math.max(15, choice.deltaWisdom + 10);
  const nextXp = state.xpEarned + roundXp;

  const nextHistory = [
    ...state.history,
    {
      dilemma: currentDilemma,
      choice,
    },
  ];

  const nextRoundIndex = state.roundIndex + 1;
  const isComplete = nextRoundIndex >= dilemmas.length;

  return {
    ...state,
    roundIndex: nextRoundIndex,
    cashflow: nextCashflow,
    shield: nextShield,
    cortisol: nextCortisol,
    wisdom: nextWisdom,
    xpEarned: nextXp,
    isComplete,
    history: nextHistory,
  };
}

/**
 * Diagnóstico final de bienestar para Eduardo al terminar la simulación
 */
export function evaluateSimulationOutcome(state: SimulationState): {
  archetype: string;
  summary: string;
  mentalHealthStatus: "Calma Total" | "Equilibrio Saludable" | "Alerta de Estrés";
  statusColor: string;
  recommendation: string;
} {
  const { cortisol, shield, cashflow } = state;

  if (cortisol <= 35 && shield >= 800) {
    return {
      archetype: "Arquitecto de Resiliencia",
      summary: "Mantuviste tu sistema nervioso en calma total protegiendo tu Escudo Nido y priorizando la tranquilidad sobre impulsos efímeros.",
      mentalHealthStatus: "Calma Total",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      recommendation: "Lleva esta misma disciplina a tu presupuesto real en UALÍ asignando cada quincena el protocolo 'Págate Primero'.",
    };
  }

  if (cortisol <= 65) {
    return {
      archetype: "Estratega Pragmático",
      summary: "Negociaste con audacia y mantuviste tu flujo de caja a flote sin dejar que los imprevistos quebraran tu estabilidad.",
      mentalHealthStatus: "Equilibrio Saludable",
      statusColor: "text-teal-300 bg-teal-500/10 border-teal-500/30",
      recommendation: "Refuerza tu fondo de emergencia para que ante el próximo imprevisto tu cortisol no supere el 40%.",
    };
  }

  return {
    archetype: "Explorador en Aprendizaje",
    summary: "Experimentaste la tensión del crédito y los costos ocultos. En este simulador aprendiste sin perder un solo centavo de dinero real.",
    mentalHealthStatus: "Alerta de Estrés",
    statusColor: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    recommendation: "Repite la simulación aplicando el Escudo Nido ante las primeras 2 contingencias para comprobar cómo se amortigua la ansiedad.",
  };
}
