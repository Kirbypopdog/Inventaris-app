-- Materiaal per job (fase 1, stap 5).
-- Bij het toevoegen worden naam, eenheid, prijzen en marge vastgelegd, zodat een latere
-- wijziging in de catalogus of de instellingen oude jobs niet verandert.
-- De functies draaien met de rechten van de gebruiker (security invoker), dus RLS en het
-- logboek blijven gelden.

-- Marge op materiaal: die van de job, anders die van het materiaal, anders de algemene
-- instelling.
create function private.material_margin_bp(target_job_id uuid, source_material_id uuid)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select j.material_margin_bp from public.jobs j where j.id = target_job_id),
    (select m.margin_bp from public.materials m where m.id = source_material_id),
    (select s.material_margin_bp from public.settings s),
    0
  );
$$;

-- Materiaal uit de catalogus. Het aantal is in eenheden (bv. stuks), of in verpakkingen
-- als per_package waar is (2 dozen van 200 = 400 stuks).
create function public.add_material_usage(
  target_job_id uuid,
  source_material_id uuid,
  usage_quantity numeric,
  per_package boolean,
  usage_date date
)
returns public.material_usages
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source public.materials;
  usage public.material_usages;
begin
  if not private.is_member() then
    raise exception 'Geen toegang.' using errcode = '42501';
  end if;

  select * into source from public.materials
  where id = source_material_id and archived_at is null;
  if source.id is null then
    raise exception 'Materiaal niet gevonden of gearchiveerd.' using errcode = 'P0002';
  end if;

  insert into public.material_usages (
    job_id, material_id, description, unit, package_price_cents, units_per_package,
    quantity, margin_bp, used_on
  )
  values (
    target_job_id, source.id, source.name, source.unit, source.package_price_cents,
    source.units_per_package,
    round(case when per_package then usage_quantity * source.units_per_package
               else usage_quantity end, 3),
    private.material_margin_bp(target_job_id, source.id),
    usage_date
  )
  returning * into usage;

  return usage;
end;
$$;

-- Iets buiten de catalogus, met een prijs per eenheid.
create function public.add_other_material_usage(
  target_job_id uuid,
  usage_description text,
  usage_unit text,
  unit_price_cents integer,
  usage_quantity numeric,
  usage_date date
)
returns public.material_usages
language plpgsql
security invoker
set search_path = ''
as $$
declare
  usage public.material_usages;
begin
  if not private.is_member() then
    raise exception 'Geen toegang.' using errcode = '42501';
  end if;

  insert into public.material_usages (
    job_id, description, unit, package_price_cents, units_per_package, quantity, margin_bp,
    used_on
  )
  values (
    target_job_id, trim(usage_description), trim(usage_unit), unit_price_cents, 1,
    usage_quantity, private.material_margin_bp(target_job_id, null), usage_date
  )
  returning * into usage;

  return usage;
end;
$$;

revoke all on function private.material_margin_bp(uuid, uuid) from public, anon;
revoke all on function public.add_material_usage(uuid, uuid, numeric, boolean, date)
  from public, anon;
revoke all on function public.add_other_material_usage(uuid, text, text, integer, numeric, date)
  from public, anon;

grant execute on function private.material_margin_bp(uuid, uuid) to authenticated;
grant execute on function public.add_material_usage(uuid, uuid, numeric, boolean, date)
  to authenticated;
grant execute on function public.add_other_material_usage(uuid, text, text, integer, numeric, date)
  to authenticated;
