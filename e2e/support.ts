import { execFileSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";

/** Local Supabase stack started with `npx supabase start` (see CLAUDE.md). */
export const supabase = {
  apiUrl: process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321",
  secretKey: requireEnv("E2E_SUPABASE_SECRET_KEY"),
  dbUrl: process.env.E2E_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  mailpitUrl: process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324",
};

export const users = {
  owner: { email: "e2e-eigenaar@example.com", displayName: "Testeigenaar" },
  admin: { email: "e2e-admin@example.com", displayName: "Testadmin" },
  colleague: { email: "e2e-collega@example.com", displayName: "Testcollega" },
  noAccess: { email: "e2e-zonder-rol@example.com" },
  unknown: { email: "e2e-onbekend@example.com" },
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} ontbreekt. Zie e2e/README.md.`);
  }
  return value;
}

export async function createAuthUser(email: string): Promise<void> {
  const response = await fetch(`${supabase.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: supabase.secretKey,
      Authorization: `Bearer ${supabase.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, email_confirm: true }),
  });
  // 422: user already exists from an earlier run.
  if (!response.ok && response.status !== 422) {
    throw new Error(`Creating ${email} failed: ${response.status} ${await response.text()}`);
  }
}

export function sql(statement: string): void {
  execFileSync("psql", [supabase.dbUrl, "-v", "ON_ERROR_STOP=1", "-q", "-c", statement], {
    stdio: "pipe",
  });
}

export async function clearMailbox(): Promise<void> {
  await fetch(`${supabase.mailpitUrl}/api/v1/messages`, { method: "DELETE" });
}

/** Waits for the login e-mail to arrive and returns the code in it. */
export async function readLoginCode(email: string): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const search = await fetch(
      `${supabase.mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
    );
    const result = (await search.json()) as { messages?: { ID: string }[] };
    const id = result.messages?.[0]?.ID;
    if (id) {
      const message = (await (
        await fetch(`${supabase.mailpitUrl}/api/v1/message/${id}`)
      ).json()) as {
        Text: string;
        HTML: string;
      };
      const code = /\b(\d{6,10})\b/.exec(message.Text || message.HTML)?.[1];
      if (code) {
        return code;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Geen aanmeldcode ontvangen voor ${email}`);
}

export async function requestCode(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByRole("button", { name: "Stuur mij een code" }).click();
}

export async function logIn(page: Page, email: string): Promise<void> {
  await requestCode(page, email);
  await expect(page.getByText(`We stuurden een code naar ${email}`)).toBeVisible();
  await page.getByLabel("Code").fill(await readLoginCode(email));
  await page.getByRole("button", { name: "Aanmelden" }).click();
  // Wait until the session is set and the login page is left.
  await expect(page).not.toHaveURL(/\/login$/);
}
