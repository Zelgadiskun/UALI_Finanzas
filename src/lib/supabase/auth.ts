import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";
import { safeLocalStorage } from "../safeStorage";

const GUEST_STORAGE_KEY = "quali_guest_session_active";
const EXPLICIT_LOGOUT_KEY = "quali_user_explicitly_logged_out";

export function isGuestSession(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (safeLocalStorage.getItem(EXPLICIT_LOGOUT_KEY) === "true") return false;
  } catch {
    return true;
  }
  return true;
}

export function createGuestSession(): Session {
  return {
    access_token: "guest-token",
    token_type: "bearer",
    expires_in: 86400,
    refresh_token: "guest-refresh",
    user: {
      id: "guest-user",
      app_metadata: { provider: "guest" },
      user_metadata: { display_name: "Invitado Demo", full_name: "Usuario Demo" },
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  };
}

export function signInAsGuest() {
  if (typeof window !== "undefined") {
    try {
      safeLocalStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      safeLocalStorage.setItem(GUEST_STORAGE_KEY, "true");
    } catch (_err) {
      // Ignore iframe storage restriction
    }
    window.dispatchEvent(new CustomEvent("quali-auth-state-changed"));
  }
}

/**
 * Sesión actual + si ya se resolvió el estado inicial.
 * Inicia de inmediato en modo demo para permitir interacción y SSR instantáneo.
 * Si existe una sesión real en Supabase, se actualiza automáticamente en segundo plano.
 */
export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(() => {
    return isGuestSession() ? createGuestSession() : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const handleAuthEvent = () => {
      if (!active) return;
      if (isGuestSession()) {
        setSession(createGuestSession());
        setLoading(false);
      } else {
        setSession(null);
        setLoading(false);
      }
    };

    window.addEventListener("quali-auth-state-changed", handleAuthEvent);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        if (data?.session) {
          setSession(data.session);
        } else if (isGuestSession()) {
          setSession(createGuestSession());
        } else {
          setSession(null);
        }
      })
      .catch((err) => {
        if (!active) return;
        console.warn("No Supabase session available:", err);
        if (isGuestSession()) {
          setSession(createGuestSession());
        } else {
          setSession(null);
        }
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next ?? (isGuestSession() ? createGuestSession() : null));
      setLoading(false);
    });

    return () => {
      active = false;
      window.removeEventListener("quali-auth-state-changed", handleAuthEvent);
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return { session, loading };
}

/**
 * Devuelve true si el registro dejó sesión iniciada de una. Si el proyecto
 * tiene "Confirm email" activado, Supabase crea el usuario pero no
 * devuelve sesión hasta que confirme por el link del correo — sin este
 * chequeo, la UI diría "ya podés entrar" cuando en realidad no puede.
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  return { needsEmailConfirmation: !data.session };
}

export async function signIn(email: string, password: string) {
  if (typeof window !== "undefined") {
    try {
      safeLocalStorage.removeItem(EXPLICIT_LOGOUT_KEY);
    } catch (_err) {
      // Ignore iframe storage restriction
    }
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Login con Google. A diferencia de signIn(), esta promesa NUNCA resuelve con
 * una sesión: lo que hace es mandar al navegador a la pantalla de consentimien-
 * to de Google. Por eso acá no hay nada que hacer con el resultado: la pantalla
 * que ve el usuario es la de Google, no esta.
 *
 * Al volver, Google trae `?code=` en la URL; `detectSessionInUrl` de Supabase
 * (activo por defecto, con flujo PKCE) cambia ese code por tokens y dispara
 * onAuthStateChange, que es lo que hace que useSession pase de `loading` a
 * sesión — por eso AppGate muestra la app sola, sin una ruta de callback propia.
 *
 * redirectTo apunta al origen actual (Vercel en producción, :8080 en local) y
 * tiene que estar en Auth → URL Configuration → Redirect URLs del proyecto.
 */
export async function signInWithGoogle() {
  if (typeof window !== "undefined") {
    try {
      safeLocalStorage.removeItem(EXPLICIT_LOGOUT_KEY);
    } catch (_err) {
      // Ignore iframe storage restriction
    }
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/` },
  });
  if (error) throw error;
}

export async function signOut() {
  if (typeof window !== "undefined") {
    try {
      safeLocalStorage.setItem(EXPLICIT_LOGOUT_KEY, "true");
      safeLocalStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (_err) {
      // Ignore iframe storage restriction
    }
    window.dispatchEvent(new CustomEvent("quali-auth-state-changed"));
  }
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.warn("Supabase signOut:", error);
  } catch (e) {
    console.warn("Supabase signOut error:", e);
  }
}

export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Borra la cuenta y todos sus datos (transacciones, perfil, sesión). Corre
 * como una función de Postgres — ver delete_own_account() — porque no hay
 * forma de invocar la API de administración de Auth desde el cliente sin
 * exponer la service role key. signOut() al final es defensivo: el usuario
 * ya no existe, pero el cliente igual puede tener el JWT cacheado en
 * memoria/localStorage hasta el próximo refresh.
 */
export async function deleteAccount() {
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw error;
  await supabase.auth.signOut();
}
