-- Row Level Security: cuenta personal por miembro, movimientos privados salvo
-- que se marquen como compartidos, presupuestos/deudas/metas siempre conjuntos.

-- Una política sobre `profiles` que vuelva a consultar `profiles` entra en
-- recursión infinita (el error más común de RLS en Supabase). La salida es
-- una función security definer: evalúa saltándose las políticas de la propia
-- tabla que consulta.
create function public.my_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid()
$$;

alter table families enable row level security;
alter table profiles enable row level security;
alter table debts enable row level security;
alter table goals enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table units enable row level security;
alter table lessons enable row level security;
alter table lesson_progress enable row level security;
alter table invitations enable row level security;

-- families: se ve estando adentro; se crea siendo el owner declarado; no se
-- borra desde el cliente (una familia con miembros no debería desaparecer
-- por accidente — el borrado, si hace falta, se maneja aparte).
create policy families_read on families
  for select
  using (id = public.my_family_id());

create policy families_create on families
  for insert
  with check (owner_id = auth.uid());

create policy families_update on families
  for update
  using (id = public.my_family_id());

-- profiles: cada quien lee y edita el suyo; además se puede leer (no editar)
-- el de cualquier miembro de la propia familia, para mostrar nombres/XP.
create policy profiles_read on profiles
  for select
  using (id = auth.uid() or family_id = public.my_family_id());

create policy profiles_update_own on profiles
  for update
  using (id = auth.uid());

-- debts, goals, budgets: entidades familiares, sin privacidad individual —
-- cualquier miembro las ve y las administra. Ninguna fila existe sin family_id,
-- así que no hace falta una rama "propio" como en transactions.
create policy debts_family on debts
  for all
  using (family_id = public.my_family_id())
  with check (family_id = public.my_family_id());

create policy goals_family on goals
  for all
  using (family_id = public.my_family_id())
  with check (family_id = public.my_family_id());

create policy budgets_family on budgets
  for all
  using (family_id = public.my_family_id())
  with check (family_id = public.my_family_id());

-- transactions: el modelo híbrido. Lo propio, siempre; lo ajeno, solo si
-- quien lo cargó lo marcó como compartido y somos de la misma familia — y
-- eso sin permiso de escritura: mirar sí, tocar no.
create policy tx_owner on transactions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy tx_family_read on transactions
  for select
  using (
    shared
    and family_id is not null
    and family_id = public.my_family_id()
  );

-- units, lessons: contenido educativo de lectura pública (para cualquier
-- usuario autenticado), sin escritura desde el cliente — se administra aparte.
create policy units_read on units
  for select
  using (auth.role() = 'authenticated');

create policy lessons_read on lessons
  for select
  using (auth.role() = 'authenticated');

-- lesson_progress: privado, cada quien ve y registra el propio.
create policy lesson_progress_own on lesson_progress
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- invitations: la ve quien la mandó o a quien está dirigida (por email); solo
-- quien la recibe puede cambiar su estado (aceptar/rechazar).
--
-- El email sale de auth.jwt(), no de una consulta a auth.users: esa tabla no
-- es legible por el rol `authenticated` en Supabase (solo supabase_auth_admin
-- y service_role), así que una subconsulta contra ella falla en runtime.
-- auth.jwt() lee los claims de la sesión actual sin tocar la tabla.
create policy invitations_read on invitations
  for select
  using (
    from_user_id = auth.uid()
    or to_email = (auth.jwt() ->> 'email')
  );

create policy invitations_create on invitations
  for insert
  with check (from_user_id = auth.uid());

create policy invitations_respond on invitations
  for update
  using (to_email = (auth.jwt() ->> 'email'));
