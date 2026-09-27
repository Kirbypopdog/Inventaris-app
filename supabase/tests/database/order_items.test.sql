-- Tests voor de bestellijst.
begin;
select no_plan();

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'eigenaar@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'vreemde@example.com');
select private.add_app_user('eigenaar@example.com', 'owner', 'Eigenaar');

insert into public.customers (id, type, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'private', 'Els Maes');
insert into public.jobs (id, customer_id, title)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Keuken');
insert into public.materials (id, name, unit, package_price_cents, units_per_package, supplier)
values ('dddddddd-0000-0000-0000-000000000001', 'Scharnier Blum', 'stuk', 900, 2, 'Vandamme');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.order_items (id, material_id, job_id, description, quantity, unit, supplier)
     values ('eeeeeeee-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
       'bbbbbbbb-0000-0000-0000-000000000001', 'Scharnier Blum', 12, 'stuk', 'Vandamme') $$,
  'een lid zet iets uit de catalogus op de lijst, voor een job');
select lives_ok(
  $$ insert into public.order_items (description, quantity, unit)
     values ('Silicone transparant', 3, 'koker') $$,
  'iets zonder job en zonder leverancier');
select throws_ok(
  $$ insert into public.order_items (description, quantity, unit) values ('x', 0, 'stuk') $$,
  '23514', null, 'een aantal van 0 wordt geweigerd');
select throws_ok(
  $$ insert into public.order_items (description, quantity, unit) values (' ', 1, 'stuk') $$,
  '23514', null, 'zonder omschrijving wordt geweigerd');
select throws_ok(
  $$ insert into public.order_items (description, quantity, unit, supplier) values ('x', 1, 'stuk', ' ') $$,
  '23514', null, 'een lege leverancier wordt geweigerd (dan null)');
select lives_ok(
  $$ update public.order_items set ordered_at = now() where id = 'eeeeeeee-0000-0000-0000-000000000001' $$,
  'afvinken als besteld');
select ok(
  exists (select 1 from public.audit_log where table_name = 'order_items' and action = 'update'),
  'afvinken staat in het logboek');
reset role;

-- Een materiaal verwijderen laat de regel staan.
delete from public.materials where id = 'dddddddd-0000-0000-0000-000000000001';
select is((select description from public.order_items where id = 'eeeeeeee-0000-0000-0000-000000000001'),
  'Scharnier Blum', 'de regel blijft als het materiaal verdwijnt');

set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select is_empty($$ select * from public.order_items $$, 'een niet-lid ziet de bestellijst niet');
select throws_ok(
  $$ insert into public.order_items (description, quantity, unit) values ('x', 1, 'stuk') $$,
  '42501', null, 'een niet-lid zet niets op de lijst');
reset role;

select * from finish();
rollback;
