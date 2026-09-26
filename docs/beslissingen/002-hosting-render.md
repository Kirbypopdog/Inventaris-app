# 002: Hosting op Render

**Beslissing:** de app draait als Node web service op Render, regio Frankfurt,
gedeployed vanaf `main`. De configuratie staat in `render.yaml`.

**Waarom:**

- Er is al een Render-account en er is ervaring mee.
- Regio Frankfurt: dicht bij de gebruiker en de data blijft in de EU (GDPR).
- Commercieel gebruik is toegelaten, ook op het gratis plan (bij Vercel Hobby niet).
- De instellingen staan als code in de repo, dus ze zijn reproduceerbaar.

**Plan:** we starten op `free`. Een gratis service valt na ongeveer 15 minuten zonder
bezoek in slaap en heeft dan tot een minuut nodig om op te starten. Voor het testen is dat
oké, maar niet voor inklokken op de werf. Zodra de schrijnwerker de app echt gebruikt,
schakelen we naar `starter` (altijd aan, betalend).

**Workspace:** een aparte Render-workspace voor dit project, zodat die later in zijn
geheel aan de schrijnwerker overgedragen kan worden.

**Alternatieven:** Vercel (Hobby-plan niet toegelaten voor commercieel gebruik, Pro
betalend), een eigen server (meer onderhoud).
