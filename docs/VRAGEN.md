# Open vragen

## Voor de boekhouder

- [ ] Met welk boekhoudpakket werkt de boekhouder?
- [ ] Hoe wil hij de verkoopfacturen ontvangen (Peppol, UBL per mail, upload)?

## Praktisch

- [ ] Accounts (Supabase, hosting, GitHub) overzetten naar het mailadres of
      account van de schrijnwerker. Nu nog op het persoonlijke adres van Victor.
- [x] Hosting kiezen: Render
- [ ] Van het gratis Render-plan naar `starter` zodra de app echt gebruikt wordt
- [ ] Controleren dat het Supabase-project in een EU-regio staat
- [ ] Eigen mailserver (SMTP) instellen in Supabase, bv. via Resend. De ingebouwde
      mailservice van Supabase stuurt enkel naar leden van het Supabase-team en maar een
      paar mails per uur. Nodig vóór de schrijnwerker kan aanmelden. Vraagt een eigen
      domeinnaam (voor het afzenderadres).

## Onderhoud

- [ ] ESLint 10 en TypeScript 7 opnieuw proberen zodra `eslint-config-next` en
      `typescript-eslint` ze ondersteunen. Dan de `ignore`-regels voor `eslint` en
      `typescript` uit `.github/dependabot.yml` halen.
- [ ] `@types/node` mee verhogen wanneer we naar een nieuwere Node-versie gaan (`.nvmrc`).
