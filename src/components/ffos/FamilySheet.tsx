import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Share2, UserPlus, X } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import {
  useFamilyMembersQuery,
  useFamilyQuery,
  usePendingInvitationsQuery,
  useProfileQuery,
} from "@/lib/supabase/queries";
import {
  useAcceptInvitationMutation,
  useCreateFamilyMutation,
  useInviteToFamilyMutation,
  useJoinFamilyMutation,
  useRejectInvitationMutation,
} from "@/lib/supabase/mutations";
import { cn } from "@/lib/utils";

type Props = { open: boolean; onClose: () => void };

export function FamilySheet({ open, onClose }: Props) {
  const profile = useProfileQuery();
  const familyQuery = useFamilyQuery();
  const membersQuery = useFamilyMembersQuery();
  const pendingQuery = usePendingInvitationsQuery();

  const inFamily = !!profile.data?.family_id;

  return (
    <BottomSheet open={open} onClose={onClose} title="Familia">
      <div className="space-y-5 pb-2">
        {pendingQuery.data && pendingQuery.data.length > 0 && (
          <PendingInvitations invitations={pendingQuery.data} />
        )}

        {inFamily ? (
          familyQuery.data && (
            <FamilyDetails family={familyQuery.data} members={membersQuery.data ?? []} />
          )
        ) : (
          <NoFamilyYet />
        )}
      </div>
    </BottomSheet>
  );
}

function PendingInvitations({
  invitations,
}: {
  invitations: { id: string; family_name: string; from_display_name: string }[];
}) {
  const acceptMutation = useAcceptInvitationMutation();
  const rejectMutation = useRejectInvitationMutation();

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">Invitaciones pendientes</h3>
      <ul className="space-y-2">
        {invitations.map((inv) => (
          <li key={inv.id} className="rounded-xl border border-border bg-card p-3">
            <p className="text-sm">
              <span className="font-medium">{inv.from_display_name}</span> te invitó a{" "}
              <span className="font-medium">{inv.family_name}</span>
            </p>
            <div className="mt-2 flex gap-2">
              <button
                disabled={acceptMutation.isPending}
                onClick={() =>
                  acceptMutation.mutate(inv.id, {
                    onSuccess: () => toast.success(`Te uniste a ${inv.family_name}`),
                    onError: () => toast.error("No se pudo aceptar la invitación."),
                  })
                }
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Check className="size-4" strokeWidth={2} />
                Aceptar
              </button>
              <button
                disabled={rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate(inv.id, {
                    onError: () => toast.error("No se pudo rechazar la invitación."),
                  })
                }
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-[13px] font-medium text-muted-foreground disabled:opacity-60"
              >
                <X className="size-4" strokeWidth={2} />
                Rechazar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NoFamilyYet() {
  const [mode, setMode] = useState<"none" | "create" | "join">("none");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const createMutation = useCreateFamilyMutation();
  const joinMutation = useJoinFamilyMutation();

  async function submitCreate() {
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync(name.trim());
      toast.success("Familia creada");
      setMode("none");
    } catch {
      toast.error("No se pudo crear la familia.");
    }
  }

  async function submitJoin() {
    if (!code.trim()) return;
    try {
      await joinMutation.mutateAsync(code.trim());
      toast.success("Te uniste a la familia");
      setMode("none");
    } catch {
      toast.error("Código inválido o algo salió mal.");
    }
  }

  if (mode === "create") {
    return (
      <section className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Nombre de la familia
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Familia García"
            className="h-12 w-full rounded-xl border border-border bg-card px-3 text-sm"
          />
        </label>
        <button
          onClick={() => void submitCreate()}
          disabled={createMutation.isPending}
          className="btn-3d h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {createMutation.isPending ? "Creando..." : "Crear familia"}
        </button>
        <button
          onClick={() => setMode("none")}
          className="h-10 w-full text-sm font-medium text-muted-foreground"
        >
          Cancelar
        </button>
      </section>
    );
  }

  if (mode === "join") {
    return (
      <section className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Código de la familia
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ej. AB12CD"
            className="h-12 w-full rounded-xl border border-border bg-card px-3 text-center font-mono text-lg tracking-widest"
            maxLength={6}
          />
        </label>
        <button
          onClick={() => void submitJoin()}
          disabled={joinMutation.isPending}
          className="btn-3d h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {joinMutation.isPending ? "Uniéndote..." : "Unirme"}
        </button>
        <button
          onClick={() => setMode("none")}
          className="h-10 w-full text-sm font-medium text-muted-foreground"
        >
          Cancelar
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <p className="text-sm text-muted-foreground">Todavía no estás conectado a ninguna familia.</p>
      <button
        onClick={() => setMode("create")}
        className="btn-3d h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
      >
        Crear familia
      </button>
      <button
        onClick={() => setMode("join")}
        className="h-12 w-full rounded-xl border border-border text-sm font-medium"
      >
        Unirme con código
      </button>
    </section>
  );
}

function FamilyDetails({
  family,
  members,
}: {
  family: { id: string; name: string; code: string };
  members: { id: string; display_name: string; xp: number }[];
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const inviteMutation = useInviteToFamilyMutation();

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(family.code);
      toast.success("Código copiado");
    } catch {
      toast.error("No se pudo copiar. Copialo a mano: " + family.code);
    }
  }

  async function shareCode() {
    const text = `Unite a "${family.name}" en FFOS Wallet con el código ${family.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // el usuario canceló el share sheet — no es un error a mostrar
      }
    } else {
      await copyCode();
    }
  }

  async function submitInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    try {
      await inviteMutation.mutateAsync({ email, familyId: family.id, familyName: family.name });
      toast.success(`Invitación enviada a ${email}`);
      setInviteEmail("");
    } catch {
      toast.error("No se pudo enviar la invitación.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
          {family.name}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex-1 rounded-lg bg-secondary px-3 py-2 text-center font-display text-lg tracking-widest">
            {family.code}
          </span>
          <button
            onClick={() => void copyCode()}
            aria-label="Copiar código"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground"
          >
            <Copy className="size-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => void shareCode()}
            aria-label="Compartir código"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground"
          >
            <Share2 className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Miembros</h3>
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
            >
              <span className="text-sm font-medium">{m.display_name}</span>
              <span className="text-[12px] text-muted-foreground">{m.xp} XP</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <UserPlus className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Invitar por email
        </h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="familiar@email.com"
            className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm"
          />
          <button
            onClick={() => void submitInvite()}
            disabled={inviteMutation.isPending}
            className={cn(
              "h-11 shrink-0 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground",
              inviteMutation.isPending && "opacity-60",
            )}
          >
            Invitar
          </button>
        </div>
      </section>
    </div>
  );
}
