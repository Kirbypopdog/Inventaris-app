# End-to-end-tests

Klikken de app door in een (mobiele) browser, tegen een lokale Supabase.

```bash
npx supabase start                  # volledige lokale stack (Docker)
npx supabase status -o env          # toont de lokale sleutels
npm run build
E2E_SUPABASE_SECRET_KEY=<SECRET_KEY uit supabase status> npm run test:e2e
```

De app moet gebouwd zijn met de lokale waarden in `.env.local`
(`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` en de lokale `PUBLISHABLE_KEY`).
De aanmeldcodes worden gelezen uit Mailpit (http://127.0.0.1:54324).
