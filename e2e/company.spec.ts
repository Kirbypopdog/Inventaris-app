import { expect, test } from "@playwright/test";
import { logIn, users } from "./support";

test("the company's own details", async ({ page }) => {
  await logIn(page, users.owner.email, users.owner.password);
  await page.goto("/account");
  await page.getByRole("link", { name: "Bedrijfsgegevens" }).click();
  await expect(page.getByRole("heading", { name: "Bedrijfsgegevens" })).toBeVisible();

  await page.getByLabel("Bedrijfsnaam").fill("E2E Schrijnwerkerij");
  await page.getByLabel("Btw-nummer").fill("0123.456.749");
  await page.getByLabel("Adres", { exact: true }).fill("Markt 1");
  await page.getByLabel("Postcode").fill("8000");
  await page.getByLabel("Gemeente").fill("Brugge");
  await page.getByLabel("Rekeningnummer (IBAN)").fill("be68 5390 0754 7035");
  await page.getByRole("button", { name: "Opslaan" }).click();
  // A typing error in the account number is caught.
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "rekeningnummer klopt niet",
  );

  await page.getByLabel("Rekeningnummer (IBAN)").fill("be68 5390 0754 7034");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("opgeslagen");

  // Stored in the standard form, shown in the familiar notation.
  await page.reload();
  await expect(page.getByLabel("Btw-nummer")).toHaveValue("BE 0123.456.749");
  await expect(page.getByLabel("Rekeningnummer (IBAN)")).toHaveValue("BE68 5390 0754 7034");
});
