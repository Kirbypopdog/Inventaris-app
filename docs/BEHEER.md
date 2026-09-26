# Beheer

Handleiding voor de beheerder. Geen geheimen in dit bestand zetten.

## Eenmalig instellen

### 1. Render

Render → service **schrijnwerk** → **Environment**:

| Naam                  | Waarde                                                                         |
| --------------------- | ------------------------------------------------------------------------------ |
| `SUPABASE_SECRET_KEY` | Supabase → **Project Settings → API Keys** → de **secret key** (`sb_secret_…`) |
| `ADMIN_EMAIL`         | jouw e-mailadres                                                               |
| `ADMIN_PASSWORD`      | een startwachtwoord van minstens 10 tekens                                     |

Na het opslaan herstart Render de app. Die maakt dan jouw account aan als beheerder (enkel
zolang er nog niemand toegang heeft). Meld aan met dat e-mailadres en startwachtwoord; de
app vraagt meteen een eigen wachtwoord te kiezen. Daarna mag `ADMIN_PASSWORD` blijven
staan of verwijderd worden: het wordt niet meer gebruikt.

### 2. Zelf registreren uitzetten (Supabase)

Supabase → **Authentication → Sign In / Providers** → **Allow new users to sign up** uit.
Zo kan niemand buiten de app een account aanmaken.

### 3. Migraties automatisch laten toepassen (GitHub)

De workflow `.github/workflows/deploy-database.yml` past nieuwe migraties toe op de
productiedatabase zodra ze op `main` staan. Daarvoor zijn twee GitHub-secrets nodig:
GitHub → repo → **Settings → Secrets and variables → Actions**.

| Secret                  | Waar te vinden                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → avatar rechtsboven → **Account preferences → Access Tokens** → nieuw token |
| `SUPABASE_DB_PASSWORD`  | het databasewachtwoord (te resetten via **Project Settings → Database**)                  |

## Gebruikers beheren

In de app: startpagina → **Gebruikers beheren** (eigenaar en beheerder).

- **Toevoegen:** naam, e-mailadres, rol en een tijdelijk wachtwoord. Geef het tijdelijke
  wachtwoord persoonlijk door. Bij het eerste aanmelden kiest de gebruiker een eigen
  wachtwoord.
- **Wachtwoord vergeten:** vul bij die gebruiker een nieuw tijdelijk wachtwoord in en klik
  **Wachtwoord resetten**.
- **Verwijderen:** de toegang stopt meteen. Het account blijft bestaan zodat de
  geschiedenis (uren, logboek) klopt.

Je eigen rol wijzigen of jezelf verwijderen kan niet, zodat je jezelf niet buitensluit.
Je eigen wachtwoord wijzig je via **Wachtwoord wijzigen** op de startpagina.

## Logboek bekijken

Supabase → **Table Editor → audit_log**, of in de SQL Editor:

```sql
select changed_at, table_name, action, changed_by, old_data, new_data
from public.audit_log
order by changed_at desc
limit 50;
```
