import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Lock, ArrowLeft } from "lucide-react";
import { updatePassword } from "@/lib/supabase/auth";
import { UaliBrandLogo } from "@/components/ffos/characters/Characters";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Restablecer Contraseña — Ualí Finanzas" },
      {
        name: "description",
        content: "Define tu nueva contraseña segura para acceder a tu cuenta de Ualí Finanzas.",
      },
    ],
  }),
  component: ResetPasswordRoute,
});

export function ResetPasswordRoute() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
      toast.success("Contraseña actualizada correctamente.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar la contraseña.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <UaliBrandLogo className="size-11" />
          <div>
            <h1 className="font-display text-xl font-extrabold text-foreground">
              Nueva Contraseña
            </h1>
            <p className="text-xs text-muted-foreground">
              Recuperación segura de acceso a Ualí Finanzas
            </p>
          </div>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-primary-soft border border-primary/30 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-foreground">¡Tu contraseña ha sido actualizada!</p>
                <p className="text-muted-foreground">
                  Ya puedes volver al panel principal para gestionar tus finanzas en calma.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void navigate({ to: "/" })}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs cursor-pointer"
            >
              Ir al Panel Principal
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-xs font-bold text-foreground block">
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-xs font-bold text-foreground focus:outline-2 focus:outline-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-xs font-bold text-foreground block">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <Lock className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-secondary border border-border text-xs font-bold text-foreground focus:outline-2 focus:outline-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs btn-3d disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Guardando..." : "Guardar nueva contraseña"}
            </button>

            <button
              type="button"
              onClick={() => void navigate({ to: "/" })}
              className="w-full py-2 px-3 rounded-xl bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver al inicio</span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
