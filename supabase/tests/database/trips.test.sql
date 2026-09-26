-- Tests voor verplaatsingen: manier en tarief volgen job > klant > algemene instelling.
begin;
select no_plan();

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'eigenaar@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'vreemde@example.com');
select private.add_app_user('eigenaar@example.com', 'owner', 'Eigenaar');

insert into public.customers (id, type, name, travel_method, km_rate_cents, trip_flat_cents) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'private', 'Gewone klant', null, null, null),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'business', 'Klant met forfait', 'flat', null, 3500);
insert into public.jobs (id, customer_id, title, travel_method, km_rate_cents) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Keuken', null, null),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'Trap', null, null),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'Kast', 'per_km', 50),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'Deur', 'included', null);
update public.settings set travel_method = 'per_km', km_rate_cents = 43, trip_flat_cents = 2500;

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select results_eq(
  $$ select method::text, rate_cents from public.travel_terms('bbbbbbbb-0000-0000-0000-000000000001') $$,
  $$ values ('per_km', 43) $$, 'zonder uitzondering gelden de algemene instellingen');
select results_eq(
  $$ select method::text, rate_cents from public.travel_terms('bbbbbbbb-0000-0000-0000-000000000002') $$,
  $$ values ('flat', 3500) $$, 'de klant gaat voor op de algemene instellingen');
select results_eq(
  $$ select method::text, rate_cents from public.travel_terms('bbbbbbbb-0000-0000-0000-000000000003') $$,
  $$ values ('per_km', 50) $$, 'de job gaat voor op de klant');
select results_eq(
  $$ select method::text, rate_cents from public.travel_terms('bbbbbbbb-0000-0000-0000-000000000004') $$,
  $$ values ('included', 0) $$, 'inbegrepen kost niets');
select is_empty(
  $$ select * from public.travel_terms('bbbbbbbb-0000-0000-0000-000000000009') $$,
  'een onbekende job heeft geen voorwaarden');

-- Ritten toevoegen
select results_eq(
  $$ select method::text, distance_km, rate_cents, note
     from public.add_trip('bbbbbbbb-0000-0000-0000-000000000001', '2026-09-26', 42.35, ' Opmeten ') $$,
  $$ values ('per_km', 42.4::numeric, 43, 'Opmeten') $$,
  'een rit per km legt afstand (1 decimaal) en km-tarief vast');
select results_eq(
  $$ select method::text, distance_km, rate_cents, note
     from public.add_trip('bbbbbbbb-0000-0000-0000-000000000002', current_date, 30, '') $$,
  $$ values ('flat', null::numeric, 3500, null::text) $$,
  'een forfaitaire rit bewaart geen afstand');

select throws_ok(
  $$ select public.add_trip('bbbbbbbb-0000-0000-0000-000000000001', current_date, null, null) $$,
  'TS005', null, 'per km zonder afstand wordt geweigerd');
select throws_ok(
  $$ select public.add_trip('bbbbbbbb-0000-0000-0000-000000000001', current_date, 0, null) $$,
  '23514', null, 'een afstand van 0 wordt geweigerd');
select throws_ok(
  $$ select public.add_trip('bbbbbbbb-0000-0000-0000-000000000004', current_date, 10, null) $$,
  'TS004', null, 'bij inbegrepen verplaatsingen voeg je geen ritten toe');
select throws_ok(
  $$ select public.add_trip('bbbbbbbb-0000-0000-0000-000000000009', current_date, 10, null) $$,
  'P0002', null, 'een onbekende job geeft een duidelijke fout');

-- Een latere wijziging verandert oude ritten niet.
update public.settings set km_rate_cents = 60;
select is((select rate_cents from public.trips where job_id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  43, 'het tarief blijft zoals bij het toevoegen');

select ok(
  exists (select 1 from public.audit_log where table_name = 'trips' and action = 'insert'
    and changed_by = '11111111-1111-1111-1111-111111111111'),
  'een rit toevoegen staat in het logboek'
);
reset role;

-- Niet-leden
set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select is_empty($$ select * from public.travel_terms('bbbbbbbb-0000-0000-0000-000000000001') $$,
  'een niet-lid ziet geen voorwaarden');
select throws_ok(
  $$ select public.add_trip('bbbbbbbb-0000-0000-0000-000000000001', current_date, 10, null) $$,
  '42501', null, 'een niet-lid kan geen rit toevoegen');
reset role;

set local role anon;
select throws_ok(
  $$ select public.add_trip('bbbbbbbb-0000-0000-0000-000000000001', current_date, 10, null) $$,
  '42501', null, 'anon kan de functies niet uitvoeren');
reset role;

select * from finish();
rollback;
