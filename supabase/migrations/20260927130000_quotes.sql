-- Offertes (fase 2).
-- Een offerte hoort bij een job, heeft een nummer per jaar (OFF-2026-001) en regels met
-- een btw-tarief per regel. Zolang ze een ontwerp is, kan ze aangepast worden; daarna niet
-- meer, tenzij ze eerst terug op ontwerp gezet wordt.

create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected');

-- ---------------------------------------------------------------------------
-- Nummering: één teller per soort document en per jaar. Ook bruikbaar voor facturen.
-- ---------------------------------------------------------------------------

create table public.document_counters (
  kind text not null check (kind in ('quote')),
  year integer not null check (year between 2000 and 2999),
  last_number integer not null check (last_number > 0),
  primary key (kind, year)
);

alter table public.document_counters enable row level security;
revoke all on public.document_counters from anon, authenticated;

-- Het volgende nummer. De upsert vergrendelt de rij, dus twee gelijktijdige aanvragen
-- krijgen nooit hetzelfde nummer.
create function private.next_document_number(document_kind text, document_year integer)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.document_counters (kind, year, last_number)
  values (document_kind, document_year, 1)
  on conflict (kind, year) do update
    set last_number = public.document_counters.last_number + 1
  returning last_number;
$$;

-- Het private schema is niet via de API bereikbaar; create_quote roept dit aan.
revoke all on function private.next_document_number(text, integer) from public, anon;
grant execute on function private.next_document_number(text, integer) to authenticated;

-- Hoe lang een offerte standaard geldig is.
alter table public.settings
  add column quote_validity_days integer not null default 30
    check (quote_validity_days between 1 and 365);

-- ---------------------------------------------------------------------------
-- Offertes en regels
-- ---------------------------------------------------------------------------

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete restrict,
  number text not null unique check (number ~ '^OFF-[0-9]{4}-[0-9]{3,}$'),
  status public.quote_status not null default 'draft',
  quote_date date not null default current_date,
  valid_until date,
  intro text,
  notes text,
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_until >= quote_date)
);

create index quotes_job_id_idx on public.quotes (job_id);

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  description text not null check (length(trim(description)) > 0),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit text not null check (length(trim(unit)) > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  vat_rate smallint not null check (vat_rate in (0, 6, 12, 21)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quote_lines_quote_id_idx on public.quote_lines (quote_id);

-- Een offerte die niet meer in ontwerp is, verandert niet meer: enkel de status mag wijzigen,
-- en verwijderen kan enkel in ontwerp.
create function private.guard_quote()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'Enkel een ontwerp kan verwijderd worden.' using errcode = 'TS006';
    end if;
    return old;
  end if;

  if old.status <> 'draft'
     and (new.job_id, new.number, new.quote_date, new.valid_until, new.intro, new.notes)
         is distinct from
         (old.job_id, old.number, old.quote_date, old.valid_until, old.intro, old.notes) then
    raise exception 'Deze offerte is niet meer in ontwerp.' using errcode = 'TS006';
  end if;
  return new;
end;
$$;

create trigger guard_quote before update or delete on public.quotes
  for each row execute function private.guard_quote();

create function private.guard_quote_line()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  quote_status public.quote_status;
begin
  -- Regels die mee verdwijnen met een (ontwerp)offerte zijn geen probleem.
  select status into quote_status from public.quotes
  where id = coalesce(new.quote_id, old.quote_id);
  if quote_status is not null and quote_status <> 'draft' then
    raise exception 'Deze offerte is niet meer in ontwerp.' using errcode = 'TS006';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger guard_quote_line before insert or update or delete on public.quote_lines
  for each row execute function private.guard_quote_line();

-- Updated_at, logboek en toegang, zoals bij de andere tabellen.
create trigger set_updated_at before update on public.quotes
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.quote_lines
  for each row execute function private.set_updated_at();

create trigger log_insert_delete after insert or delete on public.quotes
  for each row execute function private.log_change();
create trigger log_update after update on public.quotes
  for each row when (old is distinct from new) execute function private.log_change();
create trigger log_insert_delete after insert or delete on public.quote_lines
  for each row execute function private.log_change();
create trigger log_update after update on public.quote_lines
  for each row when (old is distinct from new) execute function private.log_change();

alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;
revoke all on public.quotes, public.quote_lines from anon;

create policy "members have full access" on public.quotes
  for all to authenticated
  using ((select private.is_member()))
  with check ((select private.is_member()));

create policy "members have full access" on public.quote_lines
  for all to authenticated
  using ((select private.is_member()))
  with check ((select private.is_member()));

-- ---------------------------------------------------------------------------
-- Een nieuwe offerte (ontwerp) met het volgende nummer.
-- ---------------------------------------------------------------------------

create function public.create_quote(target_job_id uuid)
returns public.quotes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  quote public.quotes;
  today date := (now() at time zone 'Europe/Brussels')::date;
  validity_days integer;
begin
  if not private.is_member() then
    raise exception 'Geen toegang.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.jobs where id = target_job_id) then
    raise exception 'Job niet gevonden.' using errcode = 'P0002';
  end if;
  select s.quote_validity_days into validity_days from public.settings s;

  insert into public.quotes (job_id, number, quote_date, valid_until)
  values (
    target_job_id,
    format(
      'OFF-%s-%s',
      extract(year from today)::integer,
      lpad(private.next_document_number('quote', extract(year from today)::integer)::text, 3, '0')
    ),
    today,
    today + validity_days
  )
  returning * into quote;

  return quote;
end;
$$;

revoke all on function public.create_quote(uuid) from public, anon;
grant execute on function public.create_quote(uuid) to authenticated;
