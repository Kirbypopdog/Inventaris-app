# 004: Aanmelden met een code per e-mail

> **Vervangen** door [005: Aanmelden met e-mail en wachtwoord](005-aanmelden-met-wachtwoord.md).

**Beslissing:** aanmelden zonder wachtwoord. De gebruiker geeft zijn e-mailadres in en
krijgt een code van 6 cijfers per mail, die hij in de app intypt (Supabase e-mail-OTP).

**Waarom een code en geen link:**

- Een link in een mail opent in de gewone browser, niet in de geïnstalleerde app (PWA).
  Dan is de gebruiker aangemeld in de browser, maar niet in de app.
- Een code werkt ook als de mail op een ander toestel gelezen wordt.
- Geen wachtwoord om te vergeten; de sessie blijft lang geldig, dus aanmelden is zelden nodig.

**Beveiliging:**

- `shouldCreateUser: false` en registreren staat uit: enkel uitgenodigde gebruikers krijgen
  een code.
- De proxy (`src/proxy.ts`) ververst de sessie en stuurt wie niet is aangemeld naar
  `/login`. Dat is enkel een snelle controle; pagina's controleren het lidmaatschap
  opnieuw (`src/lib/auth/session.ts`) en de database bewaakt de toegang met RLS.

**Alternatieven:** link per e-mail (probleem met PWA), wachtwoord (vergeten, zwakke
wachtwoorden), inloggen met Google (niet iedereen wil dat koppelen).
