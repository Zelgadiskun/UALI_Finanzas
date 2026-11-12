import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  ChevronRight,
  Compass,
  Eye,
  EyeOff,
  Flame,
  Plus,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CanastaGastosAccordion } from "@/components/ffos/CanastaGastosAccordion";
import { ProgressSheet } from "@/components/ffos/ProgressSheet";
import { DailyStreakBadge } from "@/components/ffos/DailyStreakBadge";
import { LessonSheet } from "@/components/ffos/LessonSheet";
import { TutorialModal, isTutorialCompleted } from "@/components/ffos/TutorialModal";
import { DashboardSkeleton } from "@/components/ffos/Skeletons";
import { EmptyState } from "@/components/ffos/EmptyState";
import { useTxActions } from "@/components/ffos/useTxActions";
import { TransactionSheet } from "@/components/ffos/TransactionSheet";
import { ProfileSheet } from "@/components/ffos/ProfileSheet";
import { FamilySheet } from "@/components/ffos/FamilySheet";
import { UserAvatarDisplay } from "@/components/ffos/UserAvatarDisplay";
import { LocationAlertBanner } from "@/components/ffos/LocationAlertBanner";
import { PWAInstallButton } from "@/components/ffos/PWAInstallButton";
import { NotificationCenterModal } from "@/components/ffos/NotificationCenterModal";
import { BabiloniaFlashcardDialogue } from "@/components/ffos/BabiloniaFlashcardDialogue";
import {
  NidoCharacter,
  ChispaCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { UaliLogo } from "@/components/ffos/UaliLogo";
import { useNotificationCenter } from "@/lib/ffos/notificationsStore";
import {
  currentMonthName,
  inMonthOffset,
  isBeforeCurrentMonth,
  money,
  percentChange,
  previousMonthName,
  sameMonth,
} from "@/lib/ffos/format";
import { levelInfo } from "@/lib/ffos/gamification";
import { getActiveLesson } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { useMarkNotificationReadMutation } from "@/lib/supabase/mutations";
import { useSound } from "@/hooks/useSound";
import {
  computeVirtualTelemetry,
  calculateLevelProgress,
  GUARDIAN_IDENTITIES,
} from "@/lib/ffos/behavioralEngine";
import {
  useBudgetsQuery,
  useCurrentUserId,
  useDebtsQuery,
  useFamilyMembersQuery,
  useFamilyQuery,
  useLessonsQuery,
  useMemberDisplayNameMap,
  useNotificationsQuery,
  useProfileQuery,
  useProgressQuery,
  useTransactionsQuery,
  type LessonRow,
} from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import { useUserPoints } from "@/lib/ffos/points";

const title = "Ualí Finanzas — Panel Principal";
const description =
  "Panel financiero gamificado con conservación de flujo de caja, comparativa mensual, metas de ahorro con Nido y misiones de aprendizaje.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Inicio,
});

export function Inicio() {
  const txQuery = useTransactionsQuery();
  const profile = useProfileQuery();
  const progressQuery = useProgressQuery();
  const budgetsQuery = useBudgetsQuery();
  const debtsQuery = useDebtsQuery();
  const notificationsQuery = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const lessonsQuery = useLessonsQuery();
  const currentUserId = useCurrentUserId();
  const memberNames = useMemberDisplayNameMap();
  const { ffosTokens } = useUserPoints();

  const familyQuery = useFamilyQuery();
  const membersQuery = useFamilyMembersQuery();
  const inFamily = !!profile.data?.family_id;
  const [viewScope, setViewScope] = useState<"all" | "personal" | "shared">("all");
  const [familySheetOpen, setFamilySheetOpen] = useState(false);

  const [hideBalance, setHideBalance] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDefaultValues, setSheetDefaultValues] = useState<{
    type?: "gasto" | "ingreso" | "ahorro" | "pago_deuda";
    category?: string;
    note?: string;
  } | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [flowViewMode, setFlowViewMode] = useState<"bridge" | "compare">("bridge");
  const [openLesson, setOpenLesson] = useState<{ lesson: LessonRow; done: boolean } | null>(null);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [babiloniaModalOpen, setBabiloniaModalOpen] = useState(false);

  // Estados de contención visual y progressive disclosure (Ocultamiento Progresivo anti-ansiedad)
  const [guardianTab, setGuardianTab] = useState<"nido" | "chispa" | "toto">("nido");
  const [showFlowAnalysis, setShowFlowAnalysis] = useState(false);
  const [showTxHistory, setShowTxHistory] = useState(false);
  const [showGuardiansHub, setShowGuardiansHub] = useState(false);
  const [pigShieldPulse, setPigShieldPulse] = useState(false);

  const { playDepositChime, playShieldRecharge } = useSound();

  const handleAportarNido = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playDepositChime();
    playShieldRecharge();
    setPigShieldPulse(true);
    setTimeout(() => setPigShieldPulse(false), 1200);
    setSheetDefaultValues({
      type: "ahorro",
      category: "Fondo de emergencia",
      note: "Aporte blindado a Nido (Titanio)",
    });
    setSheetOpen(true);
  };

  const actions = useTxActions();

  const {
    detectedPlace,
    dismissDetectedPlace,
    unreadCount: smartUnreadCount,
    triggerLocationScan,
    settings: notifSettings,
  } = useNotificationCenter();

  function handleQuickRegisterFromLocation(cat: string, noteText: string) {
    setSheetDefaultValues({
      type: "gasto",
      category: cat,
      note: noteText,
    });
    setSheetOpen(true);
    dismissDetectedPlace();
  }

  useEffect(() => {
    if (notifSettings.masterEnabled && notifSettings.locationRadarEnabled) {
      const timer = setTimeout(() => {
        void triggerLocationScan();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notifSettings.masterEnabled, notifSettings.locationRadarEnabled, triggerLocationScan]);

  useEffect(() => {
    if (!isTutorialCompleted()) {
      const timer = setTimeout(() => setTutorialOpen(true), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const rawTransactions = useMemo(() => txQuery.data ?? [], [txQuery.data]);

  // Si no hay transacciones en BD, inyectamos historial continuo para que el usuario nuevo experimente la conservación de fondos
  const transactions = useMemo(() => {
    if (rawTransactions.length > 0) return rawTransactions;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 15);
    const prevY = prevDate.getFullYear();
    const prevM = String(prevDate.getMonth() + 1).padStart(2, "0");

    return [
      // Mes anterior (Septiembre)
      {
        id: "demo-prev-ingreso",
        userId: currentUserId ?? "u1",
        type: "ingreso" as const,
        category: "Sueldo",
        amount: 1850,
        date: `${prevY}-${prevM}-05`,
        note: "Ingreso mensual anterior",
        shared: true,
      },
      {
        id: "demo-prev-gasto-1",
        userId: currentUserId ?? "u1",
        type: "gasto" as const,
        category: "Comida",
        amount: 520,
        date: `${prevY}-${prevM}-12`,
        note: "Compras y despensa",
        shared: true,
      },
      {
        id: "demo-prev-gasto-2",
        userId: currentUserId ?? "u1",
        type: "gasto" as const,
        category: "Transporte",
        amount: 190,
        date: `${prevY}-${prevM}-18`,
        note: "Combustible y traslados",
        shared: true,
      },
      {
        id: "demo-prev-gasto-3",
        userId: currentUserId ?? "u1",
        type: "gasto" as const,
        category: "Servicios",
        amount: 210,
        date: `${prevY}-${prevM}-25`,
        note: "Luz e internet",
        shared: false,
      },
      {
        id: "demo-prev-ahorro",
        userId: currentUserId ?? "u1",
        type: "ahorro" as const,
        category: "Fondo de emergencia",
        amount: 250,
        date: `${prevY}-${prevM}-28`,
        note: "Ahorro protegido Nido",
        shared: false,
      },
      // Mes actual (Octubre)
      {
        id: "demo-curr-gasto-1",
        userId: currentUserId ?? "u1",
        type: "gasto" as const,
        category: "Comida",
        amount: 65,
        date: `${y}-${m}-01`,
        note: "Almuerzo de inicio de mes",
        shared: true,
      },
      {
        id: "demo-curr-gasto-2",
        userId: currentUserId ?? "u1",
        type: "gasto" as const,
        category: "Transporte",
        amount: 25,
        date: `${y}-${m}-02`,
        note: "Recarga de tarjeta de transporte",
        shared: true,
      },
    ];
  }, [rawTransactions, currentUserId]);

  const { getSubProgress } = useEducationProgress(currentUserId);

  const nextLesson = useMemo(() => {
    const lessons = lessonsQuery.data ?? [];
    const done = progressQuery.data?.lessonsDone ?? [];
    return getActiveLesson(lessons, done);
  }, [lessonsQuery.data, progressQuery.data]);

  const nextLessonSubProg = useMemo(() => {
    if (!nextLesson) return null;
    return getSubProgress(nextLesson);
  }, [nextLesson, getSubProgress]);

  // Filtrado reactivo según ámbito de finanzas (Todos, Personal o En Pareja / Grupo)
  const scopedTransactions = useMemo(() => {
    if (viewScope === "personal") {
      return transactions.filter((t) => !t.shared || t.userId === currentUserId);
    }
    if (viewScope === "shared") {
      return transactions.filter((t) => t.shared);
    }
    return transactions;
  }, [transactions, viewScope, currentUserId]);

  // CÁLCULOS ROBUSTOS DE FINANZAS EN PAREJA / EQUIPO
  const sharedBreakdown = useMemo(() => {
    const currentShared = transactions.filter(
      (t) => t.shared && sameMonth(t.date) && t.type === "gasto",
    );
    const total = currentShared.reduce((sum, t) => sum + t.amount, 0);
    const mine = currentShared
      .filter((t) => t.userId === currentUserId)
      .reduce((sum, t) => sum + t.amount, 0);
    const partner = Math.max(0, total - mine);
    const myPct = total > 0 ? Math.round((mine / total) * 100) : 50;
    const partnerPct = 100 - myPct;
    return {
      total,
      mine,
      partner,
      myPct,
      partnerPct,
      count: currentShared.length,
    };
  }, [transactions, currentUserId]);

  // CÁLCULOS ROBUSTOS DE FLUJO DE CAJA CONTINUO & COMPARATIVA MENSUAL
  const stats = useMemo(() => {
    const currentMonthTxs = scopedTransactions.filter((t) => sameMonth(t.date));
    const prevMonthTxs = scopedTransactions.filter((t) => inMonthOffset(t.date, -1));
    const priorToCurrentTxs = scopedTransactions.filter((t) => isBeforeCurrentMonth(t.date));

    const sumBy = (list: typeof scopedTransactions, type: string) =>
      list.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0);

    // Mes actual
    const currentIncome = sumBy(currentMonthTxs, "ingreso");
    const currentExpense = sumBy(currentMonthTxs, "gasto");
    const currentDebtPaid = sumBy(currentMonthTxs, "pago_deuda");
    const currentSaved = sumBy(currentMonthTxs, "ahorro");
    // El flujo neto del mes descuenta gastos, pago de deudas y transferencias a ahorro (Nido)
    const currentMonthNet = currentIncome - currentExpense - currentDebtPaid - currentSaved;

    // Mes anterior
    const prevIncome = sumBy(prevMonthTxs, "ingreso");
    const prevExpense = sumBy(prevMonthTxs, "gasto");
    const prevDebtPaid = sumBy(prevMonthTxs, "pago_deuda");
    const prevSaved = sumBy(prevMonthTxs, "ahorro");
    const prevMonthNet = prevIncome - prevExpense - prevDebtPaid - prevSaved;

    // Remanente acumulado de meses anteriores (fondos operativos en mano al iniciar el mes actual)
    const priorIncome = sumBy(priorToCurrentTxs, "ingreso");
    const priorExpense = sumBy(priorToCurrentTxs, "gasto");
    const priorDebtPaid = sumBy(priorToCurrentTxs, "pago_deuda");
    const priorSaved = sumBy(priorToCurrentTxs, "ahorro");
    const carryoverBalance = priorIncome - priorExpense - priorDebtPaid - priorSaved;

    // Balance total consolidado (FLUJO REAL EN CAJA DISPONIBLE):
    // Suma histórica de ingresos menos gastos, deudas pagadas y transferencias guardadas en Nido
    const allIncome = sumBy(scopedTransactions, "ingreso");
    const allExpense = sumBy(scopedTransactions, "gasto");
    const allDebtPaid = sumBy(scopedTransactions, "pago_deuda");
    const allSaved = sumBy(scopedTransactions, "ahorro");
    const totalAccumulatedBalance = allIncome - allExpense - allDebtPaid - allSaved;

    // Total ahorrado en Nido
    const totalSavedOverall = allSaved;

    // Margen presupuestario
    const plannedTotal = (budgetsQuery.data ?? []).reduce((a, b) => a + b.planned, 0);
    const freeLiquidity = Math.max(0, totalAccumulatedBalance);

    // Variaciones porcentuales MoM
    const incomeDelta = percentChange(currentIncome, prevIncome);
    const expenseDelta = percentChange(currentExpense, prevExpense);
    const savedDelta = percentChange(currentSaved, prevSaved);

    return {
      totalBalance: totalAccumulatedBalance,
      carryoverBalance,
      currentMonthNet,
      freeLiquidity,
      savedTotal: totalSavedOverall > 0 ? totalSavedOverall : currentSaved,
      plannedTotal,
      // Mes actual
      currentIncome,
      currentExpense,
      currentDebtPaid,
      currentSaved,
      // Mes anterior
      prevIncome,
      prevExpense,
      prevDebtPaid,
      prevSaved,
      prevMonthNet,
      // Deltas
      incomeDelta,
      expenseDelta,
      savedDelta,
    };
  }, [scopedTransactions, budgetsQuery.data]);

  const alerts = useMemo(() => {
    const list: { tone: "warning" | "danger" | "info"; text: string; notificationId?: string }[] =
      [];

    for (const n of notificationsQuery.data ?? []) {
      if (n.type !== "budget_alert") continue;
      const memberName = memberNames[n.payload.memberId] ?? "Alguien";
      const text =
        n.payload.level === "over"
          ? `${memberName} superó su reparto de ${n.payload.budgetName}`
          : `${memberName} está por agotar su reparto de ${n.payload.budgetName}`;
      list.push({
        tone: n.payload.level === "over" ? "danger" : "warning",
        text,
        notificationId: n.id,
      });
    }

    return list;
  }, [notificationsQuery.data, memberNames]);

  const latest = useMemo(
    () => [...scopedTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [scopedTransactions],
  );

  // Desglose de gastos por categoría para la Canasta de Consumo Consciente
  const categoryExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of scopedTransactions) {
      if (t.type === "gasto" && sameMonth(t.date)) {
        map[t.category] = (map[t.category] || 0) + t.amount;
      }
    }
    return Object.entries(map).map(([concepto, monto]) => ({ concepto, monto }));
  }, [scopedTransactions]);

  if (txQuery.isPending || progressQuery.isPending || !progressQuery.data) {
    return <DashboardSkeleton />;
  }

  const progress = progressQuery.data;
  const levelProgress = calculateLevelProgress(progress.xp);
  const levelData = levelInfo(progress.xp);
  const level = levelProgress.level;
  const xpCurrent = progress.xp;
  const xpLevelCap = levelProgress.xpCap;
  const xpInLevel = levelProgress.xpIntoLevel;
  const nivelPorcentaje = levelProgress.pct;
  const renderNivelPorcentaje = Number.isNaN(nivelPorcentaje) ? 0 : nivelPorcentaje;
  const xpProgressPct = renderNivelPorcentaje;

  // Calculo de ahorro meta con Zero-Bug Fallback
  const savingsGoal = 600;
  const savingsCurrent = stats.savedTotal > 0 ? stats.savedTotal : 150;
  const porcentaje = savingsGoal > 0 ? (savingsCurrent / savingsGoal) * 100 : 0;
  const renderPorcentaje = Number.isNaN(porcentaje) ? 0 : porcentaje;
  const savingsPct = Math.min(100, Math.max(0, Math.round(renderPorcentaje)));

  // Telemetría de Mapeo Real a Virtual:
  const virtualTelemetry = computeVirtualTelemetry({
    savingsThisMonth: stats.currentSaved,
    totalSpentThisMonth: stats.currentExpense,
    totalPlannedThisMonth: stats.plannedTotal,
    sharedExpensesCount: scopedTransactions.filter((t) => t.shared).length,
    sharedExpensesTotal: sharedBreakdown.total,
    overdrawnCategoriesCount:
      stats.plannedTotal > 0 && stats.currentExpense > stats.plannedTotal ? 1 : 0,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 sm:px-6 md:px-8 pt-4 pb-32 md:pb-16 max-w-md md:max-w-2xl lg:max-w-3xl mx-auto w-full space-y-6 antialiased selection:bg-teal-500/30 selection:text-teal-200">
      {/* 1. Header Clínico de Identidad y Bienestar (Espaciado amplio y sin sobrecarga) */}
      <header className="flex items-center justify-between gap-3 pt-1">
        {/* Avatar y Bienvenida Amigable para Eduardo */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-1">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="relative shrink-0 group outline-hidden min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Ajustes de perfil y salud financiera"
          >
            <div className="grid size-11 place-items-center rounded-full overflow-hidden border-2 border-amber-400 bg-slate-900 ring-2 ring-amber-400/20 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
              <UserAvatarDisplay displayName={profile.data?.display_name} />
            </div>
            <span className="absolute bottom-0.5 right-0.5 size-3 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5 truncate leading-tight">
              <span className="truncate">¡Hola, {profile.data?.display_name || "Eduardo"}!</span>
              <span className="inline-block text-amber-400 shrink-0 text-sm">✨</span>
            </h1>
            <p className="text-xs font-medium text-slate-400 truncate mt-0.5">
              {levelData.name} • Bienestar Activo
            </p>
          </div>
        </div>

        {/* Notificaciones y Racha Unificada */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setNotifModalOpen(true)}
            className="relative flex items-center justify-center size-9 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-sm"
            title="Centro de notificaciones y recordatorios"
          >
            <Bell className="size-4" />
            {smartUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-teal-500 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                {smartUnreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setProgressOpen(true)}
            className="flex items-center h-9 px-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-amber-300 font-bold text-xs shadow-sm transition active:scale-95 divide-x divide-slate-800 shrink-0"
            title="Racha y Puntos de Bienestar FFOS"
          >
            <div className="flex items-center gap-1 pr-2">
              <Flame className="size-3.5 fill-amber-400 text-amber-400" />
              <span>{progress.streakDays || 1}d</span>
            </div>
            <div className="flex items-center gap-1 pl-2">
              <span className="size-3.5 rounded-full bg-amber-400 flex items-center justify-center text-[9px] text-slate-950 font-black">
                F
              </span>
              <span>{ffosTokens}</span>
            </div>
          </button>
        </div>
      </header>

      {/* Ámbito Financiero Discreto (Selector limpio con baja carga cognitiva) */}
      <section aria-label="Ámbito de finanzas">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/50 rounded-2xl border border-slate-800/60">
          <button
            type="button"
            onClick={() => setViewScope("all")}
            className={cn(
              "py-1.5 px-3 rounded-xl text-xs font-semibold transition-all text-center min-h-[36px]",
              viewScope === "all"
                ? "bg-slate-800 text-slate-100 font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setViewScope("personal")}
            className={cn(
              "py-1.5 px-3 rounded-xl text-xs font-semibold transition-all text-center min-h-[36px]",
              viewScope === "personal"
                ? "bg-slate-800 text-slate-100 font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => setViewScope("shared")}
            className={cn(
              "py-1.5 px-3 rounded-xl text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5 min-h-[36px]",
              viewScope === "shared"
                ? "bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            <Users className="size-3.5" />
            <span>En Compañía</span>
          </button>
        </div>
      </section>

      {/* Alerta de Comercio Detectado (Discreta, no invasiva) */}
      {detectedPlace && (
        <LocationAlertBanner
          place={detectedPlace}
          onDismiss={dismissDetectedPlace}
          onQuickRegister={handleQuickRegisterFromLocation}
        />
      )}

      {/* Alertas Críticas (Formato suave, sin tonos punitivos agresivos) */}
      {alerts.length > 0 && (
        <section aria-label="Avisos" className="space-y-2">
          {alerts.slice(0, 1).map((a) => (
            <div
              key={a.notificationId ?? a.text}
              className="flex items-center justify-between gap-2.5 rounded-2xl px-4 py-3 text-xs bg-slate-900/80 border border-amber-500/30 text-amber-200 shadow-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="size-4 shrink-0 text-amber-400" />
                <span className="truncate">{a.text}</span>
              </div>
              {a.notificationId && (
                <button
                  type="button"
                  aria-label="Descartar aviso"
                  onClick={() => markReadMutation.mutate(a.notificationId!)}
                  className="shrink-0 text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 2. VIEWPORT HERO: REGLA ESTRICTA DE LOS TRES ELEMENTOS MACRO */}
      {/* En el viewport inicial solo se permiten 3 datos macro:
          1. Balance General Sanitizado
          2. Salud de Nido en porcentaje
          3. Barra del Nivel Actual
      */}
      <section
        aria-label="Resumen Esencial de Bienestar"
        className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/80 border border-teal-500/20 p-6 sm:p-7 shadow-2xl backdrop-blur-md flex flex-col gap-6 overflow-hidden"
      >
        {/* Luces sutiles de bienestar UALÍ (Teal Ishtar + Oro Solar) */}
        <div className="absolute top-0 right-1/4 -mt-14 w-64 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/4 -mt-14 w-64 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ELEMENTO 1: BALANCE GENERAL SANITIZADO (Cero-Bug Fallback, no punitivo, sin rojos estresantes) */}
        <div className="relative flex flex-col items-center text-center space-y-1.5">
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              {viewScope === "shared"
                ? "Disponibilidad en Compañía"
                : viewScope === "personal"
                  ? "Disponibilidad Personal"
                  : "Balance General Disponible"}
            </span>
            <button
              type="button"
              onClick={() => setHideBalance((v) => !v)}
              aria-label={hideBalance ? "Mostrar balance" : "Ocultar balance"}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition active:scale-95 cursor-pointer"
            >
              {hideBalance ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <div className="py-2">
            <div className="inline-flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-100 font-sans">
                {hideBalance ? "••••••••" : money(stats.totalBalance)}
              </span>
              <span className="text-xs font-bold text-slate-400">USD</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {hideBalance
                ? "Modo seguro de privacidad activo"
                : "Calculado en calma • Fondos en conservación"}
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* REGLA DE LOS TRES ELEMENTOS PARA EL VIEWPORT MÓVIL INICIAL     */}
        {/* ============================================================== */}

        {/* ELEMENTO 1: BARRA DE NIVEL REALTIME (Progresión gamificada fluida y armónica) */}
        <div className="space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="size-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-slate-200 truncate">
                {levelData.name} • Nivel {levelData.level}
              </span>
            </div>
            <span className="text-xs font-semibold text-amber-400 font-mono shrink-0">
              {xpProgressPct}% ({xpCurrent} XP)
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <motion.div
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-teal-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgressPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* ELEMENTO 2: ESCUDO DE AHORRO (Salud de Nido en porcentaje sanitizado y recarga) */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 text-lg shrink-0 shadow-inner">
              🛡️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 truncate">Escudo de Ahorro</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 shrink-0">
                  Salud Nido
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {hideBalance
                  ? "••••"
                  : `${money(savingsCurrent)} de ${money(savingsGoal)} protegidos`}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-base font-black text-teal-300 font-mono">{savingsPct}%</span>
              <span className="text-[10px] text-slate-400">Blindaje</span>
            </div>
            <button
              type="button"
              onClick={handleAportarNido}
              className={cn(
                "p-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition active:scale-95 shadow-sm cursor-pointer",
                pigShieldPulse && "ring-2 ring-teal-300 animate-pulse",
              )}
              title="Aportar y recargar salud de Nido"
            >
              <Plus className="size-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* ELEMENTO 3: ACCESO AL MAPA SINUSOIDAL (Árbol de Resiliencia Gamificado) */}
        <Link
          to="/aprender"
          className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/40 transition-all flex items-center justify-between gap-3 group shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 text-lg shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              〰️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors truncate">
                  Mapa Sinusoidal de Habilidades
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
                  Ruta Activa
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Árbol de resiliencia con Chispa, Nido y Toto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
            <span className="text-xs font-bold hidden sm:inline">Explorar</span>
            <ChevronRight className="size-4" />
          </div>
        </Link>
      </section>

      {/* 3. PROGRESSIVE DISCLOSURE: OCULTAMIENTO PROGRESIVO CON FRAMER-MOTION */}
      {/* Encapsulamiento de desgloses analíticos y tablas de transacciones para evitar saturación y data dumping */}
      <section aria-label="Desgloses Analíticos Progresivos" className="space-y-4">
        {/* TARJETA 1: CANASTA DE GASTOS Y PRESUPUESTO CONSCIENTE */}
        <CanastaGastosAccordion
          titulo="Canasta de Consumo & Presupuesto"
          montoUtilizado={stats.currentExpense}
          montoMaximo={stats.plannedTotal > 0 ? stats.plannedTotal : 1200}
          items={categoryExpenses}
        />

        {/* TARJETA 2: ANÁLISIS DE FLUJO DE CAJA & PUENTE MENSUAL */}
        <div className="w-full max-w-md mx-auto bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm transition-colors">
          <button
            type="button"
            onClick={() => setShowFlowAnalysis((v) => !v)}
            className="w-full flex items-center justify-between p-4 focus:outline-none transition-colors hover:bg-slate-800/30 cursor-pointer text-left"
            aria-expanded={showFlowAnalysis}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="size-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                <TrendingUp className="size-4" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-sm font-semibold text-slate-200 truncate">
                  Flujo de Caja & Comparativa
                </span>
                <span className="text-xs text-slate-400 mt-0.5 truncate">
                  {currentMonthName()} • Remanente (+{money(stats.carryoverBalance)})
                </span>
              </div>
            </div>

            <motion.span
              animate={{ rotate: showFlowAnalysis ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-slate-400 text-xs inline-block shrink-0"
              aria-hidden="true"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {showFlowAnalysis && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              >
                <div className="p-4 pt-1 border-t border-slate-800/60 bg-slate-950/40 space-y-3">
                  {/* Selector Puente vs Comparativa */}
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-900 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFlowViewMode("bridge")}
                      className={cn(
                        "py-1 px-2.5 rounded-lg text-xs font-semibold transition-all",
                        flowViewMode === "bridge"
                          ? "bg-teal-500 text-slate-950 font-bold shadow-xs"
                          : "text-slate-400 hover:text-slate-200",
                      )}
                    >
                      Puente de Caja
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowViewMode("compare")}
                      className={cn(
                        "py-1 px-2.5 rounded-lg text-xs font-semibold transition-all",
                        flowViewMode === "compare"
                          ? "bg-teal-500 text-slate-950 font-bold shadow-xs"
                          : "text-slate-400 hover:text-slate-200",
                      )}
                    >
                      Mes a Mes
                    </button>
                  </div>

                  {flowViewMode === "bridge" ? (
                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Remanente
                        </span>
                        <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                          +{money(stats.carryoverBalance)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Ingresos
                        </span>
                        <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                          +{money(stats.currentIncome)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Gastos</span>
                        <span className="text-xs font-bold text-slate-300 mt-0.5 block">
                          -{money(stats.currentExpense + stats.currentDebtPaid)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-teal-500/30">
                        <span className="text-[10px] text-teal-400 block font-medium">
                          Saldo en Caja
                        </span>
                        <span className="text-xs font-bold text-teal-300 mt-0.5 block">
                          ={money(stats.totalBalance)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Ingresos</span>
                          <span className="text-xs font-bold text-slate-200 block mt-0.5">
                            {money(stats.currentIncome)}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Gastos</span>
                          <span className="text-xs font-bold text-slate-300 block mt-0.5">
                            {money(stats.currentExpense)}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Ahorro</span>
                          <span className="text-xs font-bold text-teal-400 block mt-0.5">
                            {money(stats.currentSaved)}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Margen neto:</span>
                        <span className="font-bold text-slate-200 font-mono">
                          {money(stats.currentMonthNet)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TARJETA 3: HISTORIAL DE TRANSACCIONES RECIENTES (Sin tablas infinitas mezcladas) */}
        <div className="w-full max-w-md mx-auto bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm transition-colors">
          <button
            type="button"
            onClick={() => setShowTxHistory((v) => !v)}
            className="w-full flex items-center justify-between p-4 focus:outline-none transition-colors hover:bg-slate-800/30 cursor-pointer text-left"
            aria-expanded={showTxHistory}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="size-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                <Wallet className="size-4" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-sm font-semibold text-slate-200 truncate">
                  Historial de Movimientos
                </span>
                <span className="text-xs text-slate-400 mt-0.5 truncate">
                  {scopedTransactions.length === 0
                    ? "Sin registros en este ciclo"
                    : `${scopedTransactions.length} registros • Toca para desplegar`}
                </span>
              </div>
            </div>

            <motion.span
              animate={{ rotate: showTxHistory ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-slate-400 text-xs inline-block shrink-0"
              aria-hidden="true"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {showTxHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              >
                <div className="p-4 pt-1 border-t border-slate-800/60 bg-slate-950/40 space-y-2">
                  {latest.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2 text-center">
                      No hay transacciones registradas.
                    </p>
                  ) : (
                    latest.map((t) => {
                      const isIncome = t.type === "ingreso";
                      const isSavings = t.type === "ahorro";
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span
                              className={cn(
                                "size-2 rounded-full shrink-0",
                                isIncome
                                  ? "bg-emerald-400"
                                  : isSavings
                                    ? "bg-teal-400"
                                    : "bg-slate-400",
                              )}
                            />
                            <div className="min-w-0">
                              <span className="text-slate-200 font-semibold block truncate">
                                {t.category}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {t.note || t.date}
                              </span>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "font-mono font-bold shrink-0",
                              isIncome ? "text-emerald-400" : "text-slate-300",
                            )}
                          >
                            {isIncome ? "+" : "-"}
                            {money(t.amount)}
                          </span>
                        </div>
                      );
                    })
                  )}

                  <div className="pt-2 flex justify-end">
                    <Link
                      to="/movimientos"
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                    >
                      <span>Ver historial completo</span>
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TARJETA 4: GUARDIANES & RETO DE COMPAÑÍA (Ocultamiento Progresivo) */}
        <div className="w-full max-w-md mx-auto bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm transition-colors">
          <button
            type="button"
            onClick={() => setShowGuardiansHub((v) => !v)}
            className="w-full flex items-center justify-between p-4 focus:outline-none transition-colors hover:bg-slate-800/30 cursor-pointer text-left"
            aria-expanded={showGuardiansHub}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="size-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-sm font-semibold text-slate-200 truncate">
                  Guardianes & Misiones
                </span>
                <span className="text-xs text-slate-400 mt-0.5 truncate">
                  Nido, Chispa y Toto • Desafíos activos
                </span>
              </div>
            </div>

            <motion.span
              animate={{ rotate: showGuardiansHub ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-slate-400 text-xs inline-block shrink-0"
              aria-hidden="true"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {showGuardiansHub && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              >
                <div className="p-4 pt-1 border-t border-slate-800/60 bg-slate-950/40 space-y-3">
                  {/* Selector de Guardianes con Avatares Reales */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setGuardianTab("nido")}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                        guardianTab === "nido"
                          ? "bg-teal-600 text-white font-bold shadow-xs"
                          : "text-slate-400 hover:text-slate-200",
                      )}
                    >
                      <span className="size-4 rounded-full bg-teal-400/20 text-[10px] flex items-center justify-center">
                        🛡️
                      </span>
                      <span className="text-xs truncate">Nido</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuardianTab("chispa")}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                        guardianTab === "chispa"
                          ? "bg-purple-600 text-white font-bold shadow-xs"
                          : "text-slate-400 hover:text-slate-200",
                      )}
                    >
                      <span className="size-4 rounded-full bg-purple-400/20 text-[10px] flex items-center justify-center">
                        ⚡
                      </span>
                      <span className="text-xs truncate">Chispa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuardianTab("toto")}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                        guardianTab === "toto"
                          ? "bg-blue-600 text-white font-bold shadow-xs"
                          : "text-slate-400 hover:text-slate-200",
                      )}
                    >
                      <span className="size-4 rounded-full bg-blue-400/20 text-[10px] flex items-center justify-center">
                        🪙
                      </span>
                      <span className="text-xs truncate">Toto</span>
                    </button>
                  </div>

                  {/* Detalle del Guardián Activo con Arte Vectorial */}
                  {guardianTab === "nido" && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-teal-500/30 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-teal-950/60 border border-teal-500/40 p-1 flex items-center justify-center shrink-0">
                          <NidoCharacter className="w-10 h-10" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-100">
                              Nido • Vasija Protectora
                            </span>
                            <span className="text-[10px] font-bold text-teal-300 font-mono">
                              {virtualTelemetry.escudoNidoHp} / {virtualTelemetry.escudoMaxHp} HP
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            Guardián del fondo de emergencia (590 a.C.)
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-teal-300 h-full rounded-full transition-all duration-500"
                          style={{ width: `${savingsPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center pt-0.5 text-xs">
                        <button
                          type="button"
                          onClick={handleAportarNido}
                          className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                        >
                          <span>+ Aportar a Nido</span>
                        </button>
                        <Link
                          to="/ahorro"
                          className="text-slate-400 hover:text-slate-200 font-semibold"
                        >
                          Ver metas protegidas ➔
                        </Link>
                      </div>
                    </div>
                  )}

                  {guardianTab === "chispa" && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-purple-950/60 border border-purple-500/40 p-1 flex items-center justify-center shrink-0">
                          <ChispaCharacter className="w-10 h-10" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-100">
                              Chispa • Dinamo de Hábitos
                            </span>
                            <span className="text-[10px] font-bold text-purple-300 font-mono">
                              {virtualTelemetry.bateriaClanVoltaje}% Voltaje
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            Transforma el día a día en serenidad sin culpas
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-300 h-full rounded-full transition-all duration-500"
                          style={{ width: `${virtualTelemetry.bateriaClanVoltaje}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center pt-0.5 text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Racha activa: {progress.streakDays || 1} días
                        </span>
                        <Link
                          to="/aprender"
                          className="text-purple-300 hover:text-purple-200 font-semibold"
                        >
                          Árbol de resiliencia ➔
                        </Link>
                      </div>
                    </div>
                  )}

                  {guardianTab === "toto" && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-blue-500/30 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-blue-950/60 border border-blue-500/40 p-1 flex items-center justify-center shrink-0">
                          <TotoCharacter className="w-10 h-10" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-100">
                              Toto • Mercader y Estratega
                            </span>
                            <span className="text-[10px] font-bold text-blue-300 font-mono">
                              Rango {virtualTelemetry.sharkLeagueTier}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            Destructor de deudas (bola de nieve) y multiplicador
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
                        Solvencia evaluada:{" "}
                        <strong className="text-blue-300">
                          {virtualTelemetry.solvenciaScore} pts
                        </strong>{" "}
                        • Cero fricción de cobro
                      </p>

                      <div className="flex justify-between items-center pt-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (nextLesson) setOpenLesson({ lesson: nextLesson, done: false });
                          }}
                          className="text-amber-400 hover:text-amber-300 font-bold"
                        >
                          {nextLesson ? "Continuar lección" : "Ver lecciones"}
                        </button>
                        <Link
                          to="/deudas"
                          className="text-blue-300 hover:text-blue-200 font-semibold"
                        >
                          Plan de amortización ➔
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* BANNER ESPECIAL: CRÓNICAS DE BABILONIA (LORE & HISTORIA INTERACTIVA) */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                        <span>📜</span>
                        <span>Crónicas de Babilonia • 590 a.C.</span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">
                        El secreto de las 5 leyes del oro para Eduardo
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBabiloniaModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 active:scale-95 transition shadow-sm cursor-pointer"
                    >
                      Aventura
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 4. CONEXIÓN DE LA TRÍADA UALÍ: INICIO • PRESUPUESTO • APRENDER (SIMULADOR) */}
      <section
        aria-label="Rutas Principales UALÍ"
        className="w-full max-w-md mx-auto grid grid-cols-2 gap-3 pt-1"
      >
        <Link
          to="/presupuesto"
          className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-2 shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="size-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 text-xs font-bold">
              📊
            </span>
            <span className="text-[10px] text-slate-400 group-hover:text-amber-300 transition-colors">
              ➔
            </span>
          </div>
          <div>
            <span className="text-xs font-black text-slate-200 block group-hover:text-amber-300 transition-colors">
              Presupuesto
            </span>
            <span className="text-[10px] text-slate-400 line-clamp-1">
              Canastas & flujo consciente
            </span>
          </div>
        </Link>

        <Link
          to="/aprender?tab=simulador"
          className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-2 shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="size-7 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-bold">
              🎮
            </span>
            <span className="text-[10px] text-slate-400 group-hover:text-purple-300 transition-colors">
              ➔
            </span>
          </div>
          <div>
            <span className="text-xs font-black text-slate-200 block group-hover:text-purple-300 transition-colors">
              Simulador de Vida
            </span>
            <span className="text-[10px] text-slate-400 line-clamp-1">
              Decisiones por roles sin riesgo
            </span>
          </div>
        </Link>
      </section>

      {/* Hojas modales */}
      <TransactionSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetDefaultValues(null);
        }}
        defaultValues={sheetDefaultValues}
      />
      <ProgressSheet
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        progress={progress}
      />
      {openLesson && (
        <LessonSheet
          lesson={openLesson.lesson}
          done={openLesson.done}
          onClose={() => setOpenLesson(null)}
        />
      )}
      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
      <FamilySheet open={familySheetOpen} onClose={() => setFamilySheetOpen(false)} />
      <ChallengeModal
        open={challengeModalOpen}
        onClose={() => setChallengeModalOpen(false)}
        onRegister={() => {
          setSheetDefaultValues({
            type: "gasto",
            category: "Comida",
            note: "Registro de consumo diario",
          });
          setSheetOpen(true);
        }}
      />
      <NotificationCenterModal
        open={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        onOpenTransactionWithCategory={handleQuickRegisterFromLocation}
      />
      {babiloniaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-amber-500/40 bg-slate-950 p-2 sm:p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setBabiloniaModalOpen(false)}
              className="absolute top-4 right-4 z-20 size-8 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
              aria-label="Cerrar crónica de Babilonia"
            >
              <X className="size-4" />
            </button>
            <BabiloniaFlashcardDialogue
              onComplete={() => {
                // Completado exitoso
              }}
            />
          </div>
        </div>
      )}
      {actions.element}
    </main>
  );
}

function ChallengeModal({
  open,
  onClose,
  onRegister,
}: {
  open: boolean;
  onClose: () => void;
  onRegister: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl border border-amber-500/40 bg-card p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">Reto Semanal de Consumo</h3>
              <span className="text-xs font-bold text-amber-300">+100 FFOS de recompensa</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-extrabold text-foreground">
            3 Días de Registro Sin Gastos Hormiga
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Registren cada consumo del día para blindar el presupuesto compartido en compañía o en
            equipo.
          </p>

          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-amber-300">2 de 3 días completados (67%)</span>
              <span className="text-slate-400">¡Falta 1 día!</span>
            </div>
            <div className="w-full bg-secondary h-3 rounded-full overflow-hidden border border-border/60">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: "67%" }}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onRegister();
            }}
            className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition shadow-xs"
          >
            Registrar consumo de hoy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
