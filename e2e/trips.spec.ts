import { expect, test } from "@playwright/test";
import { logIn, sql, users } from "./support";

test("travel settings and trips per job", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const customer = `E2E Ritklant ${p}`;
  const flatCustomer = `E2E Forfaitklant ${p}`;
  const kmJob = `E2E Ritjob km ${p}`;
  const flatJob = `E2E Ritjob forfait ${p}`;
  const includedJob = `E2E Ritjob inbegrepen ${p}`;
  sql(
    `insert into public.customers (type, name, travel_method, trip_flat_cents) values
       ('private', '${customer}', null, null),
       ('business', '${flatCustomer}', 'flat', 3500)`,
  );
  sql(
    `insert into public.jobs (customer_id, title, travel_method)
     select id, '${kmJob}', null::public.travel_method from public.customers where name = '${customer}'
     union all
     select id, '${flatJob}', null from public.customers where name = '${flatCustomer}'
     union all
     select id, '${includedJob}', 'included' from public.customers where name = '${customer}'`,
  );

  await logIn(page, users.owner.email, users.owner.password);

  // General settings: per km at €0,43.
  await page.goto("/account");
  await page.getByRole("link", { name: "Verplaatsingen" }).click();
  await expect(page.getByRole("heading", { name: "Verplaatsingen" })).toBeVisible();
  await page.getByRole("radio", { name: "Per km", exact: true }).check();
  await page.getByLabel("Bedrag per km", { exact: true }).fill("0,43");
  await page.getByLabel("Bedrag per rit", { exact: true }).fill("25,00");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Opgeslagen");

  // A job with the general settings: trips per km.
  await page.goto("/jobs");
  await page.getByRole("link", { name: new RegExp(`^${kmJob}`) }).click();
  const section = page.locator("#ritten");
  await expect(section).toContainText(/Per km: €\s0,43 per km/);
  const addForm = section.locator("form").first();
  await addForm.getByLabel("Afstand (km)").fill("42,5");
  await addForm.getByLabel("Notitie").fill("Opmeten");
  await addForm.getByRole("button", { name: "Rit toevoegen" }).click();
  const trips = section.getByRole("listitem");
  await expect(trips).toHaveCount(1);
  await expect(trips.first()).toContainText("42,5 km");
  await expect(trips.first()).toContainText("18,28");

  // The next trip suggests the same distance.
  await expect(addForm.getByLabel("Afstand (km)")).toHaveValue("42,5");
  await addForm.getByRole("button", { name: "Rit toevoegen" }).click();
  await expect(trips).toHaveCount(2);
  await expect(section).toContainText(/Totaal verplaatsingen: €\s36,56/);

  // Correct a trip, then delete one.
  const first = trips.filter({ hasText: "Opmeten" });
  await first.getByText("Aanpassen of verwijderen").click();
  await first.getByLabel("Afstand (km)").fill("10");
  await first.getByRole("button", { name: "Aanpassing opslaan" }).click();
  await expect(trips.filter({ hasText: "Opmeten" })).toContainText("4,30");
  page.once("dialog", (dialog) => dialog.accept());
  await trips.filter({ hasText: "Opmeten" }).getByRole("button", { name: "Verwijderen" }).click();
  await expect(trips).toHaveCount(1);

  // A customer with a fixed amount per trip: no distance needed.
  await page.goto("/jobs");
  await page.getByRole("link", { name: new RegExp(`^${flatJob}`) }).click();
  await expect(section).toContainText("Vast bedrag per rit");
  await expect(section.getByLabel("Afstand (km)")).toHaveCount(0);
  await section.getByRole("button", { name: "Rit toevoegen" }).click();
  await expect(trips).toHaveCount(1);
  await expect(trips.first()).toContainText("35,00");

  // Travel included: nothing to add.
  await page.goto("/jobs");
  await page.getByRole("link", { name: new RegExp(`^${includedJob}`) }).click();
  await expect(section).toContainText("inbegrepen");
  await expect(section.getByRole("button", { name: "Rit toevoegen" })).toHaveCount(0);
});
