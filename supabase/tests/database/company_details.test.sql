-- Tests voor de vorm van btw-nummers en rekeningnummers.
begin;
select no_plan();

select lives_ok(
  $$ update public.settings set vat_number = 'BE0123456749', iban = 'BE68539007547034' $$,
  'genormaliseerde btw- en rekeningnummers worden aanvaard');
select lives_ok(
  $$ update public.settings set vat_number = null, iban = null $$,
  'zonder btw- en rekeningnummer mag ook');
select throws_ok(
  $$ update public.settings set vat_number = 'BE 0123.456.749' $$,
  '23514', null, 'een btw-nummer met spaties of punten wordt geweigerd');
select throws_ok(
  $$ update public.settings set iban = 'be68 5390 0754 7034' $$,
  '23514', null, 'een rekeningnummer met spaties of kleine letters wordt geweigerd');
select throws_ok(
  $$ insert into public.customers (type, name, vat_number) values ('business', 'Klant', 'be0123456749') $$,
  '23514', null, 'ook bij een klant moet het btw-nummer genormaliseerd zijn');

select * from finish();
rollback;
