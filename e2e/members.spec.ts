import { expect, test } from "@playwright/test";
import { clearMailbox, logIn, users } from "./support";

test.beforeEach(async () => {
  await clearMailbox();
});

test("an admin adds a colleague, who can then log in, and removes them again", async ({
  browser,
}) => {
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await logIn(admin, users.admin.email);
  await expect(
    admin.getByRole("heading", { name: `Dag ${users.admin.displayName}` }),
  ).toBeVisible();

  await admin.getByRole("link", { name: "Gebruikers beheren" }).click();
  await expect(admin.getByRole("heading", { name: "Gebruikers", exact: true })).toBeVisible();

  const addForm = admin.getByRole("main").locator("form").first();
  await addForm.getByLabel("Naam").fill(users.colleague.displayName);
  await addForm.getByLabel("E-mailadres").fill(users.colleague.email);
  await addForm.getByLabel("Rol").selectOption({ label: "Eigenaar" });
  await addForm.getByRole("button", { name: "Gebruiker toevoegen" }).click();
  await expect(admin.getByRole("status")).toContainText(
    `${users.colleague.displayName} is toegevoegd`,
  );

  const card = admin.getByRole("listitem").filter({ hasText: users.colleague.email });
  await expect(card).toContainText("Nog nooit aangemeld");

  // The colleague logs in on their own device.
  const colleagueContext = await browser.newContext();
  const colleague = await colleagueContext.newPage();
  await logIn(colleague, users.colleague.email);
  await expect(
    colleague.getByRole("heading", { name: `Dag ${users.colleague.displayName}` }),
  ).toBeVisible();

  // The admin removes the colleague; their access stops immediately.
  admin.once("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "Verwijderen" }).click();
  await expect(admin.getByRole("listitem").filter({ hasText: users.colleague.email })).toHaveCount(
    0,
  );

  await colleague.reload();
  await expect(colleague.getByRole("heading", { name: "Nog geen toegang" })).toBeVisible();

  await adminContext.close();
  await colleagueContext.close();
});

test("the admin cannot remove themselves or change their own role", async ({ page }) => {
  await logIn(page, users.admin.email);
  await page.goto("/gebruikers");

  const ownCard = page.getByRole("listitem").filter({ hasText: users.admin.email });
  await expect(ownCard).toContainText("(jij)");
  await expect(ownCard.getByRole("button", { name: "Verwijderen" })).toHaveCount(0);
  await expect(ownCard.getByLabel("Rol")).toBeDisabled();
});
