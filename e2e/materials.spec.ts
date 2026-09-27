import { expect, test } from "@playwright/test";
import { logIn, openFromMenu, openJob, sql, users } from "./support";

test("catalogue, material on a job, correct and delete", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const screws = `E2E Vijzen 4x40 ${p}`;
  const customer = `E2E Materiaalklant ${p}`;
  const job = `E2E Materiaaljob ${p}`;
  sql(`insert into public.customers (type, name) values ('private', '${customer}')`);
  sql(
    `insert into public.jobs (customer_id, title, status)
     select id, '${job}', 'active'::public.job_status from public.customers where name = '${customer}'`,
  );

  await logIn(page, users.owner.email, users.owner.password);

  // A box of 200 screws in the catalogue; the price per screw is derived.
  await openFromMenu(page, "Materiaal");
  await page.getByRole("link", { name: "Nieuw materiaal" }).click();
  await expect(page.getByRole("heading", { name: "Nieuw materiaal" })).toBeVisible();
  await page.getByLabel("Naam", { exact: true }).fill(screws);
  await page.getByLabel("Prijs verpakking").fill("12,50");
  await page.getByLabel("Aantal per verpakking").fill("200");
  await page.getByRole("button", { name: "Materiaal toevoegen" }).click();
  await expect(page.getByRole("heading", { name: screws })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("per 200 stuk");
  await expect(page.getByRole("main")).toContainText("0,0625 per stuk");

  // An invalid package is refused with a clear message.
  await page.getByLabel("Aantal per verpakking").fill("0");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("in één verpakking");
  await page.getByLabel("Aantal per verpakking").fill("200");

  // On the job: 35 screws, then 2 boxes.
  await openJob(page, job);
  const section = page.locator("#materiaal");
  await section.getByRole("combobox", { name: /^Materiaal/ }).selectOption({ label: screws });
  await section.getByLabel("Aantal").first().fill("35");
  await section.getByRole("button", { name: "Materiaal toevoegen" }).click();
  await expect(section.getByRole("status").first()).toContainText(`${screws} toegevoegd.`);

  // The form is empty again after adding.
  const picker = section.getByRole("combobox", { name: /^Materiaal/ });
  await expect(picker).toHaveValue("");
  await picker.selectOption({ label: screws });
  await section.getByLabel("Aantal").first().fill("2");
  await section.getByLabel("per verpakking (200)").check();
  await section.getByRole("button", { name: "Materiaal toevoegen" }).click();

  const usages = section.getByRole("listitem");
  await expect(usages).toHaveCount(2);
  await expect(usages.filter({ hasText: "35 stuk" })).toContainText("2,19");
  await expect(usages.filter({ hasText: "400 stuk" })).toContainText("25,00");
  await expect(section).toContainText(/Totaal materiaal \(kostprijs\): €\s27,19/);

  // Something bought once, outside the catalogue.
  await section.getByText("Iets anders toevoegen").click();
  const other = section.locator("details", { hasText: "Iets anders toevoegen" });
  await other.getByLabel("Omschrijving").fill("Werkbladolie");
  await other.getByLabel("Eenheid", { exact: true }).fill("fles");
  await other.getByLabel("Prijs per eenheid").fill("18,99");
  await other.getByRole("button", { name: "Toevoegen" }).click();
  await expect(usages).toHaveCount(3);
  await expect(usages.filter({ hasText: "Werkbladolie" })).toContainText("18,99");

  // Correct a quantity, then delete an entry.
  const few = usages.filter({ hasText: "35 stuk" });
  await few.getByText("Aanpassen of verwijderen").click();
  await few.getByLabel("Aantal (stuk)").fill("40");
  await few.getByRole("button", { name: "Aanpassing opslaan" }).click();
  const corrected = usages.filter({ hasText: "40 stuk" });
  await expect(corrected).toContainText("2,50");

  page.once("dialog", (dialog) => dialog.accept());
  await corrected.getByRole("button", { name: "Verwijderen" }).click();
  await expect(usages).toHaveCount(2);

  // A later price change does not change the job.
  sql(`update public.materials set package_price_cents = 2000 where name = '${screws}'`);
  await page.reload();
  await expect(usages.filter({ hasText: "400 stuk" })).toContainText("25,00");

  // An archived material is no longer in the list, but the job keeps it.
  await page.goto("/materiaal");
  await page.getByRole("link", { name: new RegExp(`^${screws}`) }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archiveren" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("gearchiveerd");
  await page.goto("/materiaal");
  await expect(page.getByRole("link", { name: new RegExp(`^${screws}`) })).toHaveCount(0);
});
