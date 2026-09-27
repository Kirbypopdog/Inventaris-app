import { type Page, expect, test } from "@playwright/test";
import { logIn, openJob, sql, users } from "./support";

async function setBudgetWarning(page: Page, percent: string): Promise<void> {
  await page.goto("/instellingen/bedrijf");
  const name = page.getByLabel("Bedrijfsnaam");
  if ((await name.inputValue()) === "") {
    await name.fill("E2E Schrijnwerkerij");
  }
  await page.getByLabel("Budgetwaarschuwing (%)").fill(percent);
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("opgeslagen");
}

test("budget warning on the job and the start page", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const customer = `E2E Budgetklant ${p}`;
  const job = `E2E Budgetjob ${p}`;
  const year = p === "mobile" ? 2022 : 2023;
  // Start from the default, also when an earlier run stopped halfway.
  sql(`update public.settings set budget_warning_percent = 80`);
  sql(`insert into public.customers (type, name) values ('private', '${customer}')`);
  sql(
    `insert into public.jobs (customer_id, title, status)
     select id, '${job}', 'active'::public.job_status from public.customers where name = '${customer}'`,
  );
  const jobId = `(select id from public.jobs where title = '${job}')`;
  const owner = `(select id from auth.users where email = '${users.owner.email}')`;
  // An accepted quote of €1000 excl. VAT, and 9 hours at €100 = €900: 90%.
  sql(
    `insert into public.quotes (job_id, number, quote_date, created_by)
     values (${jobId}, 'OFF-${year}-801', '${year}-09-01', ${owner});
     insert into public.quote_lines (quote_id, description, quantity, unit, unit_price_cents, vat_rate)
     select id, 'Trap', 1, 'stuk', 100000, 21 from public.quotes where number = 'OFF-${year}-801';
     update public.quotes set status = 'accepted' where number = 'OFF-${year}-801';
     insert into public.time_entries (job_id, user_id, hourly_rate_cents, started_at, ended_at)
     values (${jobId}, ${owner}, 10000, '${year}-09-22 06:00+00', '${year}-09-22 15:00+00')`,
  );

  await logIn(page, users.owner.email, users.owner.password);

  // Default warning at 80%: the job page and the start page warn.
  await openJob(page, job);
  const budget = page.getByRole("region", { name: "Budget" });
  await expect(budget).toContainText("90%");
  await expect(budget).toContainText(/Nog €\s100,00 over/);
  await page.goto("/");
  // On the start page, the job's card says it too.
  const card = page
    .getByRole("region", { name: "Klok" })
    .getByRole("listitem")
    .filter({ hasText: job });
  await expect(card).toContainText("Let op: al 90% van de offerte is gepresteerd.");

  // Warn only from 95%: no alert anymore.
  await setBudgetWarning(page, "95");
  await page.goto("/");
  await expect(card).toBeVisible();
  await expect(card).not.toContainText("Let op");

  // Two more hours: €1100 of €1000, over budget whatever the setting.
  sql(
    `insert into public.time_entries (job_id, user_id, hourly_rate_cents, started_at, ended_at)
     values (${jobId}, ${owner}, 10000, '${year}-09-23 06:00+00', '${year}-09-23 08:00+00')`,
  );
  await page.reload();
  await expect(card).toContainText(/De offerte is overschreden met €\s100,00/);
  await card.getByRole("link", { name: new RegExp(job) }).click();
  await expect(page.getByRole("region", { name: "Budget" })).toContainText("110%");

  await setBudgetWarning(page, "80");
});
