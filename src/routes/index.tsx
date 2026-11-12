import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ChevronRight,
  Compass,
  Eye,
  EyeOff,
  Flame,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { CanastaGastosAccordion } from "@/components/ffos/CanastaGastosAccordion";
import { ProgressSheet } from "@/components/ffos/ProgressSheet";
import { LessonSheet } from "@/components/ffos/LessonSheet";
import { TutorialModal, isTutorialCompleted } from "@/components/ffos/TutorialModal";
import { DashboardSkeleton } from "@/components/ffos/Skeletons";
import { TransactionRow } from "@/components/ffos/TransactionRow";
import { useTxActions } from "@/components/ffos/useTxActions";
import { TransactionSheet } from "@/components/ffos/TransactionSheet";
import { ProfileSheet } from "@/components/ffos/ProfileSheet";
import { FamilySheet } from "@/components/ffos/FamilySheet";
import { UserAvatarDisplay } from "@/components/ffos/UserAvatarDisplay";
import { LocationAlertBanner } from "@/components/ffos/LocationAlertBanner";
import { NotificationCenterModal } from "@/components/ffos/NotificationCenterModal";
import {
  ChispaCharacter,
  NidoCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { useNotificationCenter } from "@/lib/ffos/notificationsStore";
import {
  currentMonthName,
  inMonthOffset,
  isBeforeCurrentMonth,
  money,
  percentChange,
  sameMonth,
} from "@/lib/ffos/format";
import { levelInfo } from "@/lib/ffos/gamification";
import { getActiveLesson } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { useMarkNotificationReadMutation } from "@/lib/supabase/mutations";
import { useSound } from "@/hooks/useSound";
import { calculateLevelProgress } from "@/lib/ffos/behavioralEngine";
import {
  useBudgetsQuery,
  useCurrentUserId,
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

const title = "Ualí Finanzas — Panel Principal (Regla 70·20·10)";
const description =
  "Gestión intuitiva de finanzas personales, familiares y de equipo con Nido, Chispa y el Laboratorio de Simulacros de Toto.";

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
  const notificationsQuery = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const lessonsQuery = useLessonsQuery();
  const currentUserId = useCurrentUserId();
  const memberNames = useMemberDisplayNameMap();
  const { ffosTokens } = useUserPoints();

  const familyQuery = useFamilyQuery();
  const membersQuery = useFamilyMembersQuery();
  void familyQuery;
  void membersQuery;

  const [viewScope, setViewScope] = useState<"all" | "personal" | "shared">("personal");
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
  const [openLesson, setOpenLesson] = useState<{ lesson: LessonRow; done: boolean } | null>(null);
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
      note: "Aporte protegido al Escudo de Nido",
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

  const transactions = useMemo(() => {
    if (rawTransactions.length > 0) return rawTransactions;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 15);
    const prevY = prevDate.getFullYear();
    const prevM = String(prevDate.getMonth() + 1).padStart(2, "0");

    return [
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

  void getSubProgress;
  void nextLesson;

  const scopedTransactions = useMemo(() => {
    if (viewScope === "personal") {
      return transactions.filter((t) => !t.shared || t.userId === currentUserId);
    }
    if (viewScope === "shared") {
      return transactions.filter((t) => t.shared);
    }
    return transactions;
  }, [transactions, viewScope, currentUserId]);

  const sharedBreakdown = useMemo(() => {
    const currentShared = transactions.filter(
      (t) => t.shared && sameMonth(t.date) && t.type === "gasto",
    );
    const total = currentShared.reduce((sum, t) => sum + t.amount, 0);
    const mine = currentShared
      .filter((t) => t.userId === currentUserId)
      .reduce((sum, t) => sum + t.amount, 0);
    const partner = Math.max(0, total - mine);
    const myPct = total > 0 ? Math.round((mine / total) * 100) : 60;
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

  const stats = useMemo(() => {
    const currentMonthTxs = scopedTransactions.filter((t) => sameMonth(t.date));
    const prevMonthTxs = scopedTransactions.filter((t) => inMonthOffset(t.date, -1));
    const priorToCurrentTxs = scopedTransactions.filter((t) => isBeforeCurrentMonth(t.date));

    const sumBy = (list: typeof scopedTransactions, type: string) =>
      list.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0);

    const currentIncome = sumBy(currentMonthTxs, "ingreso");
    const currentExpense = sumBy(currentMonthTxs, "gasto");
    const currentDebtPaid = sumBy(currentMonthTxs, "pago_deuda");
    const currentSaved = sumBy(currentMonthTxs, "ahorro");
    const currentMonthNet = currentIncome - currentExpense - currentDebtPaid - currentSaved;

    const prevIncome = sumBy(prevMonthTxs, "ingreso");
    const prevExpense = sumBy(prevMonthTxs, "gasto");
    const prevDebtPaid = sumBy(prevMonthTxs, "pago_deuda");
    const prevSaved = sumBy(prevMonthTxs, "ahorro");
    const prevMonthNet = prevIncome - prevExpense - prevDebtPaid - prevSaved;

    const priorIncome = sumBy(priorToCurrentTxs, "ingreso");
    const priorExpense = sumBy(priorToCurrentTxs, "gasto");
    const priorDebtPaid = sumBy(priorToCurrentTxs, "pago_deuda");
    const priorSaved = sumBy(priorToCurrentTxs, "ahorro");
    const carryoverBalance = priorIncome - priorExpense - priorDebtPaid - priorSaved;

    const allIncome = sumBy(scopedTransactions, "ingreso");
    const allExpense = sumBy(scopedTransactions, "gasto");
    const allDebtPaid = sumBy(scopedTransactions, "pago_deuda");
    const allSaved = sumBy(scopedTransactions, "ahorro");
    const totalAccumulatedBalance = allIncome - allExpense - allDebtPaid - allSaved;

    const totalSavedOverall = allSaved;
    const plannedTotal = (budgetsQuery.data ?? []).reduce((a, b) => a + b.planned, 0);
    const freeLiquidity = Math.max(0, totalAccumulatedBalance);

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
      currentIncome,
      currentExpense,
      currentDebtPaid,
      currentSaved,
      prevIncome,
      prevExpense,
      prevDebtPaid,
      prevSaved,
      prevMonthNet,
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
      const memberName = memberNames[n.payload.memberId] ?? "Integrante";
      const text =
        n.payload.level === "over"
          ? `${memberName} superó su tope acordado en ${n.payload.budgetName}`
          : `${memberName} está cerca de su tope en ${n.payload.budgetName}`;
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
  const xpCurrent = progress.xp;
  const nivelPorcentaje = levelProgress.pct;
  const xpProgressPct = Number.isNaN(nivelPorcentaje) ? 0 : nivelPorcentaje;

  const savingsGoal = 600;
  const savingsCurrent = stats.savedTotal > 0 ? stats.savedTotal : 150;
  const rawSavingsPct = savingsGoal > 0 ? (savingsCurrent / savingsGoal) * 100 : 0;
  const savingsPct = Math.min(100, Math.max(0, Math.round(Number.isNaN(rawSavingsPct) ? 0 : rawSavingsPct)));

  return (
    <main className="min-h-screen bg-background text-foreground px-4 sm:px-6 pt-4 pb-28 md:pb-14 max-w-4xl mx-auto w-full space-y-5 antialiased">
      {/* 1. CABECERA CÁLIDA Y ESCANEABLE */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="relative shrink-0 group outline-hidden min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Ajustes de perfil"
          >
            <div className="grid size-11 place-items-center rounded-full overflow-hidden border-2 border-primary bg-card shadow-xs group-hover:scale-105 transition-transform">
              <UserAvatarDisplay displayName={profile.data?.display_name} />
            </div>
            <span className="absolute bottom-0.5 right-0.5 size-3 bg-primary rounded-full ring-2 ring-background" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-base sm:text-lg font-extrabold text-foreground tracking-tight flex items-center gap-1.5 truncate leading-tight">
              <span className="truncate">¡Hola, {profile.data?.display_name || "Eduardo"}!</span>
            </h1>
            <p className="text-xs font-semibold text-muted-foreground truncate mt-0.5">
              {levelData.name} • Nivel {levelData.level} • Calma Activa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setNotifModalOpen(true)}
            className="relative flex items-center justify-center size-9 rounded-xl bg-card border border-border text-foreground hover:bg-secondary transition cursor-pointer"
            title="Centro de notificaciones"
          >
            <Bell className="size-4" />
            {smartUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-[#E06D53] text-[#F7F5F0] rounded-full text-[10px] font-black flex items-center justify-center">
                {smartUnreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setProgressOpen(true)}
            className="flex items-center h-9 px-2.5 rounded-xl bg-card border border-border hover:bg-secondary text-foreground font-extrabold text-xs transition divide-x divide-border shrink-0 cursor-pointer"
            title="Racha y Puntos de Maestría"
          >
            <div className="flex items-center gap-1 pr-2 text-[#E06D53]">
              <Flame className="size-3.5 fill-[#E06D53]" />
              <span>{progress.streakDays || 1}d</span>
            </div>
            <div className="flex items-center gap-1 pl-2 text-primary">
              <Sparkles className="size-3.5" />
              <span>{ffosTokens}</span>
            </div>
          </button>
        </div>
      </header>

      {/* 2. SELECTOR MULTI-ESPACIO: PERSONAL (NIDO) · FAMILIAR (CHISPA) · EQUIPO (CHISPA) */}
      <section aria-label="Espacio de finanzas">
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-card rounded-2xl border border-border shadow-2xs">
          <button
            type="button"
            onClick={() => setViewScope("personal")}
            className={cn(
              "py-2 px-3 rounded-xl text-xs font-extrabold transition-all text-center min-h-[38px] cursor-pointer",
              viewScope === "personal"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Personal (Nido)
          </button>
          <button
            type="button"
            onClick={() => setViewScope("all")}
            className={cn(
              "py-2 px-3 rounded-xl text-xs font-extrabold transition-all text-center min-h-[38px] cursor-pointer",
              viewScope === "all"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Consolidado
          </button>
          <button
            type="button"
            onClick={() => setViewScope("shared")}
            className={cn(
              "py-2 px-3 rounded-xl text-xs font-extrabold transition-all text-center flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer",
              viewScope === "shared"
                ? "bg-[#E06D53] text-[#F7F5F0] shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users className="size-3.5" />
            <span>Familia / Equipo</span>
          </button>
        </div>
      </section>

      {detectedPlace && (
        <LocationAlertBanner
          place={detectedPlace}
          onDismiss={dismissDetectedPlace}
          onQuickRegister={handleQuickRegisterFromLocation}
        />
      )}

      {alerts.length > 0 && (
        <section aria-label="Avisos constructivos" className="space-y-2">
          {alerts.slice(0, 1).map((a) => (
            <div
              key={a.notificationId ?? a.text}
              className="flex items-center justify-between gap-2.5 rounded-2xl px-4 py-3 text-xs bg-warning-soft border border-warning/30 text-foreground"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="size-4 shrink-0 text-[#E06D53]" />
                <span className="truncate font-semibold">{a.text}</span>
              </div>
              {a.notificationId && (
                <button
                  type="button"
                  aria-label="Descartar aviso"
                  onClick={() => markReadMutation.mutate(a.notificationId!)}
                  className="shrink-0 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 3. TARJETA PRINCIPAL DE BALANCE, FLUJO Y MENTOR DEL ESPACIO (70·20·10) */}
      <section
        aria-label="Resumen de Liquidez y Fondo de Paz"
        className="rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-xs space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Balance y mensaje contextual */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <span
                className={cn(
                  "text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full",
                  viewScope === "shared"
                    ? "bg-warning-soft text-[#E06D53]"
                    : "bg-primary-soft text-primary",
                )}
              >
                {viewScope === "shared"
                  ? "Espacio Familiar y Equipo • Con Chispa"
                  : viewScope === "personal"
                    ? "Billetera Personal • Con Nido"
                    : "Vista Consolidada • Todos los Espacios"}
              </span>
              <button
                type="button"
                onClick={() => setHideBalance((v) => !v)}
                aria-label={hideBalance ? "Mostrar balance" : "Ocultar balance"}
                className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                {hideBalance ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                <span>{hideBalance ? "Mostrar" : "Ocultar"}</span>
              </button>
            </div>

            <div className="pt-1 flex items-baseline gap-2">
              <span className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground tabular-nums">
                {hideBalance ? "••••••••" : money(stats.totalBalance)}
              </span>
              <span className="text-xs font-bold text-muted-foreground">USD disponibles</span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {viewScope === "shared"
                ? `Chispa equilibra las cuentas compartidas: este mes tu aporte representa el ${sharedBreakdown.myPct}% del gasto común.`
                : `Nido resguarda tu tranquilidad: tu flujo neto está en calma y llevas ${savingsPct}% de tu meta de reserva cubierta.`}
            </p>
          </div>

          {/* Tarjeta del Mentor Activo (Nido Cerdito o Chispa Zorrita) + Escudo de Paz */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-secondary/70 border border-border shrink-0">
            <div className="size-20 shrink-0 flex items-center justify-center">
              {viewScope === "shared" ? (
                <ChispaCharacter className="w-20 h-20" />
              ) : (
                <NidoCharacter className="w-20 h-20" />
              )}
            </div>
            <div className="space-y-1.5 pr-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-foreground">
                  {viewScope === "shared" ? "Equidad Compartida" : "Fondo de Paz (Nido)"}
                </span>
                <span className="text-xs font-extrabold text-primary tabular-nums">
                  {savingsPct}%
                </span>
              </div>
              <div className="w-36 bg-border h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${savingsPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-muted-foreground">
                <span className="tabular-nums">
                  {hideBalance ? "••••" : `${money(savingsCurrent)} / ${money(savingsGoal)}`}
                </span>
                <button
                  type="button"
                  onClick={handleAportarNido}
                  className={cn(
                    "inline-flex items-center gap-1 text-primary hover:underline font-extrabold cursor-pointer",
                    pigShieldPulse && "animate-pulse",
                  )}
                >
                  <Plus className="size-3" />
                  <span>Aportar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4 PILARES DE FLUJO DE CAJA A LA VISTA (Cero acordeones confusos) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
          <div className="p-3 rounded-2xl bg-secondary/60 border border-border/70">
            <span className="text-[11px] font-bold text-muted-foreground block">
              Remanente Anterior
            </span>
            <span className="text-sm sm:text-base font-extrabold text-foreground tabular-nums mt-0.5 block">
              {hideBalance ? "••••" : `+${money(stats.carryoverBalance)}`}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/60 border border-border/70">
            <span className="text-[11px] font-bold text-muted-foreground block">
              Ingresos ({currentMonthName()})
            </span>
            <span className="text-sm sm:text-base font-extrabold text-primary tabular-nums mt-0.5 block">
              {hideBalance ? "••••" : `+${money(stats.currentIncome)}`}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/60 border border-border/70">
            <span className="text-[11px] font-bold text-muted-foreground block">
              Gastos y Deudas
            </span>
            <span className="text-sm sm:text-base font-extrabold text-[#E06D53] tabular-nums mt-0.5 block">
              {hideBalance ? "••••" : `-${money(stats.currentExpense + stats.currentDebtPaid)}`}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/60 border border-border/70">
            <span className="text-[11px] font-bold text-muted-foreground block">
              Ahorro en Nido
            </span>
            <span className="text-sm sm:text-base font-extrabold text-primary tabular-nums mt-0.5 block">
              {hideBalance ? "••••" : money(stats.savedTotal)}
            </span>
          </div>
        </div>

        {/* Barra de Maestría y Nivel Compacta */}
        <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="size-4 text-primary shrink-0" />
            <span className="font-extrabold text-foreground">
              Progreso de Maestría: {levelData.name} • Nivel {levelData.level}
            </span>
            <span className="text-muted-foreground font-semibold tabular-nums">
              ({xpProgressPct}% • {xpCurrent} XP)
            </span>
          </div>
          <div className="w-full sm:w-48 bg-border h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${xpProgressPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* 4. CUADRÍCULA INFERIOR: PULSO DE GASTOS, MOVIMIENTOS Y PUENTE AL SIMULADOR DE TOTO */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-7 space-y-5">
          {/* Desglose de Presupuesto Consciente */}
          <CanastaGastosAccordion
            titulo="Pulso de Consumo y Presupuesto"
            montoUtilizado={stats.currentExpense}
            montoMaximo={stats.plannedTotal > 0 ? stats.plannedTotal : 1200}
            items={categoryExpenses}
          />

          {/* Últimos Movimientos */}
          <section className="rounded-3xl bg-card border border-border p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base sm:text-lg font-extrabold text-foreground">
                  Movimientos Recientes
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tus últimos registros en este espacio
                </p>
              </div>
              <Link
                to="/movimientos"
                className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1"
              >
                <span>Ver historial</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-border">
              {latest.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  ownerLabel={
                    tx.shared && tx.userId !== currentUserId
                      ? (memberNames[tx.userId] ?? "Equipo")
                      : undefined
                  }
                  onOptions={(item) => actions.openActions(item)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Columna Lateral: Laboratorio de Simulacros con Toto + Espacio en Equipo */}
        <div className="md:col-span-5 space-y-5">
          <div className="rounded-3xl bg-card border-2 border-primary/30 p-5 space-y-4 shadow-2xs">
            <div className="flex items-start gap-3.5">
              <TotoCharacter className="w-16 h-16 shrink-0" />
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-warning-soft text-[#E06D53]">
                  Laboratorio de Casos • Toto
                </span>
                <h3 className="font-display text-base font-extrabold text-foreground leading-snug">
                  Entrena decisiones sin comprometer tu dinero real
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Toto (nuestro camaleón estratega con visión 360°) te guía en simulacros prácticos de presupuesto personal, hogar y proyectos en equipo.
                </p>
              </div>
            </div>

            <Link
              to="/aprender"
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs flex items-center justify-center gap-2 btn-3d"
            >
              <Compass className="size-4" />
              <span>Abrir Simulador de Casos</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="rounded-3xl bg-card border border-border p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-[#E06D53]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                  Finanzas en Familia o Equipo
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFamilySheetOpen(true)}
                className="text-xs font-extrabold text-primary hover:underline cursor-pointer"
              >
                Configurar grupo →
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Organiza gastos compartidos con Chispa usando reparto proporcional a los ingresos o 50/50.
            </p>
            <div className="p-3 rounded-2xl bg-secondary/70 border border-border flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground">Gasto compartido del mes:</span>
              <span className="font-extrabold text-foreground tabular-nums">
                {hideBalance ? "••••" : money(sharedBreakdown.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modales y hojas auxiliares */}
      {actions.modal}
      <TransactionSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetDefaultValues(null);
        }}
        defaultValues={sheetDefaultValues}
      />
      <ProgressSheet open={progressOpen} onClose={() => setProgressOpen(false)} progress={progress} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
      <FamilySheet open={familySheetOpen} onClose={() => setFamilySheetOpen(false)} />
      <NotificationCenterModal open={notifModalOpen} onClose={() => setNotifModalOpen(false)} />
      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      {openLesson && (
        <LessonSheet
          lesson={openLesson.lesson}
          alreadyDone={openLesson.done}
          onClose={() => setOpenLesson(null)}
        />
      )}
    </main>
  );
}
