import { expect, test } from "@playwright/test";
import { logIn, openJob, openJobTab, sql, users } from "./support";

test("clock in, switch job, clock out, and correct hours by hand", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const rateName = `E2E Werkplaats ${p}`;
  const customer = `E2E Klokklant ${p}`;
  const jobA = `E2E Klokjob A ${p}`;
  const jobB = `E2E Klokjob B ${p}`;
  sql(
    `insert into public.customers (type, name, city) values ('private', '${customer}', 'Brugge')`,
  );
  sql(
    `insert into public.jobs (customer_id, title, status)
     select id, '${jobA}', 'planned'::public.job_status from public.customers where name = '${customer}'
     union all
     select id, '${jobB}', 'active'::public.job_status from public.customers where name = '${customer}'`,
  );

  await logIn(page, users.owner.email, users.owner.password);

  // An hourly rate, made the default.
  await page.goto("/instellingen/uurtarieven");
  const newRate = page.locator("details", { hasText: "Nieuw uurtarief" });
  if ((await newRate.getAttribute("open")) === null) {
    await newRate.getByText("Nieuw uurtarief").click();
  }
  await page.getByLabel("Naam").fill(rateName);
  await page.getByLabel("Bedrag per uur (excl. btw)").fill("45,00");
  await page.getByRole("button", { name: "Uurtarief toevoegen" }).click();
  const rateCard = page.getByRole("listitem").filter({ hasText: rateName });
  await expect(rateCard).toContainText("45,00");
  const makeDefault = rateCard.getByRole("button", { name: "Maak standaard" });
  if (await makeDefault.isVisible()) {
    await makeDefault.click();
  }
  await expect(rateCard).toContainText("Standaardtarief");

  // One tap on a job clocks in; a planned job becomes active.
  await page.goto("/");
  const clock = page.getByRole("region", { name: "Klok" });
  const jobRow = (title: string) => clock.getByRole("listitem").filter({ hasText: title });
  await jobRow(jobA).getByRole("button", { name: "Inklokken" }).click();
  await expect(clock).toContainText("Ingeklokt sinds");
  await expect(clock.getByRole("link", { name: jobA })).toBeVisible();
  await expect(clock.getByRole("link", { name: "Materiaal toevoegen" })).toHaveAttribute(
    "href",
    /\?tab=materiaal$/,
  );

  // Switch to another job in one go.
  await jobRow(jobB).getByRole("button", { name: "Wissel naar deze job" }).click();
  await expect(clock.getByRole("link", { name: jobB })).toBeVisible();

  await clock.getByRole("button", { name: "Uitklokken" }).click();
  await expect(clock.getByRole("heading", { name: "Mijn jobs" })).toBeVisible();

  // Job A: active now, one short entry at the default rate.
  await openJob(page, jobA);
  await openJobTab(page, "Uren");
  await expect(page.getByRole("main")).toContainText("Bezig");
  const hours = page.getByRole("region", { name: "Uren" }).getByRole("listitem");
  await expect(hours).toHaveCount(1);
  await expect(hours.first()).toContainText("45,00/u");

  // Forgotten to clock: add hours by hand.
  await page.getByText("Uren met de hand toevoegen").click();
  const addForm = page.locator("details", { hasText: "Uren met de hand toevoegen" });
  await addForm.getByLabel("Van").fill("08:00");
  await addForm.getByLabel("Tot").fill("12:00");
  await addForm.getByLabel("Notitie").fill("Opmeten");
  await addForm.getByRole("button", { name: "Uren toevoegen" }).click();
  await expect(addForm.getByRole("status")).toHaveText("Uren toegevoegd.");
  const manual = hours.filter({ hasText: "Opmeten" });
  await expect(manual).toContainText("4u 00m");
  await expect(manual).toContainText("180,00");

  // An end before the start is refused.
  await manual.getByText("Aanpassen of verwijderen").click();
  await manual.getByLabel("Tot").fill("07:00");
  await manual.getByRole("button", { name: "Aanpassing opslaan" }).click();
  await expect(manual.getByRole("alert")).toContainText("na het beginuur");

  await manual.getByLabel("Tot").fill("10:00");
  await manual.getByRole("button", { name: "Aanpassing opslaan" }).click();
  await expect(manual).toContainText("2u 00m");
  await expect(manual).toContainText("90,00");

  page.once("dialog", (dialog) => dialog.accept());
  await manual.getByRole("button", { name: "Verwijderen" }).click();
  await expect(hours.filter({ hasText: "Opmeten" })).toHaveCount(0);

  // A finished job has no clock-in button.
  await openJobTab(page, "Overzicht");
  await page.getByRole("button", { name: "Afgewerkt" }).click();
  await openJobTab(page, "Gegevens");
  await expect(page.getByLabel("Status")).toHaveValue("done");
  await expect(page.getByRole("button", { name: "Inklokken op deze job" })).toHaveCount(0);
});
