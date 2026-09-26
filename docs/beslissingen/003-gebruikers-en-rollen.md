# 003: Eén bedrijf, meerdere gebruikers met rollen

**Beslissing:** de app is voor één bedrijf. Alle gegevens horen bij dat bedrijf, niet bij
een individuele gebruiker. Wie toegang heeft, staat in de tabel `app_users` met een rol.

- `owner`: de schrijnwerker.
- `admin`: beheerder (Victor). Mag alles wat de eigenaar mag, inclusief gegevens bewerken.
- Later mogelijk `medewerker`: een rol toevoegen is één migratie (`alter type ... add value`).

**Toegang:**

- Zelf registreren staat uit. Gebruikers worden uitgenodigd via het Supabase-dashboard
  en daarna toegevoegd aan `app_users` (zie `docs/BEHEER.md`).
- Row Level Security op elke tabel: enkel wie in `app_users` staat, ziet of wijzigt iets.
  Een account zonder rol ziet niets.
- Niemand kan zichzelf via de app een rol geven: `app_users` is enkel leesbaar via de API.

**Logboek:** elke wijziging aan bedrijfsgegevens (toevoegen, wijzigen, verwijderen) komt
automatisch in `audit_log`, met wie, wanneer, en de oude en nieuwe waarde. Dat gebeurt in
de database zelf (triggers), dus ook wijzigingen buiten de app worden gelogd. Het
logboek is niet te wijzigen via de API.

**Klaar voor een medewerker:** tijdsregistraties, materiaalverbruik en verplaatsingen
bewaren wie ze ingaf. Het uurtarief wordt per tijdsregistratie vastgelegd, niet per persoon.
Wat een medewerker mag zien (bv. geen marges of facturen) bouwen we pas als het nodig is.

**Alternatieven:**

- Meerdere bedrijven in één database (multi-tenant): veel complexer, niet nodig.
- Rechten per gebruiker in de app-code in plaats van in de database: minder veilig, want
  dan beschermt enkel de app de gegevens.
