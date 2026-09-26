-- Inklokken en uitklokken (fase 1, stap 4).
-- De functies draaien met de rechten van de gebruiker (security invoker), dus RLS en het
-- logboek blijven gelden. Eigen foutcodes (TS...) laten de app een duidelijke melding tonen.

-- Inklokken op een job. Een lopende klok van dezelfde gebruiker wordt eerst gestopt, zodat
-- wisselen van job één handeling is. Het uurtarief wordt vastgelegd: dat van de job, anders
-- het standaardtarief. Een geplande job wordt "bezig".
create function public.clock_in(target_job_id uuid)
returns public.time_entries
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_job public.jobs;
  rate public.hourly_rates;
  entry public.time_entries;
begin
  if not private.is_member() then
    raise exception 'Geen toegang.' using errcode = '42501';
  end if;

  select * into target_job from public.jobs where id = target_job_id;
  if target_job.id is null then
    raise exception 'Job niet gevonden.' using errcode = 'P0002';
  end if;
  if target_job.status in ('done', 'cancelled') then
    raise exception 'Deze job is afgewerkt of geannuleerd.' using errcode = 'TS003';
  end if;

  if target_job.hourly_rate_id is not null then
    select * into rate from public.hourly_rates where id = target_job.hourly_rate_id;
  else
    select * into rate from public.hourly_rates where is_default and archived_at is null;
  end if;
  if rate.id is null then
    raise exception 'Stel eerst een standaard-uurtarief in.' using errcode = 'TS001';
  end if;

  update public.time_entries
  set ended_at = greatest(now(), started_at + interval '1 second')
  where user_id = (select auth.uid()) and ended_at is null;

  if target_job.status = 'planned' then
    update public.jobs set status = 'active' where id = target_job.id;
  end if;

  insert into public.time_entries (job_id, user_id, hourly_rate_id, hourly_rate_cents, started_at)
  values (target_job.id, (select auth.uid()), rate.id, rate.rate_cents, now())
  returning * into entry;

  return entry;
end;
$$;

create function public.clock_out()
returns public.time_entries
language plpgsql
security invoker
set search_path = ''
as $$
declare
  entry public.time_entries;
begin
  if not private.is_member() then
    raise exception 'Geen toegang.' using errcode = '42501';
  end if;

  update public.time_entries
  set ended_at = greatest(now(), started_at + interval '1 second')
  where user_id = (select auth.uid()) and ended_at is null
  returning * into entry;

  if entry.id is null then
    raise exception 'Je bent niet ingeklokt.' using errcode = 'TS002';
  end if;

  return entry;
end;
$$;

-- Eén standaard-uurtarief: het oude verliest de markering in dezelfde transactie.
create function public.set_default_hourly_rate(rate_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_member() then
    raise exception 'Geen toegang.' using errcode = '42501';
  end if;

  update public.hourly_rates set is_default = false where is_default and id <> rate_id;
  update public.hourly_rates set is_default = true where id = rate_id and archived_at is null;

  if not found then
    raise exception 'Uurtarief niet gevonden of gearchiveerd.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.clock_in(uuid) from public, anon;
revoke all on function public.clock_out() from public, anon;
revoke all on function public.set_default_hourly_rate(uuid) from public, anon;

grant execute on function public.clock_in(uuid) to authenticated;
grant execute on function public.clock_out() to authenticated;
grant execute on function public.set_default_hourly_rate(uuid) to authenticated;
