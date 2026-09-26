# 005: Aanmelden met e-mail en wachtwoord

Vervangt [004](004-aanmelden-met-code.md).

**Beslissing:** aanmelden met e-mailadres en wachtwoord, zoals in de uurrooster-app.
Er worden geen mails verstuurd.

- **Eerste beheerder:** `ADMIN_EMAIL` en `ADMIN_PASSWORD` in Render. Bij het opstarten
  maakt de app dat account aan en maakt het beheerder, maar enkel zolang er nog geen enkel
  lid is (`src/lib/auth/bootstrap.ts`, databasefunctie `bootstrap_admin`). Een bestaand
  wachtwoord wordt nooit overschreven.
- **Nieuwe gebruikers:** een beheerder maakt ze aan in de app met een tijdelijk wachtwoord.
- **Tijdelijk wachtwoord:** wie aanmeldt met een tijdelijk wachtwoord (ook de eerste
  beheerder), moet eerst een eigen wachtwoord kiezen (`/wachtwoord`). Zo kent enkel de
  gebruiker zelf zijn wachtwoord, ook niet wie het in Render zette.
- **Wachtwoord vergeten:** de beheerder geeft in de app een nieuw tijdelijk wachtwoord.
- **Minstens 10 tekens**, gecontroleerd in de app (`src/lib/auth/schemas.ts`).

**Waarom (en niet meer de code per e-mail):**

- Geen mailserver nodig. De ingebouwde mail van Supabase stuurt enkel naar teamleden;
  een eigen mailserver vraagt een domeinnaam en extra instellingen.
- Minder instellen: enkel drie waarden in Render, geen Supabase-dashboard.
- Werkt ook in de geïnstalleerde app (PWA) zonder heen en weer naar de mailbox.

**Alternatieven:** code per e-mail (vorige beslissing, vraagt een mailserver), inloggen
met Google (niet iedereen wil dat koppelen).
