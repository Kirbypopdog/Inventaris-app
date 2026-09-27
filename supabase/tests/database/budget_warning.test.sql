-- Tests voor de instelling van de budgetwaarschuwing.
begin;
select no_plan();

select is((select budget_warning_percent from public.settings), 80::smallint,
  'standaard een waarschuwing vanaf 80%');
select throws_ok($$ update public.settings set budget_warning_percent = 0 $$,
  '23514', null, '0% wordt geweigerd');
select throws_ok($$ update public.settings set budget_warning_percent = 101 $$,
  '23514', null, 'meer dan 100% wordt geweigerd');
select lives_ok($$ update public.settings set budget_warning_percent = 90 $$,
  'een ander percentage kan');

select * from finish();
rollback;
