-- Tests voor notities en taken per job.
begin;
select no_plan();

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'eigenaar@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'vreemde@example.com');
select private.add_app_user('eigenaar@example.com', 'owner', 'Eigenaar');

insert into public.customers (id, type, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'private', 'Els Maes');
insert into public.jobs (id, customer_id, title) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Keuken'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Trap');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

-- Notities
select lives_ok(
  $$ insert into public.job_notes (id, job_id, body)
     values ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
       'Klant wil de deur links draaiend') $$,
  'een lid voegt een notitie toe');
select is((select created_by from public.job_notes where id = 'cccccccc-0000-0000-0000-000000000001'),
  '11111111-1111-1111-1111-111111111111'::uuid, 'de auteur wordt automatisch ingevuld');
select throws_ok(
  $$ insert into public.job_notes (job_id, body) values ('bbbbbbbb-0000-0000-0000-000000000001', '   ') $$,
  '23514', null, 'een lege notitie wordt geweigerd');
select throws_ok(
  $$ insert into public.job_notes (job_id, body) values ('bbbbbbbb-0000-0000-0000-000000000001', repeat('x', 2001)) $$,
  '23514', null, 'een te lange notitie wordt geweigerd');
select throws_ok(
  $$ insert into public.job_notes (job_id, body) values ('bbbbbbbb-0000-0000-0000-000000000009', 'x') $$,
  '23503', null, 'een notitie hoort bij een bestaande job');

-- Taken
select lives_ok(
  $$ insert into public.job_tasks (id, job_id, title)
     values ('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002',
       'Plinten bestellen') $$,
  'een lid voegt een taak toe');
select throws_ok(
  $$ insert into public.job_tasks (job_id, title) values ('bbbbbbbb-0000-0000-0000-000000000002', '') $$,
  '23514', null, 'een lege taak wordt geweigerd');
select lives_ok(
  $$ update public.job_tasks set done_at = now() where id = 'dddddddd-0000-0000-0000-000000000001' $$,
  'een taak afvinken');
select ok(
  exists (select 1 from public.audit_log where table_name = 'job_tasks' and action = 'update'
    and changed_by = '11111111-1111-1111-1111-111111111111'),
  'afvinken staat in het logboek');
select ok(
  exists (select 1 from public.audit_log where table_name = 'job_notes' and action = 'insert'),
  'een notitie toevoegen staat in het logboek');

-- Zoeken
select ok(
  (select detail from public.search_all('draaiend') where kind = 'job') like '%Notitie: Klant wil de deur links draaiend%',
  'een job wordt gevonden via een notitie');
select ok(
  (select detail from public.search_all('plint') where kind = 'job') like '%Taak: Plinten bestellen%',
  'een job wordt gevonden via een taak');
reset role;

-- Niet-leden zien en wijzigen niets.
set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select is_empty($$ select * from public.job_notes $$, 'een niet-lid ziet geen notities');
select is_empty($$ select * from public.job_tasks $$, 'een niet-lid ziet geen taken');
select throws_ok(
  $$ insert into public.job_tasks (job_id, title) values ('bbbbbbbb-0000-0000-0000-000000000001', 'x') $$,
  '42501', null, 'een niet-lid voegt geen taak toe');
reset role;

set local role anon;
select throws_ok($$ select * from public.job_notes $$, '42501', null, 'anoniem heeft geen toegang');
reset role;

select * from finish();
rollback;
