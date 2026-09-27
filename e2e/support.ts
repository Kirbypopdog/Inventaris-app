import { execFileSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";

/** Local Supabase stack started with `npx supabase start` (see e2e/README.md). */
export const supabase = {
  apiUrl: process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321",
  secretKey: requireEnv("E2E_SUPABASE_SECRET_KEY"),
  dbUrl: process.env.E2E_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
};

export const users = {
  owner: {
    email: "e2e-eigenaar@example.com",
    password: "eigenaar-wachtwoord",
    displayName: "Testeigenaar",
  },
  admin: { email: "e2e-admin@example.com", password: "admin-wachtwoord", displayName: "Testadmin" },
  temporary: {
    email: "e2e-tijdelijk@example.com",
    password: "tijdelijk-wachtwoord",
    displayName: "Testnieuwkomer",
  },
  colleague: {
    email: "e2e-collega@example.com",
    password: "collega-tijdelijk",
    displayName: "Testcollega",
  },
  noAccess: { email: "e2e-zonder-rol@example.com", password: "zonder-rol-wachtwoord" },
  unknown: { email: "e2e-onbekend@example.com", password: "onbekend-wachtwoord" },
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} ontbreekt. Zie e2e/README.md.`);
  }
  return value;
}

export async function createAuthUser(email: string, password: string): Promise<void> {
  const response = await fetch(`${supabase.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: supabase.secretKey,
      Authorization: `Bearer ${supabase.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!response.ok) {
    throw new Error(`Creating ${email} failed: ${response.status} ${await response.text()}`);
  }
}

export function sql(statement: string): void {
  execFileSync("psql", [supabase.dbUrl, "-v", "ON_ERROR_STOP=1", "-q", "-c", statement], {
    stdio: "pipe",
  });
}

export async function logIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByLabel("Wachtwoord").fill(password);
  await page.getByRole("button", { name: "Aanmelden" }).click();
  // Wait until the session is set and the login page is left.
  await expect(page).not.toHaveURL(/\/login$/);
}

export async function chooseOwnPassword(page: Page, password: string): Promise<void> {
  await expect(page).toHaveURL(/\/wachtwoord$/);
  await page.getByLabel("Nieuw wachtwoord").fill(password);
  await page.getByLabel("Herhaal het nieuwe wachtwoord").fill(password);
  await page.getByRole("button", { name: "Wachtwoord opslaan" }).click();
  await expect(page).toHaveURL(/\/$/);
}

export async function logOut(page: Page): Promise<void> {
  // From the account page, or from the password page when a new password is required.
  await page.goto("/account");
  await page.getByRole("button", { name: "Afmelden" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Opens a page from the main menu. On a phone the less used pages sit behind "Meer". */
export async function openFromMenu(page: Page, label: string): Promise<void> {
  const nav = page.getByRole("navigation", { name: "Hoofdmenu" });
  const direct = nav.getByRole("link", { name: label, exact: true });
  if (await direct.isVisible()) {
    await direct.click();
    return;
  }
  await nav.getByRole("link", { name: "Meer", exact: true }).click();
  await page.getByRole("main").getByRole("link", { name: label, exact: true }).click();
}

/** Opens a job from the projects page by searching for its title. */
export async function openJob(page: Page, title: string): Promise<void> {
  await page.goto(`/klanten?q=${encodeURIComponent(title)}`);
  await page
    .getByRole("main")
    .getByRole("link", { name: new RegExp(`^${title}`) })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

/** Opens a tab on a job page (Overzicht, Notities, Uren, Materiaal, Ritten, Offertes, Gegevens). */
export async function openJobTab(page: Page, label: string): Promise<void> {
  await page
    .getByRole("navigation", { name: "Onderdelen van de job" })
    .getByRole("link", { name: label, exact: true })
    .click();
  await expect(
    page
      .getByRole("navigation", { name: "Onderdelen van de job" })
      .getByRole("link", { name: label, exact: true }),
  ).toHaveAttribute("aria-current", "page");
}
