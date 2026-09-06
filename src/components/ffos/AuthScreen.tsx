import { useState } from "react";
import { toast } from "sonner";
import { signIn, signUp, resetPasswordForEmail } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

type Mode = "login" | "register" | "forgot";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else if (mode === "register") {
        if (!displayName.trim()) throw new Error("Ingresá tu nombre.");
        const { needsEmailConfirmation } = await signUp(email, password, displayName.trim());
        toast.success(
          needsEmailConfirmation
            ? "Cuenta creada. Revisá tu email para confirmarla antes de entrar."
            : "Cuenta creada. Ya podés entrar.",
        );
        setMode("login");
      } else {
        await resetPasswordForEmail(email);
        toast.success("Te enviamos un email para restablecer la contraseña.");
        setMode("login");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">FFOS Wallet</h1>
          <p className="text-sm text-muted-foreground">Finanzas familiares claras</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card"
        >
          <h2 className="text-lg font-semibold">
            {mode === "login" && "Iniciar sesión"}
            {mode === "register" && "Crear cuenta"}
            {mode === "forgot" && "Restablecer contraseña"}
          </h2>

          {mode === "register" && (
            <Field label="Nombre">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
                placeholder="Tu nombre"
              />
            </Field>
          )}

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
              placeholder="tu@email.com"
            />
          </Field>

          {mode !== "forgot" && (
            <Field label="Contraseña">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
                placeholder="••••••••"
              />
            </Field>
          )}

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy
              ? "Un momento..."
              : mode === "login"
                ? "Entrar"
                : mode === "register"
                  ? "Crear cuenta"
                  : "Enviar email"}
          </button>

          <div className="flex flex-col items-center gap-1.5 text-[13px]">
            {mode === "login" && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-muted-foreground"
                >
                  Olvidé mi contraseña
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={cn("font-medium text-primary")}
                >
                  ¿No tenés cuenta? Registrate
                </button>
              </>
            )}
            {mode !== "login" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-medium text-primary"
              >
                Volver a iniciar sesión
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
