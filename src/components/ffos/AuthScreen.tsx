import { useState } from "react";
import { toast } from "sonner";
import { signIn, signUp, signInWithGoogle, resetPasswordForEmail } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

type Mode = "login" | "register" | "forgot";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);
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

  /**
   * Google redirige fuera del origen, así que el `await` resuelve ANTES de irse
   * y nunca vuelve a esta instancia de la página: no hay un "finally" que
   * re-habilite el botón. Si el usuario cancela en Google y vuelve con el botón
   * bloqueado, la pantalla queda inservible; por eso el timeout defensivo.
   */
  async function withGoogle() {
    setError(null);
    setBusyGoogle(true);
    const unlock = setTimeout(() => setBusyGoogle(false), 4000);
    try {
      await signInWithGoogle();
      clearTimeout(unlock); // ya nos vamos de la página, no hace falta desbloquear
    } catch (e) {
      clearTimeout(unlock);
      setBusyGoogle(false);
      setError(e instanceof Error ? e.message : "No pudimos abrir Google. Probá de nuevo.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-3xl font-bold text-primary">FFOS Wallet</h1>
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
            className="btn-3d h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy
              ? "Un momento…"
              : mode === "login"
                ? "Entrar"
                : mode === "register"
                  ? "Crear cuenta"
                  : "Enviar email"}
          </button>

          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  o
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              {/* Botón con la marca de Google, sin reimplementar su guía de
                  estilo: fondo blanco, borde #747775 (estados hover/focus por
                  Tailwind), 40dp de alto mínimo y el logo multicolor SVG. No
                  usa btn-3d porque ese sombra parte del índigo de la marca y
                  la guía de Google pide superficie neutra. */}
              <button
                type="button"
                onClick={() => void withGoogle()}
                disabled={busy || busyGoogle}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#747775] bg-white text-sm font-semibold text-[#1f1f1f] transition-colors hover:bg-[#f7f8f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b57d0] disabled:opacity-60"
              >
                <GoogleMark />
                <span>Continuar con Google</span>
              </button>
            </>
          )}

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

/** Logo oficial de Google (los cuatro colores son parte de la marca registrada
 *  y Google exige que se muestre así, sin recolorir ni remplazar por un icono
 *  de lucide). viewBox 0 0 48 18 + paths del asset estándar de "G". */
function GoogleMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.7h11.84c-.52 2.75-2.06 5.08-4.4 6.64v5.52h7.12c4.16-3.84 6.56-9.48 6.56-16.36z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.96 14.56-5.32l-7.12-5.52c-1.96 1.32-4.48 2.12-7.44 2.12-5.72 0-10.56-3.86-12.3-9.06H4.36v5.7C8.02 41.36 15.44 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.7 28.22c-.44-1.32-.7-2.72-.7-4.22s.26-2.9.7-4.22v-5.7H4.36C2.82 17.1 2 20.44 2 24s.82 6.9 2.36 9.9l7.34-5.68z"
      />
      <path
        fill="#EA4335"
        d="M24 10.76c3.24 0 6.14 1.12 8.42 3.32l6.28-6.28C34.92 4.12 29.94 2 24 2 15.44 2 8.02 6.64 4.36 14.1l7.34 5.7c1.74-5.2 6.58-9.04 12.3-9.04z"
      />
    </svg>
  );
}
