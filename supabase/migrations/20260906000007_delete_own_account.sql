-- Google Play exige un camino DENTRO de la app para pedir el borrado de la
-- cuenta, no alcanza con "escribinos un mail" — ver el checklist de
-- publicación. Se resuelve con una función, no con una Edge Function: no
-- hay forma de invocar la API de administración de Auth (que sí permite
-- borrar un usuario) desde plpgsql, pero si la función corre como el rol
-- que posee el esquema `auth`, puede borrar la fila directamente de
-- auth.users — y esa fila cascadea a profiles, transactions, sesiones, etc.
--
-- El único caso especial: si quien se borra administra una familia con
-- otros miembros, transferir la administración a otro miembro ANTES de
-- borrar — si no, la fila de families se borra en cascada (owner_id
-- referencia auth.users on delete cascade) y esos miembros pierden sus
-- presupuestos/deudas/metas sin haber pedido nada.
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_family_id uuid;
  v_new_owner uuid;
begin
  if v_uid is null then
    raise exception 'No hay sesión activa';
  end if;

  select family_id into v_family_id from profiles where id = v_uid;

  if v_family_id is not null and exists (
    select 1 from families where id = v_family_id and owner_id = v_uid
  ) then
    select id into v_new_owner
    from profiles
    where family_id = v_family_id and id <> v_uid
    limit 1;

    if v_new_owner is not null then
      update families set owner_id = v_new_owner where id = v_family_id;
    end if;
    -- Si v_new_owner es null, sos el único miembro: la familia se borra
    -- en cascada con vos, no queda nadie a quien afectarle nada.
  end if;

  delete from auth.users where id = v_uid;
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
