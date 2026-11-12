-- Fase 6: el catálogo de lecciones pasa de vivir hardcodeado en el cliente
-- (src/lib/ffos/gamification.ts) a las tablas `units`/`lessons`, tal como
-- preveía el comentario en 20260906000003. Esto cierra la confianza más
-- laxa que quedaba pendiente ahí: el xp de una lección lo va a calcular
-- el servidor leyendo `lessons.xp`, no un valor que declara el cliente.

alter table lessons add column slug text;

do $$
declare
  v_unit_id uuid;
begin
  insert into units (title, display_order)
  values ('Fundamentos de finanzas personales', 0)
  returning id into v_unit_id;

  insert into lessons (unit_id, display_order, min_level, slug, title, body, question, options, answer, xp)
  values
    (v_unit_id, 0, 1, 'intro', 'Presupuesto 0-base',
     'Asigná cada peso antes de gastarlo: todo ingreso tiene un destino definido de antemano.',
     '¿Cuál es la regla principal del presupuesto 0-base?',
     '["Gastar lo menos posible", "Asignar cada peso antes de gastarlo", "Ahorrar el 50% del ingreso"]'::jsonb,
     1, 25),
    (v_unit_id, 1, 1, 'needs_wants', 'Necesidades vs deseos',
     'Separar los gastos fijos e indispensables de los discrecionales ordena cualquier presupuesto.',
     '¿El streaming de series es una necesidad o un deseo?',
     '["Necesidad", "Deseo", "Ninguna de las dos"]'::jsonb,
     1, 25),
    (v_unit_id, 2, 1, 'emergency', 'Fondo de emergencia',
     'El objetivo es cubrir entre 3 y 6 meses de gastos fijos antes de pensar en invertir.',
     '¿Cuántos meses de gastos cubre un fondo de emergencia básico?',
     '["1 mes", "3 a 6 meses", "12 meses"]'::jsonb,
     1, 25),
    (v_unit_id, 3, 2, 'savings_basics', 'Ahorro básico',
     'Pagate a vos primero: separá el ahorro apenas entra el ingreso, no con lo que sobra a fin de mes.',
     '¿Cuándo conviene apartar el ahorro?',
     '["Al final del mes", "Al principio del mes", "Solo cuando sobra dinero"]'::jsonb,
     1, 25),
    (v_unit_id, 4, 2, 'credit_cards', 'Tarjetas de crédito',
     'Una tarjeta es una herramienta de pago, no una extensión del ingreso mensual.',
     '¿Cuándo conviene usar la tarjeta de crédito?',
     '["Siempre que se pueda", "Solo si se paga el total al vencimiento", "Solo en emergencias sin plan de pago"]'::jsonb,
     1, 25),
    (v_unit_id, 5, 3, 'bank_credit', 'Créditos bancarios',
     'Antes de firmar hay que comparar tasa, plazo y seguros incluidos: eso define el costo real del crédito.',
     '¿Qué hay que comparar entre créditos?',
     '["Solo el monto de la cuota", "Tasa, plazo y seguros", "Solo el banco que lo ofrece"]'::jsonb,
     1, 25),
    (v_unit_id, 6, 3, 'debt_order', 'Orden de ataque de deudas',
     'El método avalancha prioriza pagar primero la deuda con la tasa de interés más alta.',
     '¿En qué consiste el método avalancha?',
     '["Pagar primero la deuda más chica", "Pagar primero la deuda con mayor tasa", "Pagar primero la deuda más antigua"]'::jsonb,
     1, 25),
    (v_unit_id, 7, 4, 'snowball', 'Bola de nieve',
     'El método bola de nieve paga primero la deuda más chica para generar impulso psicológico.',
     '¿En qué se basa el método bola de nieve?',
     '["Mayor tasa primero", "Deuda más chica primero", "Deuda más antigua primero"]'::jsonb,
     1, 25),
    (v_unit_id, 8, 4, 'investing_101', 'Inversión 101',
     'El orden correcto es: fondo de emergencia, luego deuda de alta tasa, recién después invertir.',
     '¿Qué va primero, antes de empezar a invertir?',
     '["Invertir apenas se pueda", "Fondo de emergencia y deudas caras", "Comprar lo que se venía posponiendo"]'::jsonb,
     1, 25);
end $$;

alter table lessons alter column slug set not null;
alter table lessons add constraint lessons_slug_key unique (slug);

-- lesson_progress traía el id de texto del catálogo viejo ("intro", ...).
-- Lo que no matchea contra el nuevo catálogo es de un ambiente de prueba
-- sin datos reales que proteger — se descarta en vez de migrarse a ciegas.
delete from lesson_progress where lesson_id not in (select slug from lessons);

update lesson_progress lp
set lesson_id = l.id::text
from lessons l
where l.slug = lp.lesson_id;

alter table lesson_progress drop column xp;
alter table lesson_progress alter column lesson_id type uuid using lesson_id::uuid;
alter table lesson_progress
  add constraint lesson_progress_lesson_id_fkey
  foreign key (lesson_id) references lessons (id) on delete cascade;

-- El xp ya no lo declara el cliente (columna eliminada arriba): sale de
-- `lessons.xp`, la misma fuente que ahora también sirve el catálogo.
create or replace function public.apply_lesson_rewards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first_lesson boolean;
  lesson_xp       integer;
begin
  select xp into lesson_xp from public.lessons where id = new.lesson_id;

  update public.profiles
  set xp = xp + coalesce(lesson_xp, 0)
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
