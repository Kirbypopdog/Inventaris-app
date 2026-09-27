import { expect, test } from "@playwright/test";
import { chooseOwnPassword, logIn, logOut, users } from "./support";

test("an admin adds a colleague, resets their password and removes them", async ({ browser }) => {
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await logIn(admin, users.admin.email, users.admin.password);
  await admin
    .getByRole("navigation", { name: "Hoofdmenu" })
    .getByRole("link", { name: "Meer" })
    .click();
  await admin.getByRole("link", { name: "Gebruikers beheren" }).click();
  await expect(admin.getByRole("heading", { name: "Gebruikers", exact: true })).toBeVisible();

  await admin.getByText("Nieuwe gebruiker", { exact: true }).click();
  const addForm = admin.locator("details", { hasText: "Nieuwe gebruiker" }).locator("form");
  await addForm.getByLabel("Naam").fill(users.colleague.displayName);
  await addForm.getByLabel("E-mailadres").fill(users.colleague.email);
  await addForm.getByLabel("Rol").selectOption({ label: "Eigenaar" });
  await addForm.getByLabel("Tijdelijk wachtwoord").fill(users.colleague.password);
  await addForm.getByRole("button", { name: "Gebruiker toevoegen" }).click();
  await expect(admin.getByRole("status")).toContainText(
    `${users.colleague.displayName} is toegevoegd`,
  );

  const card = admin.getByRole("listitem").filter({ hasText: users.colleague.email });
  await expect(card).toContainText("Nog nooit aangemeld");
  await expect(card).toContainText("Moet nog een eigen wachtwoord kiezen");

  // The colleague logs in on their own device with the temporary password.
  const colleagueContext = await browser.newContext();
  const colleague = await colleagueContext.newPage();
  await logIn(colleague, users.colleague.email, users.colleague.password);
  await chooseOwnPassword(colleague, "collega-eigen-wachtwoord");
  await expect(
    colleague.getByRole("heading", { name: `Dag ${users.colleague.displayName}` }),
  ).toBeVisible();

  // Forgotten password: the admin gives a new temporary password.
  await admin.reload();
  await card.getByLabel("Nieuw tijdelijk wachtwoord").fill("nieuw-tijdelijk-123");
  await card.getByRole("button", { name: "Wachtwoord resetten" }).click();
  await expect(card.getByRole("status")).toContainText("Nieuw tijdelijk wachtwoord ingesteld");

  await logOut(colleague);
  await logIn(colleague, users.colleague.email, "nieuw-tijdelijk-123");
  await chooseOwnPassword(colleague, "collega-nieuw-eigen");

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

test("the admin cannot remove themselves, change their own role or reset their own password", async ({
  page,
}) => {
  await logIn(page, users.admin.email, users.admin.password);
  await page.goto("/gebruikers");

  const ownCard = page.getByRole("listitem").filter({ hasText: users.admin.email });
  await expect(ownCard).toContainText("(jij)");
  await expect(ownCard.getByRole("button", { name: "Verwijderen" })).toHaveCount(0);
  await expect(ownCard.getByRole("button", { name: "Wachtwoord resetten" })).toHaveCount(0);
  await expect(ownCard.getByLabel("Rol")).toBeDisabled();
});
