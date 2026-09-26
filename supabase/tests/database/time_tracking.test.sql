-- Tests voor inklokken, uitklokken en het standaard-uurtarief.
begin;
select no_plan();

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'eigenaar@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'vreemde@example.com');
select private.add_app_user('eigenaar@example.com', 'owner', 'Eigenaar');

insert into public.customers (id, type, name)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'private', 'Klant');
insert into public.jobs (id, customer_id, title, status) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Keuken', 'planned'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Trap', 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Kast', 'done');

-- Deze tests gaan uit van geen uurtarieven (rollback achteraf).
delete from public.hourly_rates;

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select throws_ok(
  $$ select public.clock_in('bbbbbbbb-0000-0000-0000-000000000001') $$, 'TS001', null,
  'zonder standaard-uurtarief kan je niet inklokken');

insert into public.hourly_rates (id, name, rate_cents) values
  ('cccccccc-0000-0000-0000-000000000001', 'Werkplaats', 4500),
  ('cccccccc-0000-0000-0000-000000000002', 'Plaatsing', 5500);

select lives_ok($$ select public.set_default_hourly_rate('cccccccc-0000-0000-0000-000000000001') $$,
  'een uurtarief kan standaard gemaakt worden');
select lives_ok($$ select public.set_default_hourly_rate('cccccccc-0000-0000-0000-000000000002') $$,
  'een ander tarief standaard maken lukt in één stap');
select is((select count(*)::int from public.hourly_rates where is_default), 1,
  'er is altijd maar één standaard-uurtarief');
select throws_ok($$ select public.set_default_hourly_rate('cccccccc-0000-0000-0000-000000000009') $$,
  'P0002', null, 'een onbekend tarief geeft een duidelijke fout');

-- Inklokken
select is(
  (public.clock_in('bbbbbbbb-0000-0000-0000-000000000001')).hourly_rate_cents,
  5500,
  'inklokken legt het standaard-uurtarief vast'
);
select is((select status::text from public.jobs where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'active', 'een geplande job wordt bezig bij het inklokken');

-- Wisselen van job: de lopende klok stopt en een nieuwe start
update public.jobs set hourly_rate_id = 'cccccccc-0000-0000-0000-000000000001'
  where id = 'bbbbbbbb-0000-0000-0000-000000000002';
select is(
  (public.clock_in('bbbbbbbb-0000-0000-0000-000000000002')).hourly_rate_cents,
  4500,
  'een job met een eigen uurtarief gebruikt dat tarief'
);
select is((select count(*)::int from public.time_entries where ended_at is null), 1,
  'na wisselen loopt er maar één klok');
select ok(
  (select ended_at > started_at from public.time_entries
    where job_id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'de vorige klok is netjes gestopt'
);

select throws_ok($$ select public.clock_in('bbbbbbbb-0000-0000-0000-000000000003') $$, 'TS003', null,
  'op een afgewerkte job kan je niet inklokken');
select throws_ok($$ select public.clock_in('bbbbbbbb-0000-0000-0000-000000000009') $$, 'P0002', null,
  'een onbekende job geeft een duidelijke fout');

-- Uitklokken
select is((public.clock_out()).job_id, 'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
  'uitklokken stopt de lopende klok');
select is((select count(*)::int from public.time_entries where ended_at is null), 0,
  'daarna loopt er geen klok meer');
select throws_ok($$ select public.clock_out() $$, 'TS002', null,
  'uitklokken zonder lopende klok geeft een duidelijke fout');

select ok(
  exists (select 1 from public.audit_log where table_name = 'time_entries' and action = 'update'
    and changed_by = '11111111-1111-1111-1111-111111111111'),
  'in- en uitklokken staat in het logboek'
);
reset role;

-- Niet-leden
set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select throws_ok($$ select public.clock_in('bbbbbbbb-0000-0000-0000-000000000002') $$, '42501', null,
  'een niet-lid kan niet inklokken');
select throws_ok($$ select public.clock_out() $$, '42501', null, 'een niet-lid kan niet uitklokken');
select throws_ok($$ select public.set_default_hourly_rate('cccccccc-0000-0000-0000-000000000001') $$,
  '42501', null, 'een niet-lid kan geen tarieven wijzigen');
reset role;

set local role anon;
select throws_ok($$ select public.clock_out() $$, '42501', null, 'anon kan de functies niet uitvoeren');
reset role;

select * from finish();
rollback;
