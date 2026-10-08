import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
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
import {
  ChispaCharacter,
  NidoCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { ProgressSheet } from "@/components/ffos/ProgressSheet";
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
  }, []);

  useEffect(() => {
    if (!isTutorialCompleted()) {
      const timer = setTimeout(() => setTutorialOpen(true), 600);
      return () => clearTimeout(timer);
    }
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
    () => [...scopedTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4),
    [scopedTransactions],
  );

  if (txQuery.isPending || progressQuery.isPending || !progressQuery.data) {
    return <DashboardSkeleton />;
  }

  const progress = progressQuery.data;
  const levelData = levelInfo(progress.xp);
  const xpCurrent = progress.xp;
  const xpNextThreshold = (levelData.level + 1) * 250;
  const xpInLevel = xpCurrent % 250;
  const xpProgressPct = Math.min(100, Math.round((xpInLevel / 250) * 100));

  // Calculo de ahorro meta
  const savingsGoal = 600;
  const savingsCurrent = stats.savedTotal > 0 ? stats.savedTotal : 150;
  const savingsPct = Math.min(100, Math.round((savingsCurrent / savingsGoal) * 100));

  return (
    <main className="px-4 pt-3 pb-28 max-w-md mx-auto w-full">
      {/* 1. Header Superior de Usuario y Gamificación Accesible */}
      <section className="mb-3.5">
        <div className="flex items-center justify-between gap-2">
          {/* Avatar y Nombre con espacio protegido y tipografía legible */}
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-1">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="relative shrink-0 group outline-hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Ajustes de perfil y compartir en redes"
            >
              <div className="grid size-11 place-items-center rounded-full overflow-hidden border-2 border-[#F6BE22] bg-[#141F36] ring-2 ring-[#F6BE22]/20 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                <UserAvatarDisplay displayName={profile.data?.display_name} />
              </div>
              <span className="absolute bottom-0.5 right-0.5 size-3 bg-emerald-500 rounded-full ring-2 ring-background" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-1.5 truncate leading-tight">
                <span className="truncate">
                  ¡Hola, {profile.data?.display_name || "Explorador"}!
                </span>
                <span className="inline-block text-amber-400 shrink-0 text-sm">👋</span>
              </h1>
              <p className="text-xs font-bold text-teal-400 truncate leading-tight mt-0.5">
                {levelData.title} • Nivel {levelData.level}
              </p>
            </div>
          </div>

          {/* Badges de Gamificación: Notificaciones, Tour, Racha y Puntos FFOS legibles */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bell de Notificaciones */}
            <button
              type="button"
              onClick={() => setNotifModalOpen(true)}
              className="relative flex items-center justify-center size-9 rounded-xl bg-secondary border border-teal-500/30 text-teal-400 hover:bg-secondary/80 transition active:scale-95 shadow-xs"
              title="Centro de alertas y metas"
            >
              <Bell className="size-4" />
              {smartUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 bg-danger text-danger-foreground rounded-full text-xs font-black flex items-center justify-center animate-pulse">
                  {smartUnreadCount}
                </span>
              )}
            </button>

            {/* Tour Button */}
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className="flex items-center gap-1 h-9 px-2.5 rounded-xl bg-secondary border border-teal-500/30 text-teal-400 font-bold text-xs hover:bg-secondary/80 transition active:scale-95 shadow-xs"
              title="Tour interactivo de Ualí"
            >
              <Compass className="size-3.5" />
              <span>Tour</span>
            </button>

            {/* Racha de Días */}
            <button
              type="button"
              onClick={() => setProgressOpen(true)}
              className="flex items-center gap-1 h-9 px-2.5 rounded-xl bg-card border border-amber-500/40 text-amber-300 font-black text-xs shadow-xs transition active:scale-95"
              title="Tu racha diaria de registro"
            >
              <Flame className="size-4 fill-amber-400 text-amber-400" />
              <span>{progress.streak}d</span>
            </button>

            {/* Puntos FFOS */}
            <button
              type="button"
              onClick={() => setProgressOpen(true)}
              className="flex items-center gap-1 h-9 px-2.5 rounded-xl bg-card border border-[#F6BE22]/40 text-amber-300 font-black text-xs shadow-xs transition active:scale-95"
              title="Puntos FFOS ganados"
            >
              <span className="size-4 rounded-full bg-[#F6BE22] flex items-center justify-center text-[10px] text-slate-900 font-black">
                F
              </span>
              <span>{ffosTokens}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Selector de Ámbito Fintech: Todos / Personal / En Pareja */}
      <section className="mb-3.5">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-secondary/80 rounded-2xl border border-border/70 shadow-xs">
          <button
            type="button"
            onClick={() => setViewScope("all")}
            className={cn(
              "py-2 px-3 rounded-xl text-xs font-extrabold transition-all text-center min-h-[38px]",
              viewScope === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setViewScope("personal")}
            className={cn(
              "py-2 px-3 rounded-xl text-xs font-extrabold transition-all text-center min-h-[38px]",
              viewScope === "personal"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => setViewScope("shared")}
            className={cn(
              "py-2 px-3 rounded-xl text-xs font-extrabold transition-all text-center flex items-center justify-center gap-1.5 min-h-[38px]",
              viewScope === "shared"
                ? "bg-[#2EC4B6] text-slate-950 font-black shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users className="size-3.5" />
            <span>En Compañía</span>
          </button>
        </div>
      </section>

      {/* Acceso e Instalación PWA */}
      <PWAInstallButton variant="banner" className="mb-3" />

      {/* Alerta Inteligente de Comercio Detectado por GPS & Google Maps */}
      {detectedPlace && (
        <LocationAlertBanner
          place={detectedPlace}
          onDismiss={dismissDetectedPlace}
          onQuickRegister={handleQuickRegisterFromLocation}
        />
      )}

      {/* Alertas críticas si las hay */}
      {alerts.length > 0 && (
        <section aria-label="Alertas" className="mb-3 space-y-2">
          {alerts.slice(0, 2).map((a) => (
            <div
              key={a.notificationId ?? a.text}
              className={cn(
                "flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-bold",
                a.tone === "danger" && "bg-danger-soft text-danger border border-danger/30",
                a.tone === "warning" && "bg-warning-soft text-foreground border border-warning/30",
                a.tone === "info" && "bg-info-soft text-info border border-info/30",
              )}
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 flex-1 leading-snug">{a.text}</span>
              {a.notificationId && (
                <button
                  type="button"
                  aria-label="Descartar aviso"
                  onClick={() => markReadMutation.mutate(a.notificationId!)}
                  className="shrink-0 opacity-70 hover:opacity-100 p-0.5"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 3. Tarjeta de Balance Consolidado (Flujo de Caja Real Conservado) */}
      <section className="mb-3.5">
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border/80 p-4.5 shadow-card">
          <div className="absolute -right-8 -bottom-8 size-28 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 size-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-2.5">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                    {viewScope === "shared"
                      ? "BALANCE EN COMPAÑÍA / EQUIPO"
                      : viewScope === "personal"
                        ? "BALANCE PERSONAL"
                        : "BALANCE TOTAL DISPONIBLE"}
                  </p>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-extrabold flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-teal-400 animate-pulse" />
                    Flujo Continuo
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight font-sans text-foreground">
                    {hideBalance ? "••••••••" : money(stats.totalBalance)}
                  </span>
                  <span className="text-sm font-bold text-slate-400">USD</span>
                </div>

                {/* Sub-indicador de conservación de flujo del mes anterior */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-slate-400 font-semibold">
                  <span className="text-teal-400 font-bold flex items-center gap-1">
                    <span>↳ Remanente {previousMonthName()}:</span>
                    <strong className="text-foreground">
                      {hideBalance ? "••••••" : `+${money(stats.carryoverBalance)}`}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Neto {currentMonthName()}:{" "}
                    <strong
                      className={
                        hideBalance
                          ? "text-foreground"
                          : stats.currentMonthNet >= 0
                            ? "text-emerald-400"
                            : "text-amber-400"
                      }
                    >
                      {hideBalance ? "••••••" : money(stats.currentMonthNet)}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHideBalance((v) => !v)}
                aria-label={hideBalance ? "Mostrar balance" : "Ocultar balance"}
                className="grid size-10 place-items-center rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:text-foreground transition active:scale-95"
              >
                {hideBalance ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60 mt-1">
              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-full bg-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">
                    DISPONIBLE EN CAJA
                  </p>
                  <p className="text-base font-black text-foreground">
                    {hideBalance ? "••••••" : money(stats.freeLiquidity)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-full bg-[#2EC4B6] shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">
                    AHORRADO (NIDO)
                  </p>
                  <p className="text-base font-black text-teal-400">
                    {hideBalance ? "••••••" : money(stats.savedTotal)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN FINTECH DESTACADA: ESPACIO EN COMPAÑÍA / EQUIPO (SOLO ICONO + TÍTULO + NÚMEROS + BARRA DE PROGRESO) */}
      <section className="mb-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setFamilySheetOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFamilySheetOpen(true);
            }
          }}
          className="bg-card border border-teal-500/40 hover:border-teal-400/70 rounded-2xl p-3.5 shadow-card transition cursor-pointer active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
                <Users className="size-4.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-foreground truncate">
                {inFamily ? familyQuery.data?.name || "Espacio en Compañía" : "Espacio en Compañía"}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-black text-foreground">
                {inFamily ? money(sharedBreakdown.total) : "1 / 2 conectados"}
              </span>
              <span className="text-xs text-teal-400 font-bold ml-1.5">
                {inFamily ? `${sharedBreakdown.myPct}% / ${sharedBreakdown.partnerPct}%` : "50%"}
              </span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden flex border border-border/60">
            {inFamily ? (
              <>
                <div
                  className="bg-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${sharedBreakdown.myPct}%` }}
                />
                <div
                  className="bg-teal-500 h-full transition-all duration-500"
                  style={{ width: `${sharedBreakdown.partnerPct}%` }}
                />
              </>
            ) : (
              <div
                className="bg-gradient-to-r from-blue-500 to-teal-400 h-full transition-all duration-500"
                style={{ width: "50%" }}
              />
            )}
          </div>
        </div>
      </section>

      {/* 5. RETO SEMANAL DE GAMIFICACIÓN (SOLO ICONO + TÍTULO + NÚMEROS + BARRA DE PROGRESO) */}
      <section className="mb-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setChallengeModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setChallengeModalOpen(true);
            }
          }}
          className="bg-card border border-amber-500/40 hover:border-amber-400/70 rounded-2xl p-3.5 shadow-card transition cursor-pointer active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="size-4.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-foreground truncate">
                Reto Semanal de Consumos
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-black text-amber-400">2 / 3 días</span>
              <span className="text-xs font-bold text-slate-400 ml-1.5">(67%) • +100 FFOS</span>
            </div>
          </div>

          {/* Barra de progreso de reto */}
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden border border-border/60">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: "67%" }}
            />
          </div>
        </div>
      </section>

      {/* 6. SECCIÓN UX: FLUJO DE CAJA CONTINUO & COMPARATIVA MENSUAL */}
      <section className="mb-4">
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Flujo de Caja & Comparativa
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  {currentMonthName()} vs {previousMonthName()}
                </p>
              </div>
            </div>

            {/* Selector de Pestaña */}
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-secondary/80 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setFlowViewMode("bridge")}
                className={cn(
                  "py-1.5 px-3 rounded-lg text-xs font-bold transition-all",
                  flowViewMode === "bridge"
                    ? "bg-[#2EC4B6] text-slate-950 font-black shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Puente
              </button>
              <button
                type="button"
                onClick={() => setFlowViewMode("compare")}
                className={cn(
                  "py-1.5 px-3 rounded-lg text-xs font-bold transition-all",
                  flowViewMode === "compare"
                    ? "bg-[#2EC4B6] text-slate-950 font-black shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Mes a Mes
              </button>
            </div>
          </div>

          {/* VISTA 1: PUENTE DE FLUJO CONTINUO CON TIPOGRAFÍA ACCESIBLE */}
          {flowViewMode === "bridge" ? (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {/* 1. Remanente Mes Anterior */}
                <div className="p-3 rounded-xl bg-secondary/60 border border-teal-500/30 flex flex-col justify-between">
                  <span className="text-xs font-bold text-teal-400 block truncate">
                    Remanente {previousMonthName()}
                  </span>
                  <span className="text-sm sm:text-base font-black text-foreground mt-1">
                    {hideBalance ? "••••••" : `+${money(stats.carryoverBalance)}`}
                  </span>
                </div>

                {/* 2. Ingresos Mes Actual */}
                <div className="p-3 rounded-xl bg-secondary/60 border border-border/60 flex flex-col justify-between">
                  <span className="text-xs font-bold text-emerald-400 block truncate">
                    Ingresos {currentMonthName()}
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-400 mt-1">
                    {hideBalance ? "••••••" : `+${money(stats.currentIncome)}`}
                  </span>
                </div>

                {/* 3. Gastos Mes Actual */}
                <div className="p-3 rounded-xl bg-secondary/60 border border-border/60 flex flex-col justify-between">
                  <span className="text-xs font-bold text-amber-400 block truncate">
                    Gastos {currentMonthName()}
                  </span>
                  <span className="text-sm sm:text-base font-black text-amber-400 mt-1">
                    {hideBalance
                      ? "••••••"
                      : `-${money(stats.currentExpense + stats.currentDebtPaid)}`}
                  </span>
                </div>

                {/* 4. Saldo en Caja */}
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/40 flex flex-col justify-between">
                  <span className="text-xs font-black text-teal-300 block truncate">
                    Saldo en Caja
                  </span>
                  <span className="text-sm sm:text-base font-black text-foreground mt-1">
                    {hideBalance ? "••••••" : `=${money(stats.totalBalance)}`}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Scale className="size-4 text-teal-400 shrink-0" />
                  <span>Los fondos no se pierden al cambiar de mes.</span>
                </span>
                <Link
                  to="/movimientos"
                  className="font-bold text-teal-400 hover:underline flex items-center gap-0.5 shrink-0"
                >
                  <span>Ver historial</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* VISTA 2: COMPARATIVA MES A MES (MoM Statistics) */
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-3 gap-2">
                {/* Ingresos MoM */}
                <div className="p-3 rounded-xl bg-secondary/60 border border-border/60">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
                    <span>Ingresos</span>
                    {stats.incomeDelta !== undefined && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded text-xs font-extrabold",
                          stats.incomeDelta >= 0
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400",
                        )}
                      >
                        {stats.incomeDelta >= 0 ? "+" : ""}
                        {stats.incomeDelta}%
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-foreground block">
                    {hideBalance ? "••••••" : money(stats.currentIncome)}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Ant: {hideBalance ? "••••••" : money(stats.prevIncome)}
                  </span>
                </div>

                {/* Gastos MoM */}
                <div className="p-3 rounded-xl bg-secondary/60 border border-border/60">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
                    <span>Gastos</span>
                    {stats.expenseDelta !== undefined && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded text-xs font-extrabold",
                          stats.expenseDelta <= 0
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400",
                        )}
                      >
                        {stats.expenseDelta >= 0 ? "+" : ""}
                        {stats.expenseDelta}%
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-amber-400 block">
                    {hideBalance ? "••••••" : money(stats.currentExpense)}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Ant: {hideBalance ? "••••••" : money(stats.prevExpense)}
                  </span>
                </div>

                {/* Ahorro Nido MoM */}
                <div className="p-3 rounded-xl bg-secondary/60 border border-border/60">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
                    <span>Ahorro</span>
                    <span className="text-teal-400 text-xs font-black">Nido</span>
                  </div>
                  <span className="text-sm font-black text-teal-400 block">
                    {hideBalance ? "••••••" : money(stats.currentSaved)}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Ant: {hideBalance ? "••••••" : money(stats.prevSaved)}
                  </span>
                </div>
              </div>

              {/* Tasa de Margen Neto del mes */}
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">
                  Margen neto del mes:{" "}
                  <strong
                    className={
                      hideBalance
                        ? "text-foreground"
                        : stats.currentMonthNet >= 0
                          ? "text-emerald-400 font-black"
                          : "text-amber-400 font-black"
                    }
                  >
                    {hideBalance ? "••••••" : money(stats.currentMonthNet)}
                  </strong>
                </span>
                <span className="text-slate-400">
                  Mes ant:{" "}
                  <strong className="text-foreground">
                    {hideBalance ? "••••••" : money(stats.prevMonthNet)}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 7. Bloques Centrales Gamificados con Personajes (Chispa, Nido, Toto) */}
      <section className="space-y-3 mb-4">
        {/* BLOQUE 1: CHISPA - LOGROS Y NIVEL */}
        <Link
          to="/aprender"
          className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#592E8E] to-[#452270] p-4.5 text-white border border-[#7A40C2]/80 transition transform active:scale-[0.99] shadow-sm"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="w-7/12 pr-2">
              <span className="inline-block text-xs font-black uppercase tracking-wider text-purple-200 mb-1">
                LOGROS Y PROGRESO
              </span>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight mb-2">
                ¡Subiendo de Nivel!
              </h3>
              {/* Barra de XP de mayor grosor para accesibilidad */}
              <div className="w-full bg-[#341558] h-3 rounded-full overflow-hidden p-0.5 border border-purple-400/40">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${xpProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 font-sans">
                <span className="text-xs font-black text-amber-300">+{xpInLevel} XP</span>
                <span className="text-xs font-bold text-purple-200">
                  {xpCurrent} / {xpNextThreshold} XP
                </span>
              </div>
            </div>

            {/* Chispa SVG */}
            <div className="w-5/12 flex justify-center items-center">
              <ChispaCharacter className="w-24 h-24" />
            </div>
          </div>
        </Link>

        {/* BLOQUE 2: NIDO - METAS DE AHORRO */}
        <Link
          to="/ahorro"
          className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00897B] to-[#006D62] p-4.5 text-white border border-[#14A898]/80 transition transform active:scale-[0.99] shadow-sm"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="w-7/12 pr-2">
              <span className="inline-block text-xs font-black uppercase tracking-wider text-teal-200 mb-1">
                METAS DE AHORRO
              </span>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Fondo de Emergencia
              </h3>
              <p className="text-xs font-semibold text-teal-100/90 mb-2">
                Meta: {money(savingsGoal)}
              </p>
              {/* Progress Bar de mayor grosor */}
              <div className="w-full bg-[#004D45] h-3 rounded-full overflow-hidden p-0.5 border border-teal-300/40">
                <div
                  className="bg-gradient-to-r from-emerald-300 to-teal-200 h-full rounded-full transition-all duration-500"
                  style={{ width: `${savingsPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 font-sans">
                <span className="text-xs font-black text-amber-200">{money(savingsCurrent)}</span>
                <span className="text-xs font-black text-emerald-200">{savingsPct}%</span>
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSheetDefaultValues({
                      type: "ahorro",
                      category: "Fondo de emergencia",
                      note: "Aporte protegido a Nido",
                    });
                    setSheetOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6BE22] hover:bg-amber-300 text-slate-900 font-black text-xs rounded-xl shadow-xs transition active:scale-95"
                >
                  <Plus className="size-3.5 stroke-[3]" />
                  <span>Aportar ahora</span>
                </button>
                <span className="text-xs text-teal-100/90 font-bold">Ver metas →</span>
              </div>
            </div>

            {/* Nido SVG */}
            <div className="w-5/12 flex justify-center items-center">
              <NidoCharacter className="w-24 h-24" />
            </div>
          </div>
        </Link>

        {/* BLOQUE 3: TOTO - DECISIONES Y APRENDIZAJE */}
        <article className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E52B7] to-[#153D8C] p-4.5 text-white border border-[#2D6BE4]/80 transition transform active:scale-[0.99] shadow-sm">
          <div className="flex items-center justify-between relative z-10">
            <div className="w-7/12 pr-2">
              <span className="inline-block text-xs font-black uppercase tracking-wider text-sky-200 mb-1">
                {nextLessonSubProg && nextLessonSubProg.completedCount > 0
                  ? `SUBMÓDULO ${Math.min(3, nextLessonSubProg.completedCount + 1)} DE 3`
                  : "LECCIÓN ACTIVA"}
              </span>
              <h3 className="text-base font-black text-white leading-snug mb-1">
                {nextLesson?.title ?? "Presupuesto 0-base"}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-[#133A85] text-amber-300 border border-amber-400/40">
                  +50 FFOS
                </span>
                <span className="text-xs text-sky-200 font-bold">
                  {nextLessonSubProg ? `${nextLessonSubProg.completedCount}/3 listos` : "Con Toto"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (nextLesson) setOpenLesson({ lesson: nextLesson, done: false });
                }}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-[#F6BE22] hover:bg-amber-300 text-slate-900 font-black text-xs sm:text-sm shadow-sm transition active:scale-95 rounded-xl"
              >
                <span>
                  {nextLessonSubProg && nextLessonSubProg.completedCount > 0
                    ? `Continuar (Paso ${Math.min(3, nextLessonSubProg.completedCount + 1)})`
                    : "Aprender lección"}
                </span>
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Toto SVG */}
            <div className="w-5/12 flex justify-center items-center">
              <TotoCharacter className="w-24 h-24" />
            </div>
          </div>
        </article>
      </section>

      {/* 8. Sección de Últimos Movimientos con Tipografía Limpia y Accesible */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-400">
            ÚLTIMOS MOVIMIENTOS
          </h4>
          <Link
            to="/movimientos"
            className="text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 transition"
          >
            Ver todos ({scopedTransactions.length})
          </Link>
        </div>

        <div className="space-y-2.5">
          {latest.length === 0 ? (
            <div className="p-5 rounded-2xl border border-border bg-card">
              <EmptyState
                title="Sin movimientos"
                description="Presioná el botón '+' central para registrar tu primer movimiento."
              />
            </div>
          ) : (
            latest.map((t) => {
              const isExpense = t.type === "gasto";
              const isIncome = t.type === "ingreso";
              const isSavings = t.type === "ahorro";

              return (
                <div
                  key={t.id}
                  className="rounded-2xl p-3.5 bg-card border border-border/80 flex items-center justify-between shadow-card"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <div
                      className={cn(
                        "size-11 rounded-xl flex items-center justify-center font-bold shrink-0",
                        isIncome &&
                          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
                        isExpense && "bg-rose-500/15 text-rose-400 border border-rose-500/30",
                        isSavings && "bg-teal-500/15 text-teal-400 border border-teal-500/30",
                        t.type === "pago_deuda" &&
                          "bg-purple-500/15 text-purple-400 border border-purple-500/30",
                      )}
                    >
                      {isIncome ? (
                        <ArrowDownRight className="size-5.5" />
                      ) : isExpense ? (
                        <ArrowUpRight className="size-5.5" />
                      ) : isSavings ? (
                        <Wallet className="size-5.5" />
                      ) : (
                        <TrendingDown className="size-5.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-foreground truncate">
                          {t.category}
                        </span>
                        {t.shared && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-extrabold border border-teal-500/30 shrink-0">
                            En Compañía
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-semibold truncate mt-0.5">
                        {t.note || t.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "font-black text-base sm:text-lg block font-sans",
                        isIncome && "text-emerald-400",
                        isExpense && "text-rose-400",
                        isSavings && "text-teal-400",
                        t.type === "pago_deuda" && "text-purple-400",
                      )}
                    >
                      {isIncome ? "+" : "-"}
                      {money(t.amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
