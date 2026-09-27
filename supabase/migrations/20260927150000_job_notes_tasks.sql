-- Notities en taken per job.
-- Notities: vrije tekst over de werf ("klant wil de deur links draaiend"), met datum en auteur.
-- Taken: wat nog moet gebeuren op een job; afvinken bewaart wanneer.
-- Beide zijn doorzoekbaar via search_all.

create table public.job_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete restrict,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_notes_job_id_idx on public.job_notes (job_id);

create table public.job_tasks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 200),
  done_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_tasks_job_id_idx on public.job_tasks (job_id);

-- Updated_at, logboek en toegang, zoals bij de andere tabellen.
create trigger set_updated_at before update on public.job_notes
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.job_tasks
  for each row execute function private.set_updated_at();

create trigger log_insert_delete after insert or delete on public.job_notes
  for each row execute function private.log_change();
create trigger log_update after update on public.job_notes
  for each row when (old is distinct from new) execute function private.log_change();
create trigger log_insert_delete after insert or delete on public.job_tasks
  for each row execute function private.log_change();
create trigger log_update after update on public.job_tasks
  for each row when (old is distinct from new) execute function private.log_change();

alter table public.job_notes enable row level security;
alter table public.job_tasks enable row level security;
revoke all on public.job_notes, public.job_tasks from anon;

create policy "members have full access" on public.job_notes
  for all to authenticated
  using ((select private.is_member()))
  with check ((select private.is_member()));

create policy "members have full access" on public.job_tasks
  for all to authenticated
  using ((select private.is_member()))
  with check ((select private.is_member()));

-- Zoeken: een job wordt ook gevonden via haar notities en taken.
create or replace function public.search_all(search_term text)
returns table (kind text, id uuid, title text, detail text, rank real)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  q tsquery;
  number_pattern text;
begin
  if not private.is_member() then
    raise exception 'Geen toegang.' using errcode = '42501';
  end if;

  q := private.search_query(search_term);
  if q is null then
    return;
  end if;
  -- Offertenummers ("OFF-2026-001") ook letterlijk; % en _ uit de zoekterm gaan eruit.
  number_pattern := '%' || regexp_replace(trim(search_term), '[%_\\]', '', 'g') || '%';

  return query
  with job_hits as (
    select j.id as job_id,
      ts_rank(to_tsvector('dutch', concat_ws(' ', j.title, j.description, coalesce(j.address_line, c.address_line), coalesce(j.city, c.city), c.name)), q) as score,
      null::text as reason
    from public.jobs j
    join public.customers c on c.id = j.customer_id
    where to_tsvector('dutch', concat_ws(' ', j.title, j.description, coalesce(j.address_line, c.address_line), coalesce(j.city, c.city), c.name)) @@ q
    union all
    select mu.job_id, ts_rank(to_tsvector('dutch', mu.description), q) * 0.8,
      'Materiaal: ' || mu.description
    from public.material_usages mu
    where to_tsvector('dutch', mu.description) @@ q
    union all
    select te.job_id, ts_rank(to_tsvector('dutch', te.note), q) * 0.6, 'Uren: ' || te.note
    from public.time_entries te
    where te.note is not null and to_tsvector('dutch', te.note) @@ q
    union all
    select t.job_id, ts_rank(to_tsvector('dutch', t.note), q) * 0.6, 'Rit: ' || t.note
    from public.trips t
    where t.note is not null and to_tsvector('dutch', t.note) @@ q
    union all
    select n.job_id, ts_rank(to_tsvector('dutch', n.body), q) * 0.7, 'Notitie: ' || left(n.body, 80)
    from public.job_notes n
    where to_tsvector('dutch', n.body) @@ q
    union all
    select tk.job_id, ts_rank(to_tsvector('dutch', tk.title), q) * 0.6, 'Taak: ' || tk.title
    from public.job_tasks tk
    where to_tsvector('dutch', tk.title) @@ q
  ),
  results as (
    select 'job'::text as kind, j.id, j.title,
      concat_ws(' · ', c.name, string_agg(distinct h.reason, ' · ')) as detail,
      max(h.score) as rank
    from job_hits h
    join public.jobs j on j.id = h.job_id
    join public.customers c on c.id = j.customer_id
    group by j.id, j.title, c.name
    union all
    select 'customer', c.id, c.name, concat_ws(' · ', c.city, c.phone, c.email),
      ts_rank(to_tsvector('dutch', concat_ws(' ', c.name, c.city, c.address_line, c.email, c.phone, c.vat_number, c.notes)), q)
    from public.customers c
    where to_tsvector('dutch', concat_ws(' ', c.name, c.city, c.address_line, c.email, c.phone, c.vat_number, c.notes)) @@ q
    union all
    select 'quote', qu.id, qu.number, concat_ws(' · ', j.title, c.name),
      greatest(
        ts_rank(to_tsvector('dutch', concat_ws(' ', qu.intro, qu.notes, lines.text)), q),
        case when qu.number ilike number_pattern then 1 else 0 end
      )::real
    from public.quotes qu
    join public.jobs j on j.id = qu.job_id
    join public.customers c on c.id = j.customer_id
    left join lateral (
      select string_agg(ql.description, ' ') as text
      from public.quote_lines ql
      where ql.quote_id = qu.id
    ) lines on true
    where to_tsvector('dutch', concat_ws(' ', qu.intro, qu.notes, lines.text, j.title, c.name)) @@ q
      or qu.number ilike number_pattern
    union all
    select 'material', m.id, m.name, m.supplier,
      ts_rank(to_tsvector('dutch', concat_ws(' ', m.name, m.supplier)), q)
    from public.materials m
    where to_tsvector('dutch', concat_ws(' ', m.name, m.supplier)) @@ q
  )
  select r.kind, r.id, r.title, nullif(r.detail, ''), r.rank::real
  from results r
  order by r.rank desc, r.title
  limit 50;
end;
$$;
