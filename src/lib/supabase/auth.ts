import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";

/**
 * Sesión actual + si ya se resolvió el estado inicial. `loading` distingue
 * "todavía no sabemos" de "sabemos que no hay sesión" — sin eso, un usuario
 * ya logueado vería un parpadeo a la pantalla de login antes de entrar.
 */
export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
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

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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
