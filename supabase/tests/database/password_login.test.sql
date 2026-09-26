-- Tests voor aanmelden met wachtwoord: eerste beheerder, tijdelijke wachtwoorden.
begin;
select no_plan();

-- Deze tests gaan uit van een lege ledenlijst (rollback achteraf).
delete from public.app_users;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'beheerder@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'collega@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'vreemde@example.com');

-- ---------------------------------------------------------------------------
-- bootstrap_admin: enkel met de geheime sleutel, enkel zolang er geen leden zijn
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select throws_ok($$ select public.bootstrap_admin('vreemde@example.com') $$, '42501', null,
  'een gewone gebruiker kan zichzelf geen beheerder maken');
reset role;

set local role service_role;
select throws_ok($$ select public.bootstrap_admin('onbekend@example.com') $$, 'P0002', null,
  'bootstrap_admin weigert een onbekend account');
select is(public.bootstrap_admin(' Beheerder@Example.com '), true,
  'de eerste beheerder wordt aangemaakt');
select is(public.bootstrap_admin('collega@example.com'), false,
  'zodra er een lid is, doet bootstrap_admin niets meer');
reset role;

select results_eq(
  $$ select role::text, must_change_password from public.app_users $$,
  $$ values ('admin', true) $$,
  'de eerste beheerder moet eerst een eigen wachtwoord kiezen'
);

-- ---------------------------------------------------------------------------
-- mark_password_changed: eigen wachtwoord gekozen
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
select lives_ok($$ select public.mark_password_changed() $$,
  'een lid kan aangeven dat het een eigen wachtwoord koos');
select is(
  (select must_change_password from public.list_members() where email = 'beheerder@example.com'),
  false,
  'daarna hoeft het geen wachtwoord meer te kiezen'
);

-- Nieuwe leden krijgen een tijdelijk wachtwoord
select public.add_member('collega@example.com', 'owner', 'Collega');
select is(
  (select must_change_password from public.list_members() where email = 'collega@example.com'),
  true,
  'een nieuw lid moet eerst een eigen wachtwoord kiezen'
);

-- ---------------------------------------------------------------------------
-- require_password_change: beheerder reset het wachtwoord van een ander
-- ---------------------------------------------------------------------------

select public.mark_password_changed();
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select public.mark_password_changed();
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
select lives_ok($$ select public.require_password_change('22222222-2222-2222-2222-222222222222') $$,
  'een beheerder kan een ander een nieuw tijdelijk wachtwoord geven');
select is(
  (select must_change_password from public.app_users where user_id = '22222222-2222-2222-2222-222222222222'),
  true,
  'dat lid moet daarna weer een eigen wachtwoord kiezen'
);
select throws_ok($$ select public.require_password_change('11111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'je eigen wachtwoord reset je niet via beheer');
select throws_ok($$ select public.require_password_change('33333333-3333-3333-3333-333333333333') $$,
  'P0002', null,
  'een account dat geen lid is, geeft een duidelijke fout');
reset role;

-- Geen lid
set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select throws_ok($$ select public.mark_password_changed() $$, '42501', null,
  'een niet-lid kan niets markeren');
select throws_ok($$ select public.require_password_change('22222222-2222-2222-2222-222222222222') $$,
  '42501', null,
  'een niet-lid kan geen wachtwoorden resetten');
reset role;

set local role anon;
select throws_ok($$ select public.mark_password_changed() $$, '42501', null,
  'anon kan de functie niet uitvoeren');
reset role;

select * from finish();
rollback;
