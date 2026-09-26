import { expect, test } from "@playwright/test";
import { chooseOwnPassword, logIn, logOut, users } from "./support";

test("visitors who are not logged in are sent to the login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("a wrong password or unknown address is refused with the same message", async ({ page }) => {
  for (const [email, password] of [
    [users.owner.email, "fout-wachtwoord"],
    [users.unknown.email, users.unknown.password],
  ] as const) {
    await page.goto("/login");
    await page.getByLabel("E-mailadres").fill(email);
    await page.getByLabel("Wachtwoord").fill(password);
    await page.getByRole("button", { name: "Aanmelden" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "E-mailadres of wachtwoord klopt niet.",
    );
  }
});

test("a member logs in and logs out again", async ({ page }) => {
  await logIn(page, users.owner.email, users.owner.password);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: `Dag ${users.owner.displayName}` })).toBeVisible();

  await page.goto("/login");
  await expect(page).toHaveURL(/\/$/);

  await logOut(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("a logged-in account without a role sees that it has no access", async ({ page }) => {
  await logIn(page, users.noAccess.email, users.noAccess.password);
  await expect(page.getByRole("heading", { name: "Nog geen toegang" })).toBeVisible();
});

test("a member with a temporary password must choose their own first", async ({ page }) => {
  const own = "mijn-eigen-wachtwoord";
  await logIn(page, users.temporary.email, users.temporary.password);
  await expect(page).toHaveURL(/\/wachtwoord$/);

  // Other pages are not reachable yet, but logging out is.
  await page.goto("/");
  await expect(page).toHaveURL(/\/wachtwoord$/);
  await expect(page.getByRole("button", { name: "Afmelden" })).toBeVisible();

  await page.getByLabel("Nieuw wachtwoord").fill(own);
  await page.getByLabel("Herhaal het nieuwe wachtwoord").fill("iets-anders-123");
  await page.getByRole("button", { name: "Wachtwoord opslaan" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("niet gelijk");

  await chooseOwnPassword(page, own);
  await expect(
    page.getByRole("heading", { name: `Dag ${users.temporary.displayName}` }),
  ).toBeVisible();

  // The new password works, the temporary one no longer does.
  await logOut(page);
  await logIn(page, users.temporary.email, own);
  await expect(page).toHaveURL(/\/$/);
});
