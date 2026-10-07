-- FFOS Wallet — esquema base.
-- Montos en centavos enteros (bigint) para no arrastrar errores de redondeo;
-- la capa de cliente los convierte a la unidad monetaria completa para mostrar.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create type tx_type as enum ('ingreso', 'gasto', 'pago_deuda', 'ahorro');
create type invitation_status as enum ('pending', 'accepted', 'rejected');

create table families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null unique,
  owner_id   uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 1 a 1 con auth.users. El trigger handle_new_user() (ver abajo) crea esta
-- fila automáticamente al registrarse — el cliente nunca hace ese insert.
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  family_id    uuid references families (id) on delete set null,
  xp           integer not null default 0 check (xp >= 0),
  streak       integer not null default 0 check (streak >= 0),
  last_active  date
);

-- Deudas: entidad familiar (no privada), como los presupuestos y las metas.
create table debts (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families (id) on delete cascade,
  name            text not null,
  principal_cents bigint not null check (principal_cents > 0),
  annual_rate     numeric(5, 2) check (annual_rate >= 0),
  minimum_cents   bigint check (minimum_cents >= 0),
  created_at      timestamptz not null default now()
);

-- Metas de ahorro, también familiares. Lo ahorrado se deriva de las
-- transacciones enlazadas (goal_id), nunca se guarda como contador aparte —
-- mismo principio que budgets.spent: un número guardado a mano diverge del
-- dato real en cuanto hay uso, como pasaba en el estado local actual.
create table goals (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families (id) on delete cascade,
  name          text not null,
  target_cents  bigint not null check (target_cents > 0),
  due_date      date,
  created_at    timestamptz not null default now()
);

create table transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,
  family_id    uuid references families (id) on delete set null,
  -- Un pago de deuda referencia la deuda que amortiza y un ahorro puede
  -- referenciar una meta: así el saldo pendiente y el progreso de la meta
  -- se calculan siempre, en vez de ser un número que alguien puede desincronizar.
  debt_id      uuid references debts (id) on delete set null,
  goal_id      uuid references goals (id) on delete set null,
  type         tx_type not null,
  category     text not null,
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on  date not null,
  note         text,
  shared       boolean not null default false,
  created_at   timestamptz not null default now()
);

create index transactions_user_date_idx on transactions (user_id, occurred_on desc);
create index transactions_family_shared_idx on transactions (family_id) where shared;
create index transactions_debt_idx on transactions (debt_id) where debt_id is not null;
create index transactions_goal_idx on transactions (goal_id) where goal_id is not null;

-- Presupuestos: siempre familiares. Igual que goals, "spent" no es columna:
-- se deriva sumando transactions por categoría/rango de fecha desde el cliente.
create table budgets (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families (id) on delete cascade,
  name          text not null,
  bucket        text not null, -- 'Fijos' | 'Variables' | 'Discrecional' | 'Ahorro' | ...
  planned_cents bigint not null check (planned_cents >= 0)
);

-- Contenido educativo — de lectura pública, sin escritura desde el cliente.
-- Se puebla vía consola de Supabase o un script propio, no desde la app.
create table units (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  display_order integer not null default 0
);

create table lessons (
  id            uuid primary key default gen_random_uuid(),
  unit_id       uuid not null references units (id) on delete cascade,
  display_order integer not null default 0,
  min_level     integer not null default 1,
  title         text not null,
  body          text not null,
  question      text not null,
  options       jsonb not null,
  answer        integer not null,
  xp            integer not null default 25 check (xp > 0)
);

create table lesson_progress (
  user_id      uuid not null references profiles (id) on delete cascade,
  lesson_id    uuid not null references lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- Invitación dirigida a otro usuario de la app (además del código de familia,
-- que no necesita tabla propia: se valida en la Edge Function de la fase de
-- Familia, contra families.code, usando el rol de servicio).
create table invitations (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families (id) on delete cascade,
  from_user_id uuid not null references profiles (id) on delete cascade,
  to_email     text not null,
  status       invitation_status not null default 'pending',
  created_at   timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse — el cliente nunca inserta
-- en profiles directamente.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
