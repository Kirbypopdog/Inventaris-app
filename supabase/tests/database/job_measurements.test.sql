-- Tests voor opmetingen per job.
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

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.job_measurements (job_id, label, width_mm, height_mm, depth_mm, note)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'Kast hal', 1200, 2400, 600, 'Plafond loopt af') $$,
  'een opmeting met drie maten');
select lives_ok(
  $$ insert into public.job_measurements (job_id, label, width_mm)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'Plint living', 5320) $$,
  'één maat volstaat');
select throws_ok(
  $$ insert into public.job_measurements (job_id, label) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Leeg') $$,
  '23514', null, 'zonder maat wordt geweigerd');
select throws_ok(
  $$ insert into public.job_measurements (job_id, label, width_mm) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Nul', 0) $$,
  '23514', null, 'een maat van 0 wordt geweigerd');
select throws_ok(
  $$ insert into public.job_measurements (job_id, label, width_mm) values ('bbbbbbbb-0000-0000-0000-000000000001', ' ', 10) $$,
  '23514', null, 'zonder omschrijving wordt geweigerd');
select ok(
  exists (select 1 from public.audit_log where table_name = 'job_measurements' and action = 'insert'),
  'een opmeting staat in het logboek');
select ok(
  (select detail from public.search_all('plafond') where kind = 'job') like '%Opmeting: Kast hal%',
  'een job wordt gevonden via een opmeting');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select is_empty($$ select * from public.job_measurements $$, 'een niet-lid ziet geen opmetingen');
select throws_ok(
  $$ insert into public.job_measurements (job_id, label, width_mm) values ('bbbbbbbb-0000-0000-0000-000000000001', 'x', 1) $$,
  '42501', null, 'een niet-lid voegt geen opmeting toe');
reset role;

select * from finish();
rollback;
