-- Bestellijst: wat nog besteld moet worden, per leverancier. Omschrijving, eenheid en
-- leverancier worden overgenomen uit de catalogus (of vrij ingevuld), zodat de lijst klopt
-- ook als de catalogus later wijzigt. Afvinken als besteld bewaart wanneer.

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials (id) on delete set null,
  job_id uuid references public.jobs (id) on delete restrict,
  description text not null check (length(trim(description)) between 1 and 200),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit text not null check (length(trim(unit)) between 1 and 30),
  supplier text check (supplier is null or length(trim(supplier)) between 1 and 200),
  ordered_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index order_items_job_id_idx on public.order_items (job_id);
create index order_items_material_id_idx on public.order_items (material_id);

create trigger set_updated_at before update on public.order_items
  for each row execute function private.set_updated_at();
create trigger log_insert_delete after insert or delete on public.order_items
  for each row execute function private.log_change();
create trigger log_update after update on public.order_items
  for each row when (old is distinct from new) execute function private.log_change();

alter table public.order_items enable row level security;
revoke all on public.order_items from anon;

create policy "members have full access" on public.order_items
  for all to authenticated
  using ((select private.is_member()))
  with check ((select private.is_member()));
