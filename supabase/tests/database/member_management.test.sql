-- Tests voor gebruikersbeheer: wie mag leden toevoegen, wijzigen en verwijderen.
begin;
select no_plan();

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'eigenaar@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'admin@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'nieuw@example.com'),
  ('44444444-4444-4444-4444-444444444444', 'vreemde@example.com');

select private.add_app_user('eigenaar@example.com', 'owner', 'Eigenaar');
select private.add_app_user('admin@example.com', 'admin', 'Admin');

-- Anonieme bezoeker
set local role anon;
select throws_ok($$ select * from public.list_members() $$, '42501', null,
  'anon kan de ledenlijst niet opvragen');
reset role;

-- Ingelogd zonder rol
set local role authenticated;
set local request.jwt.claims to '{"sub": "44444444-4444-4444-4444-444444444444", "role": "authenticated"}';

select throws_ok($$ select * from public.list_members() $$, '42501', null,
  'niet-lid kan de ledenlijst niet opvragen');
select throws_ok(
  $$ select public.add_member('vreemde@example.com', 'owner', 'Ik') $$, '42501', null,
  'niet-lid kan zichzelf niet toevoegen');
select throws_ok(
  $$ select public.remove_member('22222222-2222-2222-2222-222222222222') $$, '42501', null,
  'niet-lid kan niemand verwijderen');
reset role;

-- Eigenaar beheert leden
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is(
  (select array_agg(email order by email) from public.list_members()),
  array['admin@example.com', 'eigenaar@example.com'],
  'eigenaar ziet de leden met hun e-mailadres'
);

select is(
  public.add_member(' Nieuw@Example.com ', 'owner', '  Nieuwe collega '),
  '33333333-3333-3333-3333-333333333333'::uuid,
  'eigenaar kan een bestaand account lid maken'
);

select is(
  (select display_name from public.app_users where user_id = '33333333-3333-3333-3333-333333333333'),
  'Nieuwe collega',
  'de naam wordt bijgesneden'
);

select throws_ok(
  $$ select public.add_member('nieuw@example.com', 'owner', 'Dubbel') $$, '23505', null,
  'een lid kan niet twee keer toegevoegd worden');

select throws_ok(
  $$ select public.add_member('bestaat-niet@example.com', 'owner', 'X') $$, 'P0002', null,
  'een onbekend account geeft een duidelijke fout');

select lives_ok(
  $$ select public.update_member('33333333-3333-3333-3333-333333333333', 'admin', 'Collega') $$,
  'eigenaar kan rol en naam van een ander wijzigen');

select lives_ok(
  $$ select public.update_member('11111111-1111-1111-1111-111111111111', 'owner', 'Baas') $$,
  'eigenaar kan zijn eigen naam wijzigen');

select throws_ok(
  $$ select public.update_member('11111111-1111-1111-1111-111111111111', 'admin', 'Baas') $$,
  '42501', null,
  'eigenaar kan zijn eigen rol niet wijzigen');

select throws_ok(
  $$ select public.remove_member('11111111-1111-1111-1111-111111111111') $$, '42501', null,
  'je kan jezelf niet verwijderen');

select lives_ok(
  $$ select public.remove_member('33333333-3333-3333-3333-333333333333') $$,
  'eigenaar kan een lid verwijderen');

select throws_ok(
  $$ select public.remove_member('33333333-3333-3333-3333-333333333333') $$, 'P0002', null,
  'een lid dat er niet (meer) is verwijderen geeft een duidelijke fout');

select is(
  (select array_agg(action order by id) from public.audit_log
    where table_name = 'app_users' and row_id = '33333333-3333-3333-3333-333333333333'
      and changed_by = '11111111-1111-1111-1111-111111111111'),
  array['insert', 'update', 'delete'],
  'toevoegen, wijzigen en verwijderen staan in het logboek met wie het deed'
);

reset role;

-- Admin heeft dezelfde rechten
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select lives_ok(
  $$ select public.add_member('nieuw@example.com', 'owner', 'Terug') $$,
  'admin kan leden toevoegen');

reset role;

select * from finish();
rollback;
