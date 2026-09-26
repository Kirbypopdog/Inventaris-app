# Plan

## Doel

Eén app waarin de schrijnwerker per job bijhoudt wat hij doet en gebruikt, en daar
offertes en facturen uit maakt. Achteraf kan hij zoeken in al zijn vorige jobs en
ziet hij analyses.

## Datamodel (eerste versie)

Alles hangt aan een **job**.

```
customers           klanten (particulier of bedrijf, btw-nummer, adres)
  └─ jobs           een opdracht/werf (adres, status, omschrijving, tags)
       ├─ time_entries      inklokken/uitklokken (start, stop, uurtarief, notitie)
       ├─ material_usages   verbruik (materiaal, aantal, prijs per stuk op dat moment)
       ├─ trips             verplaatsingen (km of forfait, tarief)
       ├─ calendar_events   planning
       └─ attachments       foto's, plannen

materials           catalogus (bv. doos 200 vijzen à €12,00 → €0,06/stuk)
quotes              offertes + quote_lines
invoices            facturen + invoice_lines (doorlopende nummering)
hourly_rates        benoemde uurtarieven (bv. werkplaats, plaatsing), één is standaard
settings            bedrijfsgegevens, logo, standaardwaarden (zie hieronder)
```

## Instellingen: alles aanpasbaar in de app

Er staan geen bedrijfswaarden vast in de code. Alles komt uit de instellingen en
kan per klant of per job overschreven worden.

| Instelling | Standaard in de app | Overschrijfbaar per |
|---|---|---|
| Uurtarieven | lijst van benoemde tarieven, één is standaard | job, tijdsregistratie |
| Verplaatsingen | methode: per km, forfait per rit of inbegrepen | klant, job |
| Km-tarief / forfaitbedrag | bedrag in eurocent | job |
| Marge op materiaal | percentage | materiaal, job |
| Klanttype | particulier of bedrijf (bepaalt standaard-btw en Peppol) | klant |
| Btw-tarief | 21%, of 6% bij renovatie woning > 10 jaar | job, factuurregel |

Volgorde van voorrang: **regel > job > klant > algemene instelling**.

Belangrijke keuzes:

- **Prijzen worden vastgelegd op het moment van gebruik.** Als de prijs van een doos
  vijzen stijgt, veranderen oude jobs niet mee.
- Een offerte kan omgezet worden naar een factuur. Een factuur kan ook opgebouwd
  worden uit de geregistreerde uren, het materiaal en de verplaatsingen van een job.
- Bedragen in eurocent (zie `CLAUDE.md`).

## Fases

### Fase 0: Opzet
- [x] Supabase-project aangemaakt
- [ ] Werkregels en plan (`CLAUDE.md`, `docs/`)
- [ ] Next.js-project, Supabase-koppeling, tests, CI (GitHub Actions)
- [ ] Eerste lege versie online

### Fase 1: De basis
- [ ] Inloggen
- [ ] Klanten
- [ ] Jobs
- [ ] **Inklokknop** (eerste echte functie)
- [ ] Materiaalcatalogus en materiaal per job
- [ ] Verplaatsingen per job

### Fase 2: Geld
- [ ] Offertes (pdf)
- [ ] Facturen (pdf + UBL), doorlopende nummering, creditnota's
- [ ] Btw-logica (6%/21%) en marge op materiaal

### Fase 3: Overzicht
- [ ] Agenda
- [ ] Zoeken in vorige jobs
- [ ] Analyses: winst per job, uren per maand, materiaalkosten
- [ ] Export naar csv/Excel

### Fase 4: Afwerking
- [ ] Peppol-verzending (via Billit of een andere access point)
- [ ] Offline werken en synchroniseren
- [ ] Foto's op de werf

## Kosten

Starten op de gratis versies. Overstappen naar betaalde plannen (degelijke backups,
commercieel gebruik van de hosting) zodra er echte facturen door de app gaan.
