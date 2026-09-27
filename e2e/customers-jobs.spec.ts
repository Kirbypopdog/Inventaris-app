import { expect, test } from "@playwright/test";
import { logIn, users } from "./support";

test("a customer with a job: create, search, follow up and archive", async ({ page }, testInfo) => {
  // Each project (phone, laptop) uses its own names, so their data never collides.
  const customerName = `E2E Bouwbedrijf Peeters ${testInfo.project.name}`;
  const jobTitle = `E2E Keuken Assebroek ${testInfo.project.name}`;
  const exactLink = (name: string) => page.getByRole("link", { name: new RegExp(`^${name}`) });
  await logIn(page, users.owner.email, users.owner.password);

  // New business customer; a VAT number with a typo is refused.
  await page
    .getByRole("navigation", { name: "Hoofdmenu" })
    .getByRole("link", { name: "Projecten" })
    .click();
  await page.getByRole("link", { name: "Nieuwe klant" }).click();
  await page.getByLabel("Bedrijf").check();
  await page.getByLabel("Naam").fill(customerName);
  await page.getByLabel("Telefoon").fill("050 12 34 56");
  await page.getByLabel("Adres", { exact: true }).fill("Markt 1");
  await page.getByLabel("Postcode").fill("8000");
  await page.getByLabel("Gemeente").fill("Brugge");
  await page.getByLabel("Btw-nummer").fill("BE 0123.456.748");
  await page.getByRole("button", { name: "Klant toevoegen" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("btw-nummer klopt niet");
  // What was filled in is kept after the error.
  await expect(page.getByLabel("Naam")).toHaveValue(customerName);

  await page.getByLabel("Btw-nummer").fill("BE 0123.456.749");
  await page.getByRole("button", { name: "Klant toevoegen" }).click();
  await expect(page.getByRole("heading", { name: customerName })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("BE 0123.456.749");
  await expect(page.getByRole("main")).toContainText("Markt 1, 8000 Brugge");
  const customerUrl = page.url();

  // The customer can be found.
  await page.goto("/klanten?q=peeters");
  await expect(exactLink(customerName)).toBeVisible();
  await page.goto("/klanten?q=antwerpen");
  await expect(exactLink(customerName)).toHaveCount(0);

  // A job for this customer.
  await page.goto(customerUrl);
  await page.getByRole("link", { name: "Nieuwe job" }).click();
  await expect(page.getByLabel("Klant")).toHaveValue(customerUrl.split("/").pop() ?? "");
  await page.getByLabel("Naam van de job").fill(jobTitle);
  await page.getByLabel("Omschrijving").fill("Keuken in eik, 4 kasten");
  await page.getByLabel("Start").fill("2026-10-05");
  await page.getByLabel("Einde").fill("2026-10-02");
  await page.getByRole("button", { name: "Job aanmaken" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("einddatum");

  await page.getByLabel("Einde").fill("2026-10-09");
  await page.getByRole("button", { name: "Job aanmaken" }).click();
  await expect(page.getByRole("heading", { name: jobTitle })).toBeVisible();
  // Without its own address, the job uses the customer's.
  await expect(page.getByRole("link", { name: "Markt 1, 8000 Brugge" })).toBeVisible();

  // Status follow-up: the job is on the start page while it is open.
  await page.getByRole("button", { name: "Bezig" }).click();
  await expect(page.getByRole("main").getByText("Bezig", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("Status")).toHaveValue("active");

  await page
    .getByRole("navigation", { name: "Hoofdmenu" })
    .getByRole("link", { name: "Start" })
    .click();
  await expect(exactLink(jobTitle)).toBeVisible();

  await exactLink(jobTitle).click();
  await page.getByRole("button", { name: "Afgewerkt" }).click();
  await expect(page.getByLabel("Status")).toHaveValue("done");
  await page.goto("/");
  await expect(exactLink(jobTitle)).toHaveCount(0);

  // On the projects page the card only shows open jobs; a search also finds finished ones.
  await page.goto("/klanten");
  const card = page.getByRole("article", { name: customerName });
  await expect(card).toContainText("1 afgesloten job");
  await expect(card.getByRole("link", { name: new RegExp(`^${jobTitle}`) })).toHaveCount(0);
  await page.goto(`/klanten?q=${encodeURIComponent("Keuken Assebroek")}`);
  await expect(card.getByRole("link", { name: new RegExp(`^${jobTitle}`) })).toBeVisible();

  // Archive the customer: gone from the list, still in the archive, job kept.
  await page.goto(customerUrl);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archiveren" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("gearchiveerd");
  await page.goto("/klanten");
  await expect(exactLink(customerName)).toHaveCount(0);
  await page.goto("/klanten?archief=1");
  await expect(exactLink(customerName)).toBeVisible();
  await page.goto(`/klanten?archief=1&q=${encodeURIComponent(jobTitle)}`);
  await expect(exactLink(jobTitle)).toBeVisible();
});

test("an unknown customer or job shows a friendly not-found page", async ({ page }) => {
  await logIn(page, users.owner.email, users.owner.password);
  await page.goto("/klanten/11111111-1111-4111-8111-111111111111");
  await expect(page.getByRole("heading", { name: "Niet gevonden" })).toBeVisible();
  await page.goto("/jobs/geen-geldig-id");
  await expect(page.getByRole("heading", { name: "Niet gevonden" })).toBeVisible();
});
