-- Een lopende klok stoppen, ook die van een ander lid (bv. vergeten uit te klokken).
-- Draait met de rechten van de gebruiker (security invoker), dus RLS en het logboek gelden.
create function public.stop_time_entry(entry_id uuid)
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
  where id = entry_id and ended_at is null
  returning * into entry;

  if entry.id is null then
    raise exception 'Deze klok loopt niet (meer).' using errcode = 'TS002';
  end if;

  return entry;
end;
$$;

revoke all on function public.stop_time_entry(uuid) from public, anon;
grant execute on function public.stop_time_entry(uuid) to authenticated;
