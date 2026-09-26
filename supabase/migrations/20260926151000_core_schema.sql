-- Fase 1: basisschema.
-- Eén bedrijf, meerdere gebruikers met een rol (zie docs/beslissingen/003-gebruikers-en-rollen.md).
-- Bedragen in eurocent, percentages in basispunten (zie docs/beslissingen/001-geld-in-centen.md).

-- ---------------------------------------------------------------------------
-- Private schema: helpers die niet via de API bereikbaar zijn
-- ---------------------------------------------------------------------------

create schema private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('owner', 'admin');
create type public.customer_type as enum ('private', 'business');
create type public.job_status as enum ('planned', 'active', 'done', 'cancelled');
-- per_km: km × tarief, flat: vast bedrag per rit, included: niet apart aangerekend
create type public.travel_method as enum ('per_km', 'flat', 'included');

-- ---------------------------------------------------------------------------
-- Gebruikers en rollen
-- ---------------------------------------------------------------------------

create table public.app_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  display_name text not null check (length(trim(display_name)) > 0),
  created_at timestamptz not null default now()
);

create function private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_member() from public;
grant execute on function private.is_member() to authenticated;

-- Beheer: een uitgenodigde gebruiker een rol geven. Enkel uit te voeren in de
-- SQL-editor van Supabase (als postgres), niet via de API. Zie docs/BEHEER.md.
create function private.add_app_user(
  user_email text,
  user_role public.app_role,
  user_display_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_user_id uuid;
begin
  select id into found_user_id from auth.users where lower(email) = lower(trim(user_email));
  if found_user_id is null then
    raise exception 'Geen gebruiker gevonden met e-mailadres %. Nodig die eerst uit.', user_email;
  end if;

  insert into public.app_users (user_id, role, display_name)
  values (found_user_id, user_role, user_display_name)
  on conflict (user_id) do update
    set role = excluded.role, display_name = excluded.display_name;
end;
$$;

revoke all on function private.add_app_user(text, public.app_role, text) from public;

-- ---------------------------------------------------------------------------
-- Algemene triggers: updated_at en logboek
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id text not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index audit_log_row_idx on public.audit_log (table_name, row_id);
create index audit_log_changed_at_idx on public.audit_log (changed_at desc);

create function private.log_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  changed_row jsonb := coalesce(new_row, old_row);
begin
  insert into public.audit_log (table_name, row_id, action, old_data, new_data, changed_by)
  values (
    tg_table_name,
    coalesce(changed_row ->> 'id', changed_row ->> 'user_id'),
    lower(tg_op),
    old_row,
    new_row,
    (select auth.uid())
  );
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Instellingen (één rij) en uurtarieven
-- ---------------------------------------------------------------------------

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  company_name text not null default '',
  vat_number text,
  address_line text,
  postal_code text,
  city text,
  email text,
  phone text,
  iban text,
  travel_method public.travel_method not null default 'per_km',
  km_rate_cents integer not null default 0 check (km_rate_cents >= 0),
  trip_flat_cents integer not null default 0 check (trip_flat_cents >= 0),
  material_margin_bp integer not null default 0 check (material_margin_bp between 0 and 100000),
  vat_rate smallint not null default 21 check (vat_rate in (0, 6, 12, 21)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.settings default values;

create table public.hourly_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  rate_cents integer not null check (rate_cents >= 0),
  is_default boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not (is_default and archived_at is not null))
);

-- Hoogstens één standaardtarief.
create unique index hourly_rates_one_default_idx on public.hourly_rates (is_default) where is_default;

-- ---------------------------------------------------------------------------
-- Klanten en jobs
-- Lege override-kolommen (null) betekenen: gebruik de waarde van het niveau erboven
-- (regel > job > klant > instellingen).
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  type public.customer_type not null,
  name text not null check (length(trim(name)) > 0),
  vat_number text,
  email text,
  phone text,
  address_line text,
  postal_code text,
  city text,
  country text not null default 'BE' check (length(country) = 2),
  travel_method public.travel_method,
  km_rate_cents integer check (km_rate_cents >= 0),
  trip_flat_cents integer check (trip_flat_cents >= 0),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  description text,
  address_line text,
  postal_code text,
  city text,
  status public.job_status not null default 'planned',
  starts_on date,
  ends_on date,
  hourly_rate_id uuid references public.hourly_rates (id) on delete restrict,
  travel_method public.travel_method,
  km_rate_cents integer check (km_rate_cents >= 0),
  trip_flat_cents integer check (trip_flat_cents >= 0),
  material_margin_bp integer check (material_margin_bp between 0 and 100000),
  vat_rate smallint check (vat_rate in (0, 6, 12, 21)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

create index jobs_customer_id_idx on public.jobs (customer_id);
create index jobs_status_idx on public.jobs (status);

-- ---------------------------------------------------------------------------
-- Uren
-- Het uurtarief wordt vastgelegd op het moment van registreren, zodat latere
-- tariefwijzigingen oude registraties niet veranderen.
-- ---------------------------------------------------------------------------

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete restrict,
  user_id uuid not null default auth.uid() references auth.users (id) on delete restrict,
  hourly_rate_id uuid references public.hourly_rates (id) on delete set null,
  hourly_rate_cents integer not null check (hourly_rate_cents >= 0),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at)
);

create index time_entries_job_id_idx on public.time_entries (job_id);
create index time_entries_started_at_idx on public.time_entries (started_at desc);

-- Per gebruiker kan er maar één klok tegelijk lopen.
create unique index time_entries_one_running_idx on public.time_entries (user_id)
  where ended_at is null;

-- ---------------------------------------------------------------------------
-- Materiaal
-- Prijs per verpakking en aantal per verpakking worden allebei bewaard; de prijs
-- per stuk wordt berekend (src/lib/money.ts). Hoeveelheden tot 3 decimalen.
-- ---------------------------------------------------------------------------

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  unit text not null check (length(trim(unit)) > 0),
  package_price_cents integer not null check (package_price_cents >= 0),
  units_per_package numeric(12, 3) not null check (units_per_package > 0),
  margin_bp integer check (margin_bp between 0 and 100000),
  supplier text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Verbruik per job. Naam en prijzen worden gekopieerd uit de catalogus, zodat
-- een latere prijswijziging oude jobs niet verandert.
create table public.material_usages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete restrict,
  material_id uuid references public.materials (id) on delete set null,
  description text not null check (length(trim(description)) > 0),
  unit text not null check (length(trim(unit)) > 0),
  package_price_cents integer not null check (package_price_cents >= 0),
  units_per_package numeric(12, 3) not null check (units_per_package > 0),
  quantity numeric(12, 3) not null check (quantity > 0),
  margin_bp integer not null check (margin_bp between 0 and 100000),
  used_on date not null default current_date,
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index material_usages_job_id_idx on public.material_usages (job_id);

-- ---------------------------------------------------------------------------
-- Verplaatsingen
-- ---------------------------------------------------------------------------

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete restrict,
  trip_date date not null default current_date,
  method public.travel_method not null check (method in ('per_km', 'flat')),
  distance_km numeric(8, 1) check (distance_km > 0),
  -- per_km: tarief per km, flat: bedrag van de rit
  rate_cents integer not null check (rate_cents >= 0),
  note text,
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (method = 'per_km' and distance_km is not null)
    or (method = 'flat' and distance_km is null)
  )
);

create index trips_job_id_idx on public.trips (job_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'settings', 'hourly_rates', 'customers', 'jobs',
    'time_entries', 'materials', 'material_usages', 'trips'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function private.set_updated_at()',
      table_name
    );
  end loop;

  foreach table_name in array array[
    'app_users', 'settings', 'hourly_rates', 'customers', 'jobs',
    'time_entries', 'materials', 'material_usages', 'trips'
  ]
  loop
    execute format(
      'create trigger log_insert_delete after insert or delete on public.%I
         for each row execute function private.log_change()',
      table_name
    );
    execute format(
      'create trigger log_update after update on public.%I
         for each row when (old is distinct from new) execute function private.log_change()',
      table_name
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Enkel leden (app_users) hebben toegang. Anonieme bezoekers krijgen niets.
-- ---------------------------------------------------------------------------

alter table public.app_users enable row level security;
alter table public.audit_log enable row level security;
alter table public.settings enable row level security;
alter table public.hourly_rates enable row level security;
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.time_entries enable row level security;
alter table public.materials enable row level security;
alter table public.material_usages enable row level security;
alter table public.trips enable row level security;

revoke all on
  public.app_users, public.audit_log, public.settings, public.hourly_rates,
  public.customers, public.jobs, public.time_entries, public.materials,
  public.material_usages, public.trips
from anon;

-- Rollen, logboek en de instellingenrij worden nooit via de API aangemaakt of
-- verwijderd. Rechten afnemen geeft een duidelijke fout in plaats van stil niets doen.
revoke insert, update, delete, truncate on public.app_users, public.audit_log from authenticated;
revoke insert, delete, truncate on public.settings from authenticated;

-- Alleen lezen: rollen en logboek worden nooit via de API gewijzigd.
create policy "members can read app users" on public.app_users
  for select to authenticated using ((select private.is_member()));

create policy "members can read audit log" on public.audit_log
  for select to authenticated using ((select private.is_member()));

-- Instellingen: één rij, enkel lezen en wijzigen.
create policy "members can read settings" on public.settings
  for select to authenticated using ((select private.is_member()));

create policy "members can update settings" on public.settings
  for update to authenticated
  using ((select private.is_member()))
  with check ((select private.is_member()));

-- Bedrijfsgegevens: leden hebben volledige toegang.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hourly_rates', 'customers', 'jobs', 'time_entries',
    'materials', 'material_usages', 'trips'
  ]
  loop
    execute format(
      'create policy "members have full access" on public.%I
         for all to authenticated
         using ((select private.is_member()))
         with check ((select private.is_member()))',
      table_name
    );
  end loop;
end;
$$;
