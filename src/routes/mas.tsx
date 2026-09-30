import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Award, LogOut, Moon, Sparkles, Target, Trash2, UserMinus, Users } from "lucide-react";
import { ProgressSheet } from "@/components/ffos/ProgressSheet";
import { FamilySheet } from "@/components/ffos/FamilySheet";
import { GoalsSheet } from "@/components/ffos/GoalsSheet";
import { ConfirmModal } from "@/components/ffos/ConfirmModal";
import { TutorialModal } from "@/components/ffos/TutorialModal";
import { Switch } from "@/components/ui/switch";
import { deleteAccount, signOut } from "@/lib/supabase/auth";
import {
  useProgressQuery,
  useProfileQuery,
  useFamilyQuery,
  usePendingInvitationsQuery,
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

  function toggleDarkMode(checked: boolean) {
    setDarkMode(checked);
    applyTheme(checked ? "dark" : "light");
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
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:bg-secondary/40"
        >
          <Sparkles className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Guía y Principios de UALI</span>
            <span className="block text-[12px] text-muted-foreground">
              Regla 50/30/20, privacidad y finanzas en equipo
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
    </main>
  );
}
