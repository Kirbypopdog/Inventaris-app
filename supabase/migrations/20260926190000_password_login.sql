-- Aanmelden met e-mail en wachtwoord (zie docs/beslissingen/005-aanmelden-met-wachtwoord.md).
-- Een lid met een tijdelijk wachtwoord (nieuw, of gereset door een beheerder) moet bij
-- het aanmelden eerst een eigen wachtwoord kiezen.

alter table public.app_users
  add column must_change_password boolean not null default false;

-- Nieuwe leden krijgen een tijdelijk wachtwoord van de beheerder.
create or replace function public.add_member(
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

  insert into public.app_users (user_id, role, display_name, must_change_password)
  values (found_user_id, member_role, trim(member_display_name), true);

  return found_user_id;
end;
$$;

-- De ledenlijst toont ook wie nog een eigen wachtwoord moet kiezen.
drop function public.list_members();

create function public.list_members()
returns table (
  user_id uuid,
  email text,
  role public.app_role,
  display_name text,
  must_change_password boolean,
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
    select m.user_id, u.email::text, m.role, m.display_name, m.must_change_password,
      u.last_sign_in_at
    from public.app_users m
    join auth.users u on u.id = m.user_id
    order by m.display_name;
end;
$$;

-- Een beheerder geeft een ander lid een nieuw tijdelijk wachtwoord. De app roept dit op
-- vóór het wachtwoord met de geheime sleutel gewijzigd wordt: zo controleert de database
-- eerst de rechten.
create function public.require_password_change(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_manager();

  if target_user_id = (select auth.uid()) then
    raise exception 'Wijzig je eigen wachtwoord via Wachtwoord wijzigen.' using errcode = '42501';
  end if;

  update public.app_users set must_change_password = true where user_id = target_user_id;

  if not found then
    raise exception 'Lid niet gevonden.' using errcode = 'P0002';
  end if;
end;
$$;

-- Na het kiezen van een eigen wachtwoord.
create function public.mark_password_changed()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.app_users set must_change_password = false
  where user_id = (select auth.uid());

  if not found then
    raise exception 'Geen toegang.' using errcode = '42501';
  end if;
end;
$$;

-- De allereerste beheerder, aangemaakt door de app bij het opstarten (ADMIN_EMAIL).
-- Doet enkel iets zolang er nog geen enkel lid is, en is enkel uitvoerbaar met de
-- geheime sleutel.
create function public.bootstrap_admin(admin_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_user_id uuid;
begin
  lock table public.app_users in exclusive mode;

  if exists (select 1 from public.app_users) then
    return false;
  end if;

  select id into found_user_id from auth.users where lower(email) = lower(trim(admin_email));
  if found_user_id is null then
    raise exception 'Geen account gevonden voor %.', admin_email using errcode = 'P0002';
  end if;

  insert into public.app_users (user_id, role, display_name, must_change_password)
  values (found_user_id, 'admin', 'Beheerder', true);

  return true;
end;
$$;

revoke all on function public.list_members() from public, anon;
revoke all on function public.require_password_change(uuid) from public, anon;
revoke all on function public.mark_password_changed() from public, anon;
revoke all on function public.bootstrap_admin(text) from public, anon, authenticated;

grant execute on function public.list_members() to authenticated;
grant execute on function public.require_password_change(uuid) to authenticated;
grant execute on function public.mark_password_changed() to authenticated;
grant execute on function public.bootstrap_admin(text) to service_role;
