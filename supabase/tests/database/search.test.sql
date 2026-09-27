-- Tests voor zoeken in alles.
begin;
select no_plan();

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'eigenaar@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'vreemde@example.com');
select private.add_app_user('eigenaar@example.com', 'owner', 'Eigenaar');

insert into public.customers (id, type, name, city) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'private', 'Els Maes', 'Brugge'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'private', 'Jan Peeters', 'Damme');
insert into public.jobs (id, customer_id, title, description) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Trap in eik', 'Kwartdraai'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'Badkamermeubel', null);
insert into public.material_usages (job_id, description, unit, package_price_cents, units_per_package, quantity, margin_bp, created_by)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'Multiplex berken 18 mm', 'plaat', 6450, 1, 2, 0,
  '11111111-1111-1111-1111-111111111111');
insert into public.materials (id, name, unit, package_price_cents, units_per_package, supplier)
values ('dddddddd-0000-0000-0000-000000000001', 'Scharnier Blum', 'stuk', 900, 2, 'Houthandel Vandamme');
insert into public.quotes (id, job_id, number, created_by)
values ('eeeeeeee-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'OFF-2026-007',
  '11111111-1111-1111-1111-111111111111');
insert into public.quote_lines (quote_id, description, quantity, unit, unit_price_cents, vat_rate)
values ('eeeeeeee-0000-0000-0000-000000000001', 'Lavabomeubel met twee lades', 1, 'stuk', 120000, 6);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select results_eq(
  $$ select kind, id from public.search_all('eiken trap') $$,
  $$ values ('job', 'bbbbbbbb-0000-0000-0000-000000000001'::uuid) $$,
  'woordstammen: "eiken trap" vindt "Trap in eik"');
select results_eq(
  $$ select kind, id from public.search_all('badkam') where kind = 'job' $$,
  $$ values ('job', 'bbbbbbbb-0000-0000-0000-000000000002'::uuid) $$,
  'een begin van een woord volstaat');
select ok(
  (select detail from public.search_all('berken') where kind = 'job') like '%Materiaal: Multiplex berken 18 mm%',
  'een job wordt gevonden via het materiaal, met de reden erbij');
select results_eq(
  $$ select kind, id from public.search_all('lavabo lades') $$,
  $$ values ('quote', 'eeeeeeee-0000-0000-0000-000000000001'::uuid) $$,
  'een offerte wordt gevonden via haar regels');
select results_eq(
  $$ select kind, id from public.search_all('OFF-2026-007') $$,
  $$ values ('quote', 'eeeeeeee-0000-0000-0000-000000000001'::uuid) $$,
  'een offertenummer wordt gevonden');
select results_eq(
  $$ select kind, id from public.search_all('vandamme') $$,
  $$ values ('material', 'dddddddd-0000-0000-0000-000000000001'::uuid) $$,
  'materiaal wordt gevonden op leverancier');
select results_eq(
  $$ select kind from public.search_all('Brugge') order by kind $$,
  $$ values ('customer'), ('job') $$,
  'een gemeente vindt de klant en haar jobs');
select is_empty($$ select * from public.search_all('eik damme') $$,
  'alle woorden moeten voorkomen');
select is_empty($$ select * from public.search_all('de') $$, 'enkel stopwoorden geeft niets');
select is_empty($$ select * from public.search_all(''' & | ! :* %') $$,
  'tekens met een betekenis in de zoektaal doen geen kwaad');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select throws_ok($$ select * from public.search_all('eik') $$, '42501', null,
  'een niet-lid kan niet zoeken');
reset role;

select * from finish();
rollback;
