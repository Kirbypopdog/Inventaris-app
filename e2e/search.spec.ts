import { expect, test } from "@playwright/test";
import { logIn, sql, users } from "./support";

test("search finds a past job by word stem and by the material used", async ({
  page,
}, testInfo) => {
  const p = testInfo.project.name;
  const customer = `E2E Zoekklant ${p}`;
  const job = `E2E Trap in eik ${p}`;
  sql(`insert into public.customers (type, name, city) values ('private', '${customer}', 'Damme')`);
  sql(
    `insert into public.jobs (customer_id, title, status)
     select id, '${job}', 'done'::public.job_status from public.customers where name = '${customer}'`,
  );
  sql(
    `insert into public.material_usages
       (job_id, description, unit, package_price_cents, units_per_package, quantity, margin_bp, created_by)
     select j.id, 'Traptreden beuken ${p}', 'stuk', 4500, 1, 14, 0, u.id
     from public.jobs j, auth.users u
     where j.title = '${job}' and u.email = '${users.owner.email}'`,
  );

  await logIn(page, users.owner.email, users.owner.password);

  // From the start page: "eiken trap" finds "Trap in eik".
  await page.getByRole("searchbox").fill(`eiken trap ${p}`);
  await page.getByRole("button", { name: "Zoek" }).click();
  await expect(page).toHaveURL(/\/zoeken\?q=/);
  const results = page.getByRole("list", { name: "Resultaten" });
  await expect(results.getByRole("link")).toHaveCount(1);
  await expect(results.getByRole("link")).toContainText("Job");
  await expect(results.getByRole("link")).toContainText(job);

  // Via the material used on the job, with the reason shown.
  await page.getByRole("searchbox").fill(`beuken ${p}`);
  await page.getByRole("button", { name: "Zoek" }).click();
  await expect(results.getByRole("link")).toContainText(`Materiaal: Traptreden beuken ${p}`);
  await results.getByRole("link").click();
  await expect(page.getByRole("heading", { name: job })).toBeVisible();

  // Nothing found.
  await page.goto(`/zoeken?q=${encodeURIComponent(`glazen deur ${p}`)}`);
  await expect(page.getByRole("main")).toContainText("Niets gevonden");
});
