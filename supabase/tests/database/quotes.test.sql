-- Tests voor offertes: nummering, ontwerp-slot, toegang.
begin;
select no_plan();

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'eigenaar@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'vreemde@example.com');
select private.add_app_user('eigenaar@example.com', 'owner', 'Eigenaar');

insert into public.customers (id, type, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'private', 'Klant');
insert into public.jobs (id, customer_id, title)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Keuken');
update public.settings set quote_validity_days = 14;

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

create temp table made on commit drop as
  select * from public.create_quote('bbbbbbbb-0000-0000-0000-000000000001');
select is((select number from made),
  format('OFF-%s-001', extract(year from (now() at time zone 'Europe/Brussels'))::int),
  'de eerste offerte van het jaar krijgt nummer 001');
select is((select valid_until - quote_date from made), 14,
  'de geldigheid komt uit de instellingen');
select is((select status::text from made), 'draft', 'een nieuwe offerte is een ontwerp');
select is(
  (public.create_quote('bbbbbbbb-0000-0000-0000-000000000001')).number,
  format('OFF-%s-002', extract(year from (now() at time zone 'Europe/Brussels'))::int),
  'de volgende offerte krijgt het volgende nummer');
select throws_ok($$ select public.create_quote('bbbbbbbb-0000-0000-0000-000000000009') $$,
  'P0002', null, 'een onbekende job geeft een duidelijke fout');

-- Regels in een ontwerp
insert into public.quote_lines (quote_id, description, quantity, unit, unit_price_cents, vat_rate)
select id, 'Keukenkast', 2, 'stuk', 45000, 21 from made;
select lives_ok(
  $$ update public.quote_lines set quantity = 3 where quote_id = (select id from made) $$,
  'in een ontwerp kan je regels aanpassen');
select throws_ok(
  $$ insert into public.quote_lines (quote_id, description, quantity, unit, unit_price_cents, vat_rate)
     select id, 'Fout', 1, 'stuk', 100, 7 from made $$,
  '23514', null, 'enkel btw-tarieven 0, 6, 12 of 21');

-- Verzonden: vergrendeld
update public.quotes set status = 'sent' where id = (select id from made);
select throws_ok(
  $$ update public.quote_lines set quantity = 4 where quote_id = (select id from made) $$,
  'TS006', null, 'een regel van een verzonden offerte pas je niet aan');
select throws_ok(
  $$ insert into public.quote_lines (quote_id, description, quantity, unit, unit_price_cents, vat_rate)
     select id, 'Extra', 1, 'stuk', 100, 21 from made $$,
  'TS006', null, 'aan een verzonden offerte voeg je geen regels toe');
select throws_ok(
  $$ update public.quotes set intro = 'Anders' where id = (select id from made) $$,
  'TS006', null, 'de tekst van een verzonden offerte pas je niet aan');
select throws_ok(
  $$ delete from public.quotes where id = (select id from made) $$,
  'TS006', null, 'een verzonden offerte verwijder je niet');
select lives_ok(
  $$ update public.quotes set status = 'accepted' where id = (select id from made) $$,
  'de status blijft wijzigbaar');
select lives_ok(
  $$ update public.quotes set status = 'draft' where id = (select id from made) $$,
  'een offerte kan terug op ontwerp');
select lives_ok(
  $$ delete from public.quotes where id = (select id from made) $$,
  'een ontwerp kan verwijderd worden, met zijn regels');
select is((select count(*)::int from public.quote_lines), 0, 'de regels zijn mee verwijderd');

select ok(
  exists (select 1 from public.audit_log where table_name = 'quotes' and action = 'insert'),
  'offertes staan in het logboek');
reset role;

-- Niet-leden en de teller
set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select is_empty($$ select id from public.quotes $$, 'een niet-lid ziet geen offertes');
select throws_ok($$ select public.create_quote('bbbbbbbb-0000-0000-0000-000000000001') $$,
  '42501', null, 'een niet-lid maakt geen offerte');
select throws_ok($$ select * from public.document_counters $$,
  '42501', null, 'de teller is niet rechtstreeks leesbaar');
reset role;

select * from finish();
rollback;
