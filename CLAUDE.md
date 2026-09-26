# CLAUDE.md — Werkregels voor dit project

Web-app (PWA) voor een zelfstandige schrijnwerker: uren, materiaal, verplaatsingen,
offertes, facturen, agenda, zoeken in vorige jobs en analyses.

Zie `docs/PLAN.md` voor het datamodel en de fases, `docs/VRAGEN.md` voor open punten.

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- Supabase: Postgres, Auth, Storage (regio EU)
- Hosting: Vercel of Render (nog te beslissen)
- Tests: Vitest (unit), Playwright (end-to-end)

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
- **Elke berekening (btw, marge, uren × tarief, prijs per stuk, totalen) heeft unit tests.**

## Facturen (juridisch)

- Factuurnummers zijn **doorlopend en zonder gaten**. Een verstuurde factuur
  wordt nooit gewijzigd of verwijderd: corrigeren gebeurt met een creditnota.
- Verplichte vermeldingen (btw-nummer, datum, klantgegevens, btw per tarief, ...)
  worden gecontroleerd vóór een factuur definitief wordt.
- Naast de pdf maken we een **UBL-bestand** (Peppol BIS 3.0) voor de klant en de boekhouder.
- We bouwen **geen boekhouding**. We leveren nette verkoopfacturen aan.

## Data en veiligheid

- Row Level Security staat aan op **elke** tabel.
- Schemawijzigingen enkel via migrations in `supabase/migrations/`. Nooit met de
  hand in het Supabase-dashboard.
- Geheimen (secret key, databasewachtwoord) enkel in environment variables.
  Nooit in code, commits of chat. `.env*` staat in `.gitignore`.
- Alle data moet **exporteerbaar** zijn (csv of Excel), zodat de gebruiker nooit vastzit.

## UX

- **Mobile first**: grote knoppen, bruikbaar met één duim en met werkhandschoenen.
- De belangrijkste acties (inklokken, materiaal toevoegen) zijn binnen 2 tikken bereikbaar.
- Rekening houden met slecht bereik op de werf (offline-ondersteuning is gepland).

## Git-werkwijze

- `main` blijft altijd werkend. Nooit rechtstreeks naar `main` pushen.
- Één feature per branch en per pull request. Kleine, duidelijke commits.
- Vóór elke push slagen lint, typecheck en tests lokaal.

## Werkwijze

- Kleine stappen: eerst werkend, dan mooi.
- Na elke fase test de schrijnwerker de app echt en passen we aan op basis van zijn feedback.
- Twijfel over hoe hij werkt? Dan zet je de vraag in `docs/VRAGEN.md`. Niet gokken.
