-- Bedrijfsgegevens (fase 2, voorbereiding facturen).
-- De app normaliseert btw-nummers en rekeningnummers; de database weigert alles wat niet
-- de genormaliseerde vorm heeft (hoofdletters, zonder spaties of punten).

alter table public.settings
  add constraint settings_vat_number_format
    check (vat_number is null or vat_number ~ '^[A-Z]{2}[0-9A-Z]{2,13}$'),
  add constraint settings_iban_format
    check (iban is null or iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$');

alter table public.customers
  add constraint customers_vat_number_format
    check (vat_number is null or vat_number ~ '^[A-Z]{2}[0-9A-Z]{2,13}$');
