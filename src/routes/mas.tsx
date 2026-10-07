import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Award,
  Bell,
  Crown,
  FileSpreadsheet,
  LogOut,
  Moon,
  Sparkles,
  Target,
  Trash2,
  User,
  UserMinus,
  Users,
  Video,
} from "lucide-react";
import { ProgressSheet } from "@/components/ffos/ProgressSheet";
import { FamilySheet } from "@/components/ffos/FamilySheet";
import { GoalsSheet } from "@/components/ffos/GoalsSheet";
import { ConfirmModal } from "@/components/ffos/ConfirmModal";
import { TutorialModal } from "@/components/ffos/TutorialModal";
import { ProfileSheet } from "@/components/ffos/ProfileSheet";
import { UserAvatarDisplay } from "@/components/ffos/UserAvatarDisplay";
import { NotificationCenterModal } from "@/components/ffos/NotificationCenterModal";
import { PaywallModal } from "@/components/ffos/PaywallModal";
import { GrowthKitModal } from "@/components/ffos/GrowthKitModal";
import { PWAInstallButton } from "@/components/ffos/PWAInstallButton";
import { useNotificationCenter } from "@/lib/ffos/notificationsStore";
import { useSubscription } from "@/lib/ffos/subscriptionStore";
import { exportTransactionsToCSV, exportFinancialReportToPrintPDF } from "@/lib/ffos/exportReports";
import { Switch } from "@/components/ui/switch";
import { deleteAccount, signOut } from "@/lib/supabase/auth";
import {
  useProgressQuery,
  useProfileQuery,
  useFamilyQuery,
  usePendingInvitationsQuery,
  useTransactionsQuery,
} from "@/lib/supabase/queries";
import { useLeaveFamilyMutation } from "@/lib/supabase/mutations";
import { levelInfo } from "@/lib/ffos/gamification";
import { applyTheme, getStoredTheme } from "@/lib/theme";

const title = "Más — UALI Finanzas";
const description = "Progreso, logros, metas y ajustes de tu cuenta en UALI Finanzas.";

export const Route = createFileRoute("/mas")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Mas,
});

function Mas() {
  const progressQuery = useProgressQuery();
  const progress = progressQuery.data;
  const profile = useProfileQuery();
  const familyQuery = useFamilyQuery();
  const leaveFamilyMutation = useLeaveFamilyMutation();
  const pendingQuery = usePendingInvitationsQuery();
  const pendingCount = pendingQuery.data?.length ?? 0;
  const inFamily = !!profile.data?.family_id;
  const [progressOpen, setProgressOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [confirmingLeaveFamily, setConfirmingLeaveFamily] = useState(false);
  const [leavingFamily, setLeavingFamily] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => getStoredTheme() === "dark");
  const info = levelInfo(progress?.xp ?? 0);
  const { unreadCount: smartUnreadCount } = useNotificationCenter();
  const { isPro, openPaywall, paywallOpen, closePaywall } = useSubscription();
  const [growthOpen, setGrowthOpen] = useState(false);
  const [localPaywallTrigger, setLocalPaywallTrigger] = useState<"general" | "family" | "reports">(
    "general",
  );
  const txQuery = useTransactionsQuery();

  function toggleDarkMode(checked: boolean) {
    setDarkMode(checked);
    applyTheme(checked ? "dark" : "light");
  }

  function handleExportReports(type: "csv" | "pdf") {
    if (!isPro) {
      setLocalPaywallTrigger("reports");
      openPaywall();
      return;
    }
    const list = (txQuery.data ?? []).map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: t.date || new Date().toISOString().split("T")[0],
    }));
    if (list.length === 0) {
      toast.info("No hay transacciones registradas para exportar aún.");
      return;
    }
    try {
      if (type === "csv") {
        exportTransactionsToCSV({
          transactions: list,
          userName: profile.data?.display_name || "Usuario",
          familyName: familyQuery.data?.name || "Espacio Compartido",
        });
        toast.success("Reporte CSV descargado con éxito.");
      } else {
        exportFinancialReportToPrintPDF({
          transactions: list,
          userName: profile.data?.display_name || "Usuario",
          familyName: familyQuery.data?.name || "Espacio Compartido",
        });
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Error al generar reporte");
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch {
      toast.error("No se pudo eliminar la cuenta. Probá de nuevo.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <main className="px-4 pt-4 pb-6">
      <h1 className="font-display text-xl font-bold">Más</h1>

      <div className="mt-4 space-y-2">
        {/* Estado de Suscripción & Acceso Pro */}
        <button
          onClick={() => {
            setLocalPaywallTrigger("general");
            openPaywall();
          }}
          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-card transition active:scale-98 ${
            isPro
              ? "border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-card to-card"
              : "border-teal-500/40 bg-gradient-to-r from-teal-950/30 via-card to-card"
          }`}
        >
          <div
            className={`grid size-9 place-items-center rounded-xl shrink-0 ${
              isPro ? "bg-amber-500/20 text-amber-400" : "bg-teal-500/20 text-teal-400"
            }`}
          >
            <Crown className="size-5" />
          </div>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="block text-sm font-extrabold text-foreground">
                {isPro ? "UALÍ Dúo Pro Activo" : "Desbloquear UALÍ Dúo Pro"}
              </span>
              <span
                className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isPro
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                }`}
              >
                {isPro ? "Prémium" : "Prueba 7 Días"}
              </span>
            </span>
            <span className="block text-[12px] text-muted-foreground">
              {isPro
                ? "Sincronización en pareja y reportes ejecutivos habilitados"
                : "Sincronización familiar sin límites, reportes en PDF y radar con IA"}
            </span>
          </span>
        </button>

        {/* Instalación PWA en pantalla de inicio */}
        <PWAInstallButton variant="banner" />

        <button
          onClick={() => setProfileOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 text-left shadow-card hover:bg-teal-500/15 transition active:scale-98"
        >
          <div className="grid size-9 place-items-center rounded-full overflow-hidden border-2 border-[#F6BE22] bg-[#141F36] ring-2 ring-[#F6BE22]/20 shadow-xs shrink-0">
            <UserAvatarDisplay displayName={profile.data?.display_name} size="sm" />
          </div>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-foreground">
              Mi Perfil & Ajustes
            </span>
            <span className="block text-[12px] text-muted-foreground">
              Foto o personaje, nombre de usuario y compartir en redes
            </span>
          </span>
        </button>

        {/* Reportes Contables Exportables */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <FileSpreadsheet className="size-4" />
              </div>
              <div>
                <span className="block text-sm font-bold text-foreground">
                  Reportes Exportables
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  Para tu contador, bancos o balance mensual
                </span>
              </div>
            </div>
            {!isPro && (
              <span className="text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="size-2.5" /> PRO
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleExportReports("pdf")}
              className="py-2 px-3 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <span>📄 Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportReports("csv")}
              className="py-2 px-3 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <span>📊 Descargar Excel</span>
            </button>
          </div>
        </div>

        {/* Kit de Adquisición Viral TikTok/Reels */}
        <button
          onClick={() => setGrowthOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-left shadow-card hover:bg-emerald-950/30 transition active:scale-98"
        >
          <div className="size-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Video className="size-4.5" />
          </div>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="block text-sm font-extrabold text-foreground">
                Kit TikTok / Reels Orgánico
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Coste $0
              </span>
            </span>
            <span className="block text-[12px] text-muted-foreground">
              Guiones virales: "Cómo dividimos gastos en pareja con UALÍ"
            </span>
          </span>
        </button>

        <button
          onClick={() => setNotifOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-teal-500/30 bg-card p-4 text-left shadow-card hover:bg-secondary/60 transition active:scale-98"
        >
          <div className="relative">
            <div className="size-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Bell className="size-4.5" />
            </div>
            {smartUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-3.5 bg-danger text-danger-foreground rounded-full text-[8.5px] font-black flex items-center justify-center">
                {smartUnreadCount}
              </span>
            )}
          </div>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-foreground">
              Alertas, Metas & Radar GPS
            </span>
            <span className="block text-[12px] text-muted-foreground">
              Avisos sutiles en tiendas, recordatorios y metas
            </span>
          </span>
        </button>

        <button
          onClick={() => setProgressOpen(true)}
          disabled={!progress}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card disabled:opacity-60"
        >
          <Award className="size-5 text-accent" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Progreso y logros</span>
            <span className="block text-[12px] text-muted-foreground">
              Nivel {info.level} · {info.name} · {progress?.xp ?? 0} XP
            </span>
          </span>
        </button>

        <button
          onClick={() => setFamilyOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card"
        >
          <Users className="size-5 text-accent" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              {familyQuery.data?.name
                ? `Equipo: ${familyQuery.data.name}`
                : "Equipo / Espacio Compartido"}
            </span>
            <span className="block text-[12px] text-muted-foreground">
              {inFamily
                ? "Ver miembros, invitar y gestionar código"
                : "Crear espacio (Pareja, Roommates, Amigos, etc.)"}
            </span>
          </span>
          {pendingCount > 0 && (
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-danger text-[11px] font-bold text-danger-foreground">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setGoalsOpen(true)}
          disabled={!inFamily}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card disabled:opacity-60"
        >
          <Target className="size-5 text-accent" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Metas de ahorro</span>
            <span className="block text-[12px] text-muted-foreground">
              {inFamily
                ? "Ver y crear metas conjuntas"
                : "Conéctate a un espacio compartido primero"}
            </span>
          </span>
        </button>

        {inFamily && (
          <button
            onClick={() => setConfirmingLeaveFamily(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft/30 p-4 text-left text-danger shadow-card transition-colors hover:bg-danger-soft/60"
          >
            <UserMinus className="size-5 text-danger" strokeWidth={1.75} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Abandonar espacio compartido</span>
              <span className="block text-[12px] opacity-80">
                Salir de {familyQuery.data?.name || "este equipo"} y volver a modo personal
              </span>
            </span>
          </button>
        )}

        <button
          onClick={() => setTutorialOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:bg-secondary/40 active:scale-98"
        >
          <Sparkles className="size-5 text-teal-400" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">
              Manual & Micro-Tutoriales
            </span>
            <span className="block text-[12px] text-muted-foreground">
              Asistente 0-Base y 50/30/20, Puntos FFOS, guardianes y flujo de caja
            </span>
          </span>
        </button>

        <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          <Moon className="size-5 text-accent" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Modo oscuro</span>
            <span className="block text-[12px] text-muted-foreground">
              {darkMode ? "Activado" : "Desactivado"}
            </span>
          </span>
          <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
        </div>

        <button
          onClick={() => setConfirmingSignOut(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-danger shadow-card"
        >
          <LogOut className="size-5" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Cerrar sesión</span>
          </span>
        </button>

        <button
          onClick={() => setConfirmingDelete(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-left text-danger shadow-card"
        >
          <Trash2 className="size-5" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Eliminar cuenta</span>
            <span className="block text-[12px] opacity-80">
              Borra tu cuenta y tus datos para siempre
            </span>
          </span>
        </button>

        <div className="flex justify-center gap-4 pt-2 text-[12px] text-muted-foreground">
          <a href="/privacidad.html" className="underline underline-offset-2">
            Privacidad
          </a>
          <a href="/terminos.html" className="underline underline-offset-2">
            Términos
          </a>
        </div>
      </div>

      {progress && (
        <ProgressSheet
          open={progressOpen}
          onClose={() => setProgressOpen(false)}
          progress={progress}
        />
      )}
      <FamilySheet open={familyOpen} onClose={() => setFamilyOpen(false)} />
      <GoalsSheet open={goalsOpen} onClose={() => setGoalsOpen(false)} />
      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      <ConfirmModal
        open={confirmingLeaveFamily}
        title="¿Abandonar el espacio compartido?"
        description="Dejarás de ver los presupuestos y gastos compartidos de este equipo. Tus movimientos y datos privados siguen estando a salvo en tu cuenta."
        confirmLabel={leavingFamily ? "Saliendo…" : "Abandonar espacio"}
        onCancel={() => setConfirmingLeaveFamily(false)}
        onConfirm={async () => {
          setLeavingFamily(true);
          try {
            await leaveFamilyMutation.mutateAsync();
            toast.success("Has salido del espacio compartido.");
            setConfirmingLeaveFamily(false);
          } catch {
            toast.error("No se pudo salir del espacio. Probá de nuevo.");
          } finally {
            setLeavingFamily(false);
          }
        }}
      />
      <ConfirmModal
        open={confirmingSignOut}
        title="¿Cerrar sesión?"
        description="Vas a tener que volver a iniciar sesión para ver tus datos."
        confirmLabel="Cerrar sesión"
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={() => {
          setConfirmingSignOut(false);
          void signOut().catch(() => toast.error("No se pudo cerrar sesión. Probá de nuevo."));
        }}
      />
      <ConfirmModal
        open={confirmingDelete}
        title="¿Eliminar tu cuenta?"
        description="Se borran tu perfil, tus movimientos y tu progreso — no se puede deshacer. Si administrás una familia con más gente, la administración pasa a otro miembro; si sos el único, la familia se borra con vos."
        confirmLabel={deleting ? "Eliminando…" : "Eliminar cuenta"}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          if (!deleting) void handleDeleteAccount();
        }}
      />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
      <NotificationCenterModal open={notifOpen} onClose={() => setNotifOpen(false)} />
      <PaywallModal
        open={paywallOpen}
        onClose={closePaywall}
        triggerFeature={localPaywallTrigger}
      />
      <GrowthKitModal open={growthOpen} onClose={() => setGrowthOpen(false)} />
    </main>
  );
}
