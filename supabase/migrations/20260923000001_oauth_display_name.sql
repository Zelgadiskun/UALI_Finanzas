-- Login con Google: los usuarios OAuth llegan con el nombre en otro campo de
-- metadata, así que handle_new_user() los dejaba con el prefijo del correo como
-- display_name ("percival" en vez de "Percival Zelgado").
--
-- Con email/password el cliente manda options.data.display_name (ver signUp en
-- src/lib/supabase/auth.ts), que cae en raw_user_meta_data->>'display_name'.
-- Google no manda ese campo: manda full_name (y name), y para accounts
-- creados antes de esto el perfil ya quedó mal — de ahí el backfill.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

-- Perfiles ya creados por un login OAuth: el trigger no vuelve a correr, así
-- que se arreglan a mano. Solo toca filas cuyo display_name sea exactamente el
-- prefijo del correo (o sea, las que el trigger viejo generó por descarte) y
-- deja intactos los nombres que alguien escribió al registrarse.
update profiles p
set    display_name = coalesce(
         nullif(u.raw_user_meta_data ->> 'full_name', ''),
         nullif(u.raw_user_meta_data ->> 'name', '')
       )
from   auth.users u
where  u.id = p.id
  and  p.display_name = split_part(u.email, '@', 1)
  and  coalesce(
         nullif(u.raw_user_meta_data ->> 'full_name', ''),
         nullif(u.raw_user_meta_data ->> 'name', ''),
         ''
       ) <> '';
