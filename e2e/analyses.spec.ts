import { expect, test } from "@playwright/test";
import { logIn, openJob, sql, users } from "./support";

test("post-calculation of a job and the monthly overview", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const customer = `E2E Analyseklant ${p}`;
  const job = `E2E Analysejob ${p}`;
  // A past year per project, so no other data mixes in.
  const year = p === "mobile" ? 2024 : 2025;
  sql(`insert into public.customers (type, name) values ('private', '${customer}')`);
  sql(
    `insert into public.jobs (customer_id, title, status)
     select id, '${job}', 'done'::public.job_status from public.customers where name = '${customer}'`,
  );
  const jobId = `(select id from public.jobs where title = '${job}')`;
  const owner = `(select id from auth.users where email = '${users.owner.email}')`;
  // 4 hours at €45 = €180
  sql(
    `insert into public.time_entries (job_id, user_id, hourly_rate_cents, started_at, ended_at)
     values (${jobId}, ${owner}, 4500, '${year}-09-22 06:00+00', '${year}-09-22 10:00+00')`,
  );
  // 2 plates at €64,50 with 15% margin: cost €129, with margin €148,35
  sql(
    `insert into public.material_usages
       (job_id, description, unit, package_price_cents, units_per_package, quantity, margin_bp, used_on, created_by)
     values (${jobId}, 'Multiplex', 'plaat', 6450, 1, 2, 1500, '${year}-09-23', ${owner})`,
  );
  // 40 km at €0,43 = €17,20
  sql(
    `insert into public.trips (job_id, trip_date, method, distance_km, rate_cents, created_by)
     values (${jobId}, '${year}-10-01', 'per_km', 40, 43, ${owner})`,
  );
  // An accepted quote of €400 excl. VAT
  sql(
    `insert into public.quotes (job_id, number, quote_date, created_by)
     values (${jobId}, 'OFF-${year}-901', '${year}-09-01', ${owner});
     insert into public.quote_lines (quote_id, description, quantity, unit, unit_price_cents, vat_rate)
     select id, 'Kast', 1, 'stuk', 40000, 6 from public.quotes where number = 'OFF-${year}-901';
     update public.quotes set status = 'accepted' where number = 'OFF-${year}-901'`,
  );

  await logIn(page, users.owner.email, users.owner.password);

  // On the job page: €180 + €148,35 + €17,20 = €345,55; the quote covers €54,45 more.
  await openJob(page, job);
  const calculation = page.getByRole("region", { name: "Nacalculatie" });
  await expect(calculation).toContainText(/Uren \(4u 00m\)\s*€\s180,00/);
  await expect(calculation).toContainText(/Materiaal \(kostprijs\)\s*€\s129,00/);
  await expect(calculation).toContainText(/Materiaal met marge\s*€\s148,35/);
  await expect(calculation).toContainText(/Verplaatsingen\s*€\s17,20/);
  await expect(calculation).toContainText(/Totaal gepresteerd\s*€\s345,55/);
  // €345,55 of €400 is 86%: past the default warning of 80%.
  const budget = page.getByRole("region", { name: "Budget" });
  await expect(budget).toContainText("86%");
  await expect(budget).toContainText(
    /Let op: al 86% van de offerte is gepresteerd\. Nog €\s54,45 over\./,
  );

  // The analyses of that year.
  await page.goto(`/analyses?jaar=${year}`);
  const months = page.getByRole("region", { name: "Per maand" });
  await expect(months.getByRole("row", { name: /^september/ })).toContainText("4u 00m");
  await expect(months.getByRole("row", { name: /^oktober/ })).toContainText("17,20");
  await expect(
    page.getByRole("region", { name: "Per job" }).getByRole("listitem").filter({ hasText: job }),
  ).toContainText("345,55");
});
