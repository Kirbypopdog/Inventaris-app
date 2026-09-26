# Beheer

Handleiding voor de admin. Geen geheimen in dit bestand zetten.

## Eenmalig instellen

### 1. Zelf registreren uitzetten (Supabase)

Supabase-dashboard → **Authentication → Sign In / Providers** → zet
**Allow new users to sign up** uit. Zo kan niemand zelf een account aanmaken.

### 2. Migraties automatisch laten toepassen (GitHub)

De workflow `.github/workflows/deploy-database.yml` past nieuwe migraties toe op de
productiedatabase zodra ze op `main` staan. Daarvoor zijn twee GitHub-secrets nodig:
GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**.

| Secret                  | Waar te vinden                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → avatar rechtsboven → **Account preferences → Access Tokens** → nieuw token |
| `SUPABASE_DB_PASSWORD`  | het databasewachtwoord van bij het aanmaken van het project                               |

Wachtwoord kwijt? Supabase → **Project Settings → Database → Reset database password**.

### 3. Aanmeldmail instellen (Supabase)

De app werkt met een code van 6 cijfers (zie `docs/beslissingen/004-aanmelden-met-code.md`).
Supabase → **Authentication → Emails → Templates → Magic Link**:

- **Subject:** `Je aanmeldcode voor Schrijnwerk`
- **Body:** de inhoud van `supabase/templates/magic-link.html` (bevat `{{ .Token }}`)

### 4. Adres van de app (Supabase)

Supabase → **Authentication → URL Configuration** → **Site URL**:
`https://schrijnwerk.onrender.com`

### 5. Eigen mailserver (Supabase)

De ingebouwde mailservice van Supabase stuurt enkel naar leden van het Supabase-team en
maar een paar mails per uur. Voor echte gebruikers: **Authentication → Emails → SMTP
Settings** met een eigen mailprovider (bv. Resend). Zie `docs/VRAGEN.md`.

## Een gebruiker toevoegen

1. Supabase → **Authentication → Users → Add user → Send invitation** met het e-mailadres.
2. Supabase → **SQL Editor**, en voer uit (rol: `owner` of `admin`):

   ```sql
   select private.add_app_user('naam@voorbeeld.be', 'owner', 'Voornaam');
   ```

Dit wijzigt enkel gegevens, niet het schema. Zonder deze stap kan iemand wel inloggen,
maar ziet die niets.

3. De gebruiker surft naar de app, geeft zijn e-mailadres in en typt de code uit de mail.
   De uitnodigingsmail van stap 1 mag hij negeren.

## Een gebruiker verwijderen

Supabase → **Authentication → Users** → gebruiker verwijderen. Zijn rol verdwijnt mee.
Heeft de gebruiker al uren of materiaal geregistreerd, dan weigert de database het
verwijderen, zodat de geschiedenis bewaard blijft. Neem dan contact op met de admin.

## Logboek bekijken

Supabase → **Table Editor → audit_log**, of in de SQL Editor:

```sql
select changed_at, table_name, action, changed_by, old_data, new_data
from public.audit_log
order by changed_at desc
limit 50;
```
