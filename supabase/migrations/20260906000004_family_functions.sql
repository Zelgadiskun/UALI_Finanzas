-- Familia: crear, unirse por código, invitar e invitación aceptada.
--
-- profiles.family_id solo lo puede escribir un trigger o función security
-- definer desde la fase 3 (el grant de columna solo deja display_name al
-- cliente) — así que unirse a una familia no puede ser un simple UPDATE
-- desde el cliente. En vez de una Edge Function (el plan original lo
-- proponía así, pensando en un runtime Deno separado para desplegar), estas
-- tres funciones de Postgres logran lo mismo: corren con privilegios de
-- servidor, validan la regla de negocio, y son igual de imposibles de
-- saltear desde una llamada REST directa.

create function public.generate_family_code()
returns text
language plpgsql
as $$
declare
  -- Sin 0/O ni 1/I/L: se lee y se tipea en voz alta sin ambigüedad.
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  -- v_code, no "code": una variable local llamada igual que la columna
  -- families.code entra en conflicto (plpgsql.variable_conflict = error
  -- por default) aunque el lado de la columna esté calificado.
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.families where families.code = v_code);
  end loop;
  return v_code;
end;
$$;

create function public.create_family(p_name text)
returns families
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family families;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'El nombre de familia no puede estar vacío';
  end if;

  insert into families (name, code, owner_id)
  values (trim(p_name), generate_family_code(), auth.uid())
  returning * into v_family;

  update profiles set family_id = v_family.id where id = auth.uid();

  return v_family;
end;
$$;

create function public.join_family(p_code text)
returns families
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family families;
begin
  select * into v_family from families where code = upper(trim(p_code));
  if not found then
    raise exception 'Código inválido';
  end if;

  update profiles set family_id = v_family.id where id = auth.uid();

  return v_family;
end;
$$;

create function public.accept_invitation(p_invitation_id uuid)
returns families
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation invitations;
  v_family     families;
  v_my_email   text := auth.jwt() ->> 'email';
begin
  select * into v_invitation from invitations where id = p_invitation_id;
  if not found then
    raise exception 'Invitación no encontrada';
  end if;
  if v_invitation.to_email <> v_my_email then
    raise exception 'Esta invitación no es para tu cuenta';
  end if;
  if v_invitation.status <> 'pending' then
    raise exception 'Esta invitación ya fue respondida';
  end if;

  update invitations set status = 'accepted' where id = p_invitation_id;
  update profiles set family_id = v_invitation.family_id where id = auth.uid();

  select * into v_family from families where id = v_invitation.family_id;
  return v_family;
end;
$$;

grant execute on function public.create_family(text) to authenticated;
grant execute on function public.join_family(text) to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;

-- Denormalizado a propósito: sin esto, alguien con una invitación pendiente
-- no podría ver de qué familia se trata ni quién la mandó, porque
-- families_read/profiles_read exigen ya ser miembro (para leer families) o
-- estar en la misma familia (para leer el perfil del que invita) — y todavía
-- no lo es. Son solo texto informativo: accept_invitation() decide con
-- invitations.family_id, no con estos campos, así que no hay forma de que
-- alguien se cuele en una familia distinta falseándolos.
alter table invitations
  add column family_name       text not null,
  add column from_display_name text not null;
