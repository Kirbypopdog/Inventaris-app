# Open vragen

## Voor de boekhouder

- [ ] Met welk boekhoudpakket werkt de boekhouder?
- [ ] Hoe wil hij de verkoopfacturen ontvangen (Peppol, UBL per mail, upload)?

## Voor de schrijnwerker

- [ ] Marge op materiaal: als een job én een materiaal elk een eigen marge hebben, welke
      geldt dan? Nu wint de job (job > materiaal > algemeen). De marge wordt vastgelegd
      bij het toevoegen aan een job, en telt pas mee vanaf de facturen (fase 2).

## Praktisch

- [ ] Accounts (Supabase, hosting, GitHub) overzetten naar het mailadres of
      account van de schrijnwerker. Nu nog op het persoonlijke adres van Victor.
- [x] Hosting kiezen: Render
- [ ] Van het gratis Render-plan naar `starter` zodra de app echt gebruikt wordt
- [ ] Controleren dat het Supabase-project in een EU-regio staat
- [ ] Later misschien: eigen mailserver (bv. Resend) voor "wachtwoord vergeten" per mail
      of facturen versturen. Niet nodig om aan te melden (zie beslissing 005).

## Onderhoud

- [ ] ESLint 10 en TypeScript 7 opnieuw proberen zodra `eslint-config-next` en
      `typescript-eslint` ze ondersteunen. Dan de `ignore`-regels voor `eslint` en
      `typescript` uit `.github/dependabot.yml` halen.
- [ ] `@types/node` mee verhogen wanneer we naar een nieuwere Node-versie gaan (`.nvmrc`).
