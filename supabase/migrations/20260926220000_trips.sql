-- Verplaatsingen per job (fase 1, stap 6).
-- De manier (per km, vast bedrag per rit of inbegrepen) en het tarief komen van de job,
-- anders van de klant, anders uit de algemene instellingen. Bij het toevoegen wordt het
-- tarief vastgelegd, zodat een latere wijziging oude ritten niet verandert.
-- De functies draaien met de rechten van de gebruiker (security invoker).

-- Wat geldt voor verplaatsingen naar een job. Geen rij als de job niet bestaat of niet
-- zichtbaar is.
create function public.travel_terms(target_job_id uuid)
returns table (method public.travel_method, rate_cents integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with terms as (
    select
      coalesce(j.travel_method, c.travel_method, s.travel_method) as method,
      coalesce(j.km_rate_cents, c.km_rate_cents, s.km_rate_cents) as km_rate_cents,
      coalesce(j.trip_flat_cents, c.trip_flat_cents, s.trip_flat_cents) as trip_flat_cents
    from public.jobs j
    join public.customers c on c.id = j.customer_id
    cross join public.settings s
    where j.id = target_job_id
  )
  select
    method,
    case method when 'per_km' then km_rate_cents when 'flat' then trip_flat_cents else 0 end
  from terms;
$$;

-- Een rit toevoegen. Per km is een afstand verplicht; bij een vast bedrag wordt geen
-- afstand bewaard.
create function public.add_trip(
  target_job_id uuid,
  on_date date,
  distance numeric default null,
  trip_note text default null
)
returns public.trips
language plpgsql
security invoker
set search_path = ''
as $$
declare
  terms record;
  trip public.trips;
begin
  if not private.is_member() then
    raise exception 'Geen toegang.' using errcode = '42501';
  end if;

  select * into terms from public.travel_terms(target_job_id);
  if terms.method is null then
    raise exception 'Job niet gevonden.' using errcode = 'P0002';
  end if;
  if terms.method = 'included' then
    raise exception 'Verplaatsingen zijn inbegrepen voor deze job.' using errcode = 'TS004';
  end if;
  if terms.method = 'per_km' and distance is null then
    raise exception 'Geef de afstand in.' using errcode = 'TS005';
  end if;

  insert into public.trips (job_id, trip_date, method, distance_km, rate_cents, note)
  values (
    target_job_id,
    on_date,
    terms.method,
    case when terms.method = 'per_km' then round(distance, 1) end,
    terms.rate_cents,
    nullif(trim(trip_note), '')
  )
  returning * into trip;

  return trip;
end;
$$;

revoke all on function public.travel_terms(uuid) from public, anon;
revoke all on function public.add_trip(uuid, date, numeric, text) from public, anon;

grant execute on function public.travel_terms(uuid) to authenticated;
grant execute on function public.add_trip(uuid, date, numeric, text) to authenticated;
