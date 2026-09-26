# 001: Geld als integer in eurocent

**Beslissing:** alle bedragen zijn gehele getallen in eurocent. Percentages (marge) in
basispunten (1% = 100). Alle rekenwerk gaat via `src/lib/money.ts`.

**Waarom:** met kommagetallen rekent een computer onnauwkeurig (0,1 + 0,2 ≠ 0,3). Op een
factuur mag er geen cent verschil zijn.

**Afronden:** één keer, op het eind van een berekening, half weg van nul. Btw wordt
per tarief op de som van de regels berekend (zoals Peppol/UBL het controleert),
niet per regel.

**Alternatieven:** een decimal-bibliotheek (extra afhankelijkheid, niet nodig voor
bedragen van deze grootte), of `numeric` in Postgres met strings in de app (omslachtiger).
