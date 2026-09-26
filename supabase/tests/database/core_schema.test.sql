-- Tests voor het basisschema: toegang (RLS), constraints, logboek.
-- Uitvoeren met: npx supabase test db
begin;
select no_plan();

-- ---------------------------------------------------------------------------
-- Testgebruikers
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'eigenaar@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'admin@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'vreemde@example.com');

select private.add_app_user('Eigenaar@Example.com', 'owner', 'Eigenaar');
select private.add_app_user('admin@example.com', 'admin', 'Admin');

select is(
  (select count(*)::int from public.app_users), 2,
  'add_app_user voegt gebruikers toe (e-mail hoofdletterongevoelig)'
);

select throws_ok(
  $$ select private.add_app_user('onbekend@example.com', 'owner', 'X') $$,
  'P0001', null,
  'add_app_user weigert een onbekend e-mailadres'
);

-- ---------------------------------------------------------------------------
-- RLS staat aan op elke tabel in public
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0,
  'Row Level Security staat aan op alle tabellen'
);

-- ---------------------------------------------------------------------------
-- Testdata als postgres (omzeilt RLS)
-- ---------------------------------------------------------------------------

insert into public.customers (id, type, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'private', 'Jan Peeters');

insert into public.jobs (id, customer_id, title)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Keuken');

-- ---------------------------------------------------------------------------
-- Anonieme bezoeker ziet niets
-- ---------------------------------------------------------------------------

set local role anon;
select throws_ok(
  $$ select * from public.customers $$,
  '42501', null,
  'anon heeft geen toegang tot klanten'
);
reset role;

-- ---------------------------------------------------------------------------
-- Ingelogd, maar geen lid: ziet niets en kan niets toevoegen
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';

select is((select count(*)::int from public.customers), 0, 'niet-lid ziet geen klanten');
select is((select count(*)::int from public.settings), 0, 'niet-lid ziet geen instellingen');
select is((select count(*)::int from public.app_users), 0, 'niet-lid ziet geen gebruikers');

select throws_ok(
  $$ insert into public.customers (type, name) values ('private', 'Inbreker') $$,
  '42501', null,
  'niet-lid kan geen klant toevoegen'
);

select throws_ok(
  $$ insert into public.app_users (user_id, role, display_name)
     values ('33333333-3333-3333-3333-333333333333', 'owner', 'Ik') $$,
  '42501', null,
  'niet-lid kan zichzelf geen rol geven'
);

select throws_ok(
  $$ select private.add_app_user('vreemde@example.com', 'owner', 'Ik') $$,
  '42501', null,
  'add_app_user is niet uitvoerbaar via de API'
);

reset role;

-- ---------------------------------------------------------------------------
-- Lid (eigenaar): volledige toegang tot bedrijfsgegevens
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is((select count(*)::int from public.customers), 1, 'lid ziet klanten');
select is((select count(*)::int from public.settings), 1, 'lid ziet de instellingen');

select lives_ok(
  $$ update public.settings set km_rate_cents = 43, material_margin_bp = 1500 $$,
  'lid kan instellingen wijzigen'
);

select throws_ok(
  $$ insert into public.settings default values $$,
  '42501', null,
  'er kan geen tweede instellingenrij bijkomen'
);

select lives_ok(
  $$ insert into public.hourly_rates (name, rate_cents, is_default) values ('Standaard', 5000, true) $$,
  'lid kan een uurtarief toevoegen'
);

select throws_ok(
  $$ insert into public.hourly_rates (name, rate_cents, is_default) values ('Tweede', 6000, true) $$,
  '23505', null,
  'er kan maar één standaard-uurtarief zijn'
);

select throws_ok(
  $$ insert into public.app_users (user_id, role, display_name)
     values ('33333333-3333-3333-3333-333333333333', 'admin', 'Vriend') $$,
  '42501', null,
  'ook een lid kan geen rollen toekennen via de API'
);

select throws_ok(
  $$ delete from public.audit_log $$,
  '42501', null,
  'het logboek kan niet gewist worden'
);

select throws_ok(
  $$ update public.audit_log set action = 'insert' $$,
  '42501', null,
  'het logboek kan niet gewijzigd worden'
);

select throws_ok(
  $$ delete from public.settings $$,
  '42501', null,
  'de instellingenrij kan niet verwijderd worden'
);

-- Uren: één lopende klok per gebruiker
select lives_ok(
  $$ insert into public.time_entries (job_id, hourly_rate_cents)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 5000) $$,
  'lid kan inklokken (user_id wordt automatisch ingevuld)'
);

select is(
  (select user_id from public.time_entries limit 1),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'tijdsregistratie bewaart wie inklokte'
);

select throws_ok(
  $$ insert into public.time_entries (job_id, hourly_rate_cents)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 5000) $$,
  '23505', null,
  'een tweede lopende klok voor dezelfde gebruiker wordt geweigerd'
);

select throws_ok(
  $$ update public.time_entries set ended_at = started_at - interval '1 minute' $$,
  '23514', null,
  'einde moet na begin liggen'
);

-- Constraints op bedragen en materiaal
select throws_ok(
  $$ insert into public.materials (name, unit, package_price_cents, units_per_package)
     values ('Vijzen', 'stuk', -1, 200) $$,
  '23514', null,
  'negatieve prijs wordt geweigerd'
);

select throws_ok(
  $$ insert into public.materials (name, unit, package_price_cents, units_per_package)
     values ('Vijzen', 'stuk', 1200, 0) $$,
  '23514', null,
  'verpakking met 0 stuks wordt geweigerd'
);

select throws_ok(
  $$ insert into public.customers (type, name) values ('private', '   ') $$,
  '23514', null,
  'lege naam wordt geweigerd'
);

-- Verplaatsingen: km verplicht bij per_km, verboden bij forfait
select throws_ok(
  $$ insert into public.trips (job_id, method, rate_cents)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'per_km', 43) $$,
  '23514', null,
  'rit per km zonder afstand wordt geweigerd'
);

select lives_ok(
  $$ insert into public.trips (job_id, method, rate_cents)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'flat', 2500) $$,
  'forfaitaire rit zonder afstand mag'
);

select throws_ok(
  $$ insert into public.trips (job_id, method, rate_cents)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'included', 0) $$,
  '23514', null,
  'een rit met methode "inbegrepen" wordt geweigerd'
);

-- Een klant met jobs kan niet verwijderd worden
select throws_ok(
  $$ delete from public.customers where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '23503', null,
  'klant met jobs kan niet verwijderd worden'
);

-- Logboek
select ok(
  exists (
    select 1 from public.audit_log
    where table_name = 'settings' and action = 'update'
      and changed_by = '11111111-1111-1111-1111-111111111111'
      and (new_data ->> 'km_rate_cents')::int = 43
      and (old_data ->> 'km_rate_cents')::int = 0
  ),
  'wijziging aan instellingen staat in het logboek met wie en wat'
);

select ok(
  exists (
    select 1 from public.audit_log
    where table_name = 'time_entries' and action = 'insert'
      and changed_by = '11111111-1111-1111-1111-111111111111'
  ),
  'inklokken staat in het logboek'
);

reset role;

-- updated_at wordt door de trigger gezet, ook als iemand een andere waarde probeert
update public.customers set updated_at = now() - interval '1 day'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select updated_at from public.customers where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  now(),
  'updated_at wordt automatisch bijgewerkt'
);

-- ---------------------------------------------------------------------------
-- Admin heeft dezelfde toegang
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select lives_ok(
  $$ update public.customers set name = 'Jan Peeters-De Smet'
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'admin kan klanten bewerken'
);

select is(
  (select count(*)::int from public.audit_log
    where table_name = 'customers' and action = 'update'
      and changed_by = '22222222-2222-2222-2222-222222222222'),
  1,
  'wijziging door admin staat in het logboek'
);

reset role;

select * from finish();
rollback;
