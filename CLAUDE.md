# CLAUDE.md — Werkregels voor dit project

@AGENTS.md

Web-app (PWA) voor een zelfstandige schrijnwerker: uren, materiaal, verplaatsingen,
offertes, facturen, agenda, zoeken in vorige jobs en analyses.

Zie `docs/PLAN.md` voor het datamodel en de fases, `docs/VRAGEN.md` voor open punten.

## Stack

- Next.js 16 (App Router) + TypeScript (strict) + Tailwind CSS 4
- Supabase: Postgres, Auth, Storage (regio EU). Clients in `src/lib/supabase/`.
- Validatie: zod
- Hosting: Render, regio Frankfurt, via `render.yaml` (zie `docs/beslissingen/002-hosting-render.md`)
- Tests: Vitest (unit), pgTAP (database), Playwright (end-to-end, mobiel, `e2e/`)
- Aanmelden: e-mail en wachtwoord via Supabase Auth, geen mails (zie
  `docs/beslissingen/005-aanmelden-met-wachtwoord.md`). Pagina's halen de sessie op via
  `requireSession()` uit `src/lib/auth/session.ts`; die stuurt wie een tijdelijk wachtwoord
  heeft eerst naar `/wachtwoord`.

## Commando's

- `npm run dev`: lokaal draaien (vraagt een `.env.local`, zie `.env.example`)
- `npm run check`: lint, formattering, typecheck en tests. **Moet slagen vóór elke commit.**
- `npm run build`: productie-build (draait ook in CI)
- `npm run format`: code automatisch formatteren
- `npx supabase migration new <naam>`: nieuwe databasemigratie
- `npm run db:start` / `npm run db:reset`: lokale Supabase-database (Docker) starten of
  opnieuw opbouwen uit de migraties
- `npm run db:test`: database-tests (pgTAP, `supabase/tests/`), vooral voor RLS en constraints
- `npm run db:lint`: SQL-functies controleren
- `npm run db:types`: TypeScript-types genereren na een schemawijziging. CI controleert
  dat `src/lib/supabase/database.types.ts` up-to-date is.
- `npm run test:e2e`: end-to-end-tests tegen een lokale Supabase (zie `e2e/README.md`).
  Elke nieuwe gebruikersflow krijgt een e2e-test.

## Taal

- **UI-teksten in het Nederlands (Vlaams)**: "offerte", "factuur", "werf", "vijzen".
- **Code, variabelen, database-kolommen en commits in het Engels.**

## Geld en berekeningen

- **Bedragen altijd als integer in eurocent** (`amount_cents`). Nooit floats voor geld.
- Btw-percentage per regel opslaan (0, 6 of 21). Standaard 21%, 6% bij renovatie
  van een woning ouder dan 10 jaar (particulier).
- Afronden gebeurt **alleen** bij het tonen of op het eind van een berekening,
  op één centrale plek (`lib/money.ts`).
- Prijs per stuk wordt afgeleid: prijs verpakking / aantal per verpakking.
  Bewaar beide, niet enkel het afgeleide getal.
- **Geen bedrijfswaarden hardcoderen** (uurtarief, km-tarief, marge, btw-standaard).
  Alles komt uit de instellingen in de app, met voorrang regel > job > klant > algemeen.
  Zie `docs/PLAN.md`.
- **Elke berekening (btw, marge, uren × tarief, prijs per stuk, totalen) heeft unit tests.**

## Facturen (juridisch)

- Factuurnummers zijn **doorlopend en zonder gaten**. Een verstuurde factuur
  wordt nooit gewijzigd of verwijderd: corrigeren gebeurt met een creditnota.
- Verplichte vermeldingen (btw-nummer, datum, klantgegevens, btw per tarief, ...)
  worden gecontroleerd vóór een factuur definitief wordt.
- Naast de pdf maken we een **UBL-bestand** (Peppol BIS 3.0) voor de klant en de boekhouder.
- We bouwen **geen boekhouding**. We leveren nette verkoopfacturen aan.

## Data en veiligheid

- Row Level Security staat aan op **elke** tabel. Toegang enkel voor leden in `app_users`
  (zie `docs/beslissingen/003-gebruikers-en-rollen.md`). Elke nieuwe tabel krijgt RLS,
  policies, de `updated_at`- en logboektriggers, en database-tests.
- Schemawijzigingen enkel via migrations in `supabase/migrations/`. Nooit met de
  hand in het Supabase-dashboard. Na merge naar `main` past GitHub Actions ze toe
  (`deploy-database.yml`). Een migratie die al op `main` staat, wijzig je nooit meer:
  maak een nieuwe.
- Geheimen (secret key, databasewachtwoord) enkel in environment variables.
  Nooit in code, commits of chat. `.env*` staat in `.gitignore`.
- De geheime sleutel (`SUPABASE_SECRET_KEY`, `src/lib/supabase/admin.ts`) omzeilt RLS. Enkel
  gebruiken voor wat de sessie van de gebruiker niet kan (bv. accounts aanmaken), en pas
  nadat de rechten gecontroleerd zijn. Gegevens wijzigen gebeurt met de sessie van de
  gebruiker, zodat RLS en het logboek blijven werken.
- Alle data moet **exporteerbaar** zijn (csv of Excel), zodat de gebruiker nooit vastzit.

## UX

- **Mobile first**: grote knoppen, bruikbaar met één duim en met werkhandschoenen.
- **Ook op de laptop bruikbaar**: vanaf `md` staat het menu links en gebruiken pagina's de
  breedte (kolommen, `pageClass` uit `src/components/page.tsx`). Nieuwe pagina's gebruiken
  `pageClass` en `PageHeader`; e2e-tests over de indeling draaien ook in het `desktop`-project.
- De belangrijkste acties (inklokken, materiaal toevoegen) zijn binnen 2 tikken bereikbaar.
- Rekening houden met slecht bereik op de werf (offline-ondersteuning is gepland).

### Bij elke toevoeging: eerst goed nadenken over UI/UX

Elke nieuwe functie of wijziging aan het scherm krijgt vóór de code een korte UX-afweging,
en na de code een controle op schermafbeeldingen (gsm, laptop én donker). Vragen om te
stellen:

- **Waar hoort het?** Past het in een bestaand scherm of tabblad in plaats van een nieuwe
  pagina of een nieuw menu-item? Het menu blijft klein (gsm: 5 items).
- **Wat is de hoofdactie?** Eén duidelijke primaire knop per scherm of kaart. Formulieren om
  iets toe te voegen staan niet standaard open als er al een lijst is: eerst de lijst, het
  formulier achter "+ Nieuw …" (`Disclosure`).
- **Hoe lang wordt het?** Geen eindeloze pagina's op de gsm; gebruik tabbladen, kaarten of
  uitklappen. Geen dubbele info (dezelfde jobs twee keer, een titel die het tabblad herhaalt).
- **Hergebruik de bouwstenen** in plaats van nieuwe stijlen: `pageClass`, `PageHeader`,
  `cardClass`, knoppen uit `form.tsx`, `Disclosure`, `FilterChips`, `StepNav`,
  linkstijlen uit `page.tsx` (`textLinkClass`, `quietLinkClass`, `titleLinkClass`). Geen
  onderlijnde links, geen losse kleuren: enkel de tokens (`brand`, `wood`, `stone`).
- **Werkt het in alle omstandigheden?** Lege lijst (vriendelijke lege staat), veel data (lange
  namen, veel regels), foutmelding in het Nederlands, donkere modus, en snel: een klik op
  iets dat enkel het scherm verandert (inklappen, tabblad) mag niet op de server wachten.
- **Is het consistent?** Zelfde woorden als elders (Projecten, Ritten, Offertes), zelfde
  volgorde en plaats van knoppen, datums kort ("21–25 sep 2026").

## Git-werkwijze

- `main` blijft altijd werkend. Nooit rechtstreeks naar `main` pushen.
- Één feature per branch en per pull request. Kleine, duidelijke commits.
- Vóór elke push slagen lint, typecheck en tests lokaal.
- Claude mag een pull request zelf mergen (squash) zodra alle CI-controles groen zijn.
- Elke merge naar `main` wordt automatisch gedeployed naar https://schrijnwerk.onrender.com.

## Kwaliteit: robuust en zonder technische schuld

- **TypeScript strict**, inclusief `noUncheckedIndexedAccess`. Geen `any`, geen `@ts-ignore`,
  geen `!` om de typecheck te omzeilen. Los het type echt op.
- **Valideer alles wat van buiten komt** (formulieren, URL-parameters, env, API-antwoorden)
  met zod, op de grens. Daarbinnen mag de code op de types vertrouwen.
- **De database bewaakt zichzelf ook**: `not null`, foreign keys, `check`-constraints
  (bv. bedragen zijn integers, einde na begin). De app is niet de enige verdediging.
- **Fouten nooit stil inslikken.** Toon de gebruiker een duidelijke Nederlandse melding
  en log de technische fout. Een `catch` zonder afhandeling vraagt een comment waarom.
- **Geen dode code**, geen uitgecommentarieerde code, geen `TODO` zonder dat het in
  `docs/PLAN.md` of `docs/VRAGEN.md` staat.
- **Geen quick fixes die later terugkomen.** Past iets niet in de structuur, pas dan de
  structuur aan in plaats van eromheen te werken.
- **Weinig afhankelijkheden.** Een nieuw pakket enkel als het echt iets oplost dat we
  niet in een paar regels zelf doen. Dependabot houdt ze wekelijks up-to-date.
- **Geen waarschuwingen negeren** (lint, build, deprecations). Oplossen of bewust uitzetten
  met een comment waarom.
- **Belangrijke keuzes** (bv. hosting, offline-aanpak) krijgen een korte uitleg in
  `docs/beslissingen/`: wat, waarom, welke alternatieven.
- **Klaar betekent**: werkt, heeft tests, `npm run check` en de build slagen, en de
  documentatie klopt nog.

## Werkwijze

- Kleine stappen: eerst werkend, dan mooi.
- Na elke fase test de schrijnwerker de app echt en passen we aan op basis van zijn feedback.
- Twijfel over hoe hij werkt? Dan zet je de vraag in `docs/VRAGEN.md`. Niet gokken.
