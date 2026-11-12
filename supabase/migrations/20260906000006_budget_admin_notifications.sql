-- Hasta ahora un presupuesto era una sola línea familiar sin dueño: cualquier
-- miembro la creaba, editaba o borraba, y "controlar el gasto de todos" no
-- existía — cada quien solo veía su propio gasto reflejado en la barra.
--
-- Esto agrega: quién administra cada línea de presupuesto, cuánto le
-- reparte a cada miembro de la familia, y un aviso al administrador cuando
-- alguien cruza su cupo — igual que el resto del proyecto, sin un campo
-- "spent" guardado a mano: el gasto de cada miembro sigue derivándose de
-- transactions por categoría, ahora también filtrado por user_id.

alter table budgets add column created_by uuid references profiles (id) on delete set null;

-- Backfill: los presupuestos ya existentes no tenían administrador. El dueño
-- de la familia es la mejor aproximación disponible — no hay created_at en
-- esta tabla para inferir "quién la cargó primero".
update budgets b
set created_by = f.owner_id
from families f
where b.family_id = f.id
  and b.created_by is null;

alter table budgets alter column created_by set default auth.uid();

-- Cuánto de una línea de presupuesto le corresponde a cada miembro. Sin
-- fila acá, esa línea sigue siendo "compartida sin repartir" (comportamiento
-- de antes de esta migración).
create table budget_allocations (
  id              uuid primary key default gen_random_uuid(),
  budget_id       uuid not null references budgets (id) on delete cascade,
  user_id         uuid not null references profiles (id) on delete cascade,
  allocated_cents bigint not null check (allocated_cents >= 0),
  unique (budget_id, user_id)
);

alter table budget_allocations enable row level security;

create policy budget_allocations_read on budget_allocations
  for select
  using (
    exists (
      select 1 from budgets b
      where b.id = budget_allocations.budget_id
        and b.family_id = public.my_family_id()
    )
  );

-- Solo quien administra el presupuesto reparte sus cupos — "gestionar el
-- control de gastos de todos" es del administrador, no de cualquier miembro.
create policy budget_allocations_manage on budget_allocations
  for all
  using (
    exists (select 1 from budgets b where b.id = budget_allocations.budget_id and b.created_by = auth.uid())
  )
  with check (
    exists (select 1 from budgets b where b.id = budget_allocations.budget_id and b.created_by = auth.uid())
  );

-- Antes cualquier miembro de la familia podía editar o borrar cualquier
-- línea de presupuesto. Ahora leer sigue siendo de toda la familia, pero
-- administrar (editar el monto, borrar, repartir) es solo de quien la creó.
drop policy budgets_family on budgets;

create policy budgets_read on budgets
  for select
  using (family_id = public.my_family_id());

create policy budgets_insert on budgets
  for insert
  with check (family_id = public.my_family_id() and created_by = auth.uid());

create policy budgets_update on budgets
  for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid() and family_id = public.my_family_id());

create policy budgets_delete on budgets
  for delete
  using (created_by = auth.uid());

-- Avisos dirigidos a un usuario puntual — hoy solo "budget_alert", deja
-- lugar a otros tipos sin cambiar de forma. Nadie inserta desde el cliente,
-- solo el trigger de abajo (security definer, se salta RLS) — mismo patrón
-- que user_achievements.
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on notifications (user_id) where read_at is null;

alter table notifications enable row level security;

create policy notifications_read on notifications
  for select
  using (user_id = auth.uid());

create policy notifications_mark_read on notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Se dispara al cruzar el 90% (aviso) o el 100% (agotado) del cupo asignado
-- a ESE miembro en ESE mes — comparando el estado antes/después de esta
-- transacción, así solo avisa una vez por umbral, no en cada gasto siguiente.
create function public.notify_budget_admin_on_overspend()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  b               record;
  new_spent_cents bigint;
  prev_spent_cents bigint;
begin
  if new.type <> 'gasto' or new.family_id is null then
    return new;
  end if;

  for b in
    select bud.id, bud.name, bud.created_by, ba.allocated_cents
    from budgets bud
    join budget_allocations ba on ba.budget_id = bud.id and ba.user_id = new.user_id
    where bud.family_id = new.family_id
      and bud.name = new.category
      and bud.created_by is not null
      and bud.created_by <> new.user_id -- nadie se notifica a sí mismo
      and ba.allocated_cents > 0
  loop
    select coalesce(sum(t.amount_cents), 0) into new_spent_cents
    from transactions t
    where t.user_id = new.user_id
      and t.category = b.name
      and t.type = 'gasto'
      and date_trunc('month', t.occurred_on) = date_trunc('month', new.occurred_on);

    prev_spent_cents := new_spent_cents - new.amount_cents;

    if prev_spent_cents < b.allocated_cents and new_spent_cents >= b.allocated_cents then
      insert into notifications (user_id, type, payload)
      values (
        b.created_by,
        'budget_alert',
        jsonb_build_object(
          'level', 'over',
          'budgetId', b.id,
          'budgetName', b.name,
          'memberId', new.user_id,
          'allocatedCents', b.allocated_cents,
          'spentCents', new_spent_cents
        )
      );
    elsif prev_spent_cents * 10 < b.allocated_cents * 9 and new_spent_cents * 10 >= b.allocated_cents * 9 then
      insert into notifications (user_id, type, payload)
      values (
        b.created_by,
        'budget_alert',
        jsonb_build_object(
          'level', 'warning',
          'budgetId', b.id,
          'budgetName', b.name,
          'memberId', new.user_id,
          'allocatedCents', b.allocated_cents,
          'spentCents', new_spent_cents
        )
      );
    end if;
  end loop;

  return new;
end;
$$;

create trigger on_transaction_insert_notify_budget
  after insert on transactions
  for each row
  execute function public.notify_budget_admin_on_overspend();
