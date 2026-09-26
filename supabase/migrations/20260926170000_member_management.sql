-- Gebruikersbeheer vanuit de app. Eigenaar en admin mogen leden toevoegen, wijzigen en
-- verwijderen. Niemand kan zijn eigen rol wijzigen of zichzelf verwijderen, zodat je
-- jezelf niet per ongeluk buitensluit. Wijzigingen komen via de triggers in audit_log,
-- met de ingelogde gebruiker als changed_by.

create function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users
    where user_id = (select auth.uid()) and role in ('owner', 'admin')
  );
$$;

revoke all on function private.is_manager() from public;
grant execute on function private.is_manager() to authenticated;

create function private.require_manager()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_manager() then
    raise exception 'Enkel de eigenaar of een admin kan gebruikers beheren.'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.require_manager() from public;

-- Leden met hun e-mailadres (dat staat in auth.users, niet bereikbaar via de API).
create function public.list_members()
returns table (
  user_id uuid,
  email text,
  role public.app_role,
  display_name text,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_member() then
    raise exception 'Geen toegang.' using errcode = '42501';
  end if;

  return query
    select m.user_id, u.email::text, m.role, m.display_name, u.last_sign_in_at
    from public.app_users m
    join auth.users u on u.id = m.user_id
    order by m.display_name;
end;
$$;

-- Een bestaand account (aangemaakt door de app via de Auth-API) lid maken.
create function public.add_member(
  member_email text,
  member_role public.app_role,
  member_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_user_id uuid;
begin
  perform private.require_manager();

  select id into found_user_id from auth.users where lower(email) = lower(trim(member_email));
  if found_user_id is null then
    raise exception 'Geen account gevonden voor %.', member_email using errcode = 'P0002';
  end if;

  if exists (select 1 from public.app_users where user_id = found_user_id) then
    raise exception '% is al lid.', member_email using errcode = '23505';
  end if;

  insert into public.app_users (user_id, role, display_name)
  values (found_user_id, member_role, trim(member_display_name));

  return found_user_id;
end;
$$;

create function public.update_member(
  target_user_id uuid,
  member_role public.app_role,
  member_display_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_manager();

  if target_user_id = (select auth.uid())
    and member_role is distinct from (
      select role from public.app_users where user_id = target_user_id
    )
  then
    raise exception 'Je kan je eigen rol niet wijzigen.' using errcode = '42501';
  end if;

  update public.app_users
  set role = member_role, display_name = trim(member_display_name)
  where user_id = target_user_id;

  if not found then
    raise exception 'Lid niet gevonden.' using errcode = 'P0002';
  end if;
end;
$$;

create function public.remove_member(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_manager();

  if target_user_id = (select auth.uid()) then
    raise exception 'Je kan jezelf niet verwijderen.' using errcode = '42501';
  end if;

  delete from public.app_users where user_id = target_user_id;

  if not found then
    raise exception 'Lid niet gevonden.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.list_members() from public, anon;
revoke all on function public.add_member(text, public.app_role, text) from public, anon;
revoke all on function public.update_member(uuid, public.app_role, text) from public, anon;
revoke all on function public.remove_member(uuid) from public, anon;

grant execute on function public.list_members() to authenticated;
grant execute on function public.add_member(text, public.app_role, text) to authenticated;
grant execute on function public.update_member(uuid, public.app_role, text) to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;
