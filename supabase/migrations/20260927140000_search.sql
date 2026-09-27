-- Zoeken in alles (fase 3): jobs (ook via materiaal, uren- en ritnotities, en het adres van
-- de klant als de job er zelf geen heeft), klanten,
-- offertes (ook via hun regels) en de materiaalcatalogus.
-- Volledige-tekstzoeken met Nederlandse woordstammen: "eiken trap" vindt "Trap in eik".
-- Elk woord moet voorkomen, ook als begin van een woord ("keuk" vindt "keuken").
-- De functie draait met de rechten van de gebruiker (security invoker), dus RLS geldt.

-- De zoekvraag: enkel letters en cijfers, elk woord als voorvoegsel, alle woorden verplicht.
-- Geen woorden (of enkel stopwoorden zoals "de") geeft null.
create function private.search_query(search_term text)
returns tsquery
language plpgsql
immutable
set search_path = ''
as $$
declare
  words text;
  parsed tsquery;
begin
  select string_agg(word || ':*', ' & ')
  into words
  from regexp_split_to_table(
    lower(regexp_replace(coalesce(search_term, ''), '[^[:alnum:]]+', ' ', 'g')),
    '\s+'
  ) as word
  where word <> '';

  if words is null then
    return null;
  end if;
  parsed := to_tsquery('dutch', words);
  if numnode(parsed) = 0 then
    return null;
  end if;
  return parsed;
end;
$$;

create function public.search_all(search_term text)
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

revoke all on function private.search_query(text) from public, anon;
revoke all on function public.search_all(text) from public, anon;
grant execute on function private.search_query(text) to authenticated;
grant execute on function public.search_all(text) to authenticated;
