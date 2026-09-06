-- XP, racha y logros se calculan en el servidor, no en el cliente.
--
-- La política profiles_update_own (fase 2) permite a cada usuario editar
-- cualquier columna de su propia fila, xp incluido: sin esto, cualquiera
-- podría escribirse el nivel que quiera con una llamada REST directa. Los
-- triggers de abajo son la única vía real para que xp/streak avancen.

create table user_achievements (
  user_id        uuid not null references profiles (id) on delete cascade,
  achievement_id text not null,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table user_achievements enable row level security;

-- Solo lectura desde el cliente: nadie inserta acá directo, solo los
-- triggers (corren security definer, se saltan RLS).
create policy user_achievements_read on user_achievements
  for select
  using (user_id = auth.uid());

create function public.apply_transaction_rewards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  xp_gain    integer := case new.type
                           when 'ingreso' then 5
                           when 'ahorro' then 10
                           when 'pago_deuda' then 10
                           else 0
                         end;
  prev_last_active date;
  prev_streak       integer;
  new_streak        integer;
  is_first_tx       boolean;
begin
  select last_active, streak into prev_last_active, prev_streak
  from public.profiles where id = new.user_id;

  -- La racha se cuenta contra el día real (current_date), no contra la
  -- fecha del movimiento — de lo contrario cargar un gasto de la semana
  -- pasada podría inflar o resetear la racha de hoy.
  if prev_last_active = current_date then
    new_streak := coalesce(prev_streak, 0);
  elsif prev_last_active = current_date - 1 then
    new_streak := coalesce(prev_streak, 0) + 1;
  else
    new_streak := 1;
  end if;

  update public.profiles
  set xp = xp + xp_gain,
      streak = new_streak,
      last_active = current_date
  where id = new.user_id;

  is_first_tx := not exists (
    select 1 from public.transactions
    where user_id = new.user_id and id <> new.id
  );

  if is_first_tx then
    insert into public.user_achievements (user_id, achievement_id)
    values (new.user_id, 'first_tx')
    on conflict do nothing;
  end if;

  if new_streak >= 7 then
    insert into public.user_achievements (user_id, achievement_id)
    values (new.user_id, 'week_streak')
    on conflict do nothing;
  end if;

  if new.type = 'ahorro' then
    insert into public.user_achievements (user_id, achievement_id)
    values (new.user_id, 'saver')
    on conflict do nothing;
  end if;

  if new.type = 'pago_deuda' then
    insert into public.user_achievements (user_id, achievement_id)
    values (new.user_id, 'debt_slayer')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_transaction_insert_rewards
  after insert on transactions
  for each row
  execute function public.apply_transaction_rewards();

-- El catálogo de lecciones todavía vive hardcodeado en el cliente
-- (src/lib/ffos/gamification.ts), no en la tabla `lessons` — esa migra en
-- la fase de contenido editable. Hasta entonces, lesson_progress se
-- identifica por el id de texto del catálogo ("intro", "snowball", ...) y
-- el xp otorgado viaja en la propia fila en vez de salir de un join contra
-- una tabla vacía. Es una confianza más laxa que la de transactions (acá
-- el cliente sí declara cuánto xp vale la lección), aceptable porque el
-- catálogo es fijo y no editable por el usuario — se endurece del todo
-- cuando `lessons` pase a ser la fuente real de contenido.
alter table lesson_progress
  drop constraint lesson_progress_lesson_id_fkey,
  alter column lesson_id type text,
  add column xp integer not null default 25 check (xp > 0);

create function public.apply_lesson_rewards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first_lesson boolean;
begin
  update public.profiles
  set xp = xp + new.xp
  where id = new.user_id;

  is_first_lesson := not exists (
    select 1 from public.lesson_progress
    where user_id = new.user_id and lesson_id <> new.lesson_id
  );

  if is_first_lesson then
    insert into public.user_achievements (user_id, achievement_id)
    values (new.user_id, 'first_lesson')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_lesson_progress_insert_rewards
  after insert on lesson_progress
  for each row
  execute function public.apply_lesson_rewards();

-- La política profiles_update_own solo restringe la FILA (id = auth.uid()),
-- no la columna: sin esto, un PATCH directo a /rest/v1/profiles con
-- {"xp": 999999} pasa la política igual, porque touchea la fila correcta.
-- PostgREST respeta los grants de columna de Postgres además de RLS, así
-- que revocar el UPDATE amplio y regrantear solo display_name deja xp,
-- streak, last_active y family_id escribibles únicamente por funciones
-- security definer (los triggers de arriba, y más adelante la Edge
-- Function de unirse a familia) — nunca por una fila del cliente.
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;
