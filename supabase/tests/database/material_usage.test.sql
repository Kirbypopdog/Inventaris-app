-- Tests voor materiaal per job: prijzen en marge worden vastgelegd bij het toevoegen.
begin;
select no_plan();

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'eigenaar@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'vreemde@example.com');
select private.add_app_user('eigenaar@example.com', 'owner', 'Eigenaar');

insert into public.customers (id, type, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'private', 'Klant');
insert into public.jobs (id, customer_id, title, material_margin_bp) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Keuken', null),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Trap', 2500);
insert into public.materials (id, name, unit, package_price_cents, units_per_package, margin_bp) values
  ('dddddddd-0000-0000-0000-000000000001', 'Vijzen 4x40', 'stuk', 1250, 200, null),
  ('dddddddd-0000-0000-0000-000000000002', 'Scharnier', 'stuk', 900, 2, 3000),
  ('dddddddd-0000-0000-0000-000000000003', 'Oud materiaal', 'stuk', 100, 1, null);
update public.materials set archived_at = now() where id = 'dddddddd-0000-0000-0000-000000000003';
update public.settings set material_margin_bp = 1500;

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

-- Uit de catalogus
select results_eq(
  $$ select description, unit, package_price_cents, units_per_package, quantity, margin_bp, used_on
     from public.add_material_usage('bbbbbbbb-0000-0000-0000-000000000001',
       'dddddddd-0000-0000-0000-000000000001', 35, false, '2026-09-26') $$,
  $$ values ('Vijzen 4x40', 'stuk', 1250, 200.000::numeric, 35.000::numeric, 1500, '2026-09-26'::date) $$,
  'naam, eenheid en prijzen komen uit de catalogus; zonder andere marge geldt de algemene'
);
select is(
  (public.add_material_usage('bbbbbbbb-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000001', 2, true, current_date)).quantity,
  400.000::numeric,
  'een aantal verpakkingen wordt omgerekend naar eenheden'
);
select is(
  (public.add_material_usage('bbbbbbbb-0000-0000-0000-000000000001',
    'dddddddd-0000-0000-0000-000000000002', 4, false, current_date)).margin_bp,
  3000, 'de marge van het materiaal gaat voor op de algemene');
select is(
  (public.add_material_usage('bbbbbbbb-0000-0000-0000-000000000002',
    'dddddddd-0000-0000-0000-000000000002', 4, false, current_date)).margin_bp,
  2500, 'de marge van de job gaat voor op die van het materiaal');

select throws_ok(
  $$ select public.add_material_usage('bbbbbbbb-0000-0000-0000-000000000001',
       'dddddddd-0000-0000-0000-000000000003', 1, false, current_date) $$,
  'P0002', null, 'gearchiveerd materiaal kan je niet meer toevoegen');
select throws_ok(
  $$ select public.add_material_usage('bbbbbbbb-0000-0000-0000-000000000009',
       'dddddddd-0000-0000-0000-000000000001', 1, false, current_date) $$,
  '23503', null, 'een onbekende job wordt geweigerd');
select throws_ok(
  $$ select public.add_material_usage('bbbbbbbb-0000-0000-0000-000000000001',
       'dddddddd-0000-0000-0000-000000000001', 0, false, current_date) $$,
  '23514', null, 'een aantal van 0 wordt geweigerd');

-- Buiten de catalogus
select results_eq(
  $$ select description, unit, package_price_cents, units_per_package, quantity, margin_bp, material_id
     from public.add_other_material_usage('bbbbbbbb-0000-0000-0000-000000000002',
       ' Werkbladolie ', 'fles', 1899, 2, current_date) $$,
  $$ values ('Werkbladolie', 'fles', 1899, 1.000::numeric, 2.000::numeric, 2500, null::uuid) $$,
  'iets buiten de catalogus heeft een prijs per eenheid en de marge van de job'
);

-- Een latere wijziging verandert oude verbruiken niet.
update public.settings set material_margin_bp = 2000;
update public.materials set package_price_cents = 1500 where id = 'dddddddd-0000-0000-0000-000000000001';
select results_eq(
  $$ select distinct margin_bp, package_price_cents from public.material_usages
     where material_id = 'dddddddd-0000-0000-0000-000000000001' $$,
  $$ values (1500, 1250) $$,
  'marge en prijs blijven zoals bij het toevoegen'
);

select ok(
  exists (select 1 from public.audit_log where table_name = 'material_usages' and action = 'insert'
    and changed_by = '11111111-1111-1111-1111-111111111111'),
  'materiaal toevoegen staat in het logboek'
);

-- Een gewist materiaal verdwijnt niet uit oude jobs.
delete from public.materials where id = 'dddddddd-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.material_usages where description = 'Vijzen 4x40'),
  2, 'het verbruik blijft bewaard als het materiaal gewist wordt');
reset role;

-- Niet-leden zien en wijzigen niets.
set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select is_empty($$ select id from public.material_usages $$, 'een niet-lid ziet geen materiaal');
select throws_ok(
  $$ select public.add_material_usage('bbbbbbbb-0000-0000-0000-000000000001',
       'dddddddd-0000-0000-0000-000000000002', 1, false, current_date) $$,
  '42501', null, 'een niet-lid kan geen materiaal toevoegen');
select throws_ok(
  $$ select public.add_other_material_usage('bbbbbbbb-0000-0000-0000-000000000001',
       'Lijm', 'tube', 650, 1, current_date) $$,
  '42501', null, 'een niet-lid kan niets buiten de catalogus toevoegen');
reset role;

set local role anon;
select throws_ok(
  $$ select public.add_other_material_usage('bbbbbbbb-0000-0000-0000-000000000001',
       'Lijm', 'tube', 650, 1, current_date) $$,
  '42501', null, 'anon kan de functies niet uitvoeren');
reset role;

select * from finish();
rollback;
