import { expect, test, type Page } from "@playwright/test";
import { clearMailbox, readLoginCode, users } from "./support";

test.beforeEach(async () => {
  await clearMailbox();
});

async function requestCode(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mailadres").fill(email);
  await page.getByRole("button", { name: "Stuur mij een code" }).click();
}

async function logIn(page: Page, email: string) {
  await requestCode(page, email);
  await expect(page.getByText(`We stuurden een code naar ${email}`)).toBeVisible();
  await page.getByLabel("Code").fill(await readLoginCode(email));
  await page.getByRole("button", { name: "Aanmelden" }).click();
}

test("visitors who are not logged in are sent to the login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("an unknown e-mail address gets no code", async ({ page }) => {
  await requestCode(page, users.unknown.email);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("geen toegang");
});

test("a wrong code is refused", async ({ page }) => {
  // Another address than the login tests below: Supabase limits how often one address gets a code.
  await requestCode(page, users.noAccess.email);
  await readLoginCode(users.noAccess.email);
  await page.getByLabel("Code").fill("000000");
  await page.getByRole("button", { name: "Aanmelden" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("verlopen of klopt niet");
});

test("a member logs in with a code and logs out again", async ({ page }) => {
  await logIn(page, users.owner.email);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: `Dag ${users.owner.displayName}` })).toBeVisible();

  await page.goto("/login");
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("button", { name: "Afmelden" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("a logged-in account without a role sees that it has no access", async ({ page }) => {
  await logIn(page, users.noAccess.email);
  await expect(page.getByRole("heading", { name: "Nog geen toegang" })).toBeVisible();
});
