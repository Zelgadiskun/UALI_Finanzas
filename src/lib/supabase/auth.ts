import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";

const GUEST_STORAGE_KEY = "quali_guest_session_active";

export function isGuestSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GUEST_STORAGE_KEY) === "true";
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
    localStorage.setItem(GUEST_STORAGE_KEY, "true");
    window.dispatchEvent(new CustomEvent("quali-auth-state-changed"));
  }
}

/**
 * Sesión actual + si ya se resolvió el estado inicial. `loading` distingue
 * "todavía no sabemos" de "sabemos que no hay sesión" — sin eso, un usuario
 * ya logueado vería un parpadeo a la pantalla de login antes de entrar.
 */
export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(() => {
    return isGuestSession() ? createGuestSession() : null;
  });
  const [loading, setLoading] = useState(() => !isGuestSession());

  useEffect(() => {
    let active = true;

    const handleAuthEvent = () => {
      if (!active) return;
      if (isGuestSession()) {
        setSession(createGuestSession());
        setLoading(false);
      } else {
        setSession(null);
      }
    };

    window.addEventListener("quali-auth-state-changed", handleAuthEvent);

    if (isGuestSession()) {
      setSession(createGuestSession());
      setLoading(false);
      return () => {
        active = false;
        window.removeEventListener("quali-auth-state-changed", handleAuthEvent);
      };
    }

    // Timeout defensivo de 1.5s: si la conexión con Supabase se demora o cuelga,
    // liberamos loading para que la pantalla nunca quede en blanco perpetuo
    const safetyTimer = setTimeout(() => {
      if (active) setLoading(false);
    }, 1500);

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
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn("No Supabase session available:", err);
        if (isGuestSession()) {
          setSession(createGuestSession());
        } else {
          setSession(null);
        }
        setLoading(false);
      })
      .finally(() => {
        clearTimeout(safetyTimer);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next ?? (isGuestSession() ? createGuestSession() : null));
      setLoading(false);
    });

    return () => {
      active = false;
      clearTimeout(safetyTimer);
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
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/` },
  });
  if (error) throw error;
}

export async function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_STORAGE_KEY);
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
