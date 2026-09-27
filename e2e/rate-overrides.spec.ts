import { expect, test } from "@playwright/test";
import { logIn, openJobTab, sql, users } from "./support";

test("exceptions on rates for a customer, a job and a material", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const customer = `E2E Uitzonderingklant ${p}`;
  const job = `E2E Uitzonderingjob ${p}`;
  const material = `E2E Uitzonderingmateriaal ${p}`;
  sql(`update public.settings set travel_method = 'per_km', km_rate_cents = 43`);
  sql(`insert into public.customers (type, name) values ('private', '${customer}')`);
  sql(
    `insert into public.jobs (customer_id, title)
     select id, '${job}' from public.customers where name = '${customer}'`,
  );
  sql(
    `insert into public.materials (name, unit, package_price_cents, units_per_package)
     values ('${material}', 'stuk', 1000, 1)`,
  );

  await logIn(page, users.owner.email, users.owner.password);

  // General margin on material.
  await page.goto("/account");
  await page.getByRole("link", { name: "Marge op materiaal" }).click();
  await page.getByLabel("Marge op materiaal (%)").fill("15");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Opgeslagen");

  // The customer gets a fixed amount per trip.
  await page.goto(`/klanten?q=${encodeURIComponent(customer)}`);
  await page.getByRole("link", { name: new RegExp(`^${customer}`) }).click();
  await page.getByText("Gegevens bewerken").click();
  const exceptions = page.locator('details:has(> summary:has-text("Uitzonderingen op tarieven"))');
  await exceptions.getByText("Uitzonderingen op tarieven").click();
  await exceptions.getByRole("combobox", { name: "Verplaatsingen" }).selectOption("flat");
  await exceptions.getByLabel("Bedrag per rit", { exact: true }).fill("35");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Klant opgeslagen");

  // The customer's job follows the customer.
  await page.getByRole("link", { name: new RegExp(`^${job}`) }).click();
  await openJobTab(page, "Ritten");
  const trips = page.locator("#ritten");
  await expect(trips).toContainText(/Vast bedrag per rit: €\s35,00/);

  // The job itself: travel included and its own margin; the section opens when set.
  await openJobTab(page, "Gegevens");
  await exceptions.getByText("Uitzonderingen op tarieven").click();
  await exceptions.getByRole("combobox", { name: "Verplaatsingen" }).selectOption("included");
  await exceptions.getByLabel("Marge op materiaal (%)").fill("20");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("opgeslagen");
  await page.reload();
  await expect(exceptions).toHaveAttribute("open", "");
  await expect(exceptions.getByLabel("Marge op materiaal (%)")).toHaveValue("20");
  await openJobTab(page, "Ritten");
  await expect(trips).toContainText("inbegrepen");

  // Removing the exception brings back the customer's terms.
  await openJobTab(page, "Gegevens");
  await exceptions.getByRole("combobox", { name: "Verplaatsingen" }).selectOption("");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("opgeslagen");
  await openJobTab(page, "Ritten");
  await expect(trips).toContainText(/Vast bedrag per rit: €\s35,00/);

  // A material with its own margin; an invalid margin is refused.
  await page.goto(`/materiaal?q=${encodeURIComponent(material)}`);
  await page.getByRole("link", { name: new RegExp(`^${material}`) }).click();
  await page.getByLabel("Marge (%)").fill("-5");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("marge");
  await page.getByLabel("Marge (%)").fill("30");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("opgeslagen");
  await page.reload();
  await expect(page.getByLabel("Marge (%)")).toHaveValue("30");
});
