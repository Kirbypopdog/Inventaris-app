import { expect, test } from "@playwright/test";
import { logIn, sql, users } from "./support";

test("the agenda shows a week with the planned jobs", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const customer = `E2E Agendaklant ${p}`;
  const planned = `E2E Agenda keuken ${p}`;
  const cancelled = `E2E Agenda geannuleerd ${p}`;
  const unplanned = `E2E Agenda zonder datum ${p}`;
  sql(`insert into public.customers (type, name) values ('private', '${customer}')`);
  // Tuesday to Thursday of the current week (Brussels time).
  sql(
    `with week as (
       select date_trunc('week', (now() at time zone 'Europe/Brussels'))::date as monday
     )
     insert into public.jobs (customer_id, title, status, starts_on, ends_on)
     select c.id, t.title, t.status::public.job_status, t.starts_on, t.ends_on
     from public.customers c, week,
       lateral (values
         ('${planned}', 'planned', week.monday + 1, week.monday + 3),
         ('${cancelled}', 'cancelled', week.monday + 1, week.monday + 3),
         ('${unplanned}', 'planned', null::date, null::date)
       ) as t(title, status, starts_on, ends_on)
     where c.name = '${customer}'`,
  );

  await logIn(page, users.owner.email, users.owner.password);
  await page.goto("/jobs");
  await page.getByRole("link", { name: "Naar de agenda" }).click();
  await expect(page.getByRole("heading", { name: /^Week \d+$/ })).toBeVisible();

  const days = page.getByRole("main").locator("ol > li");
  await expect(days).toHaveCount(7);
  await expect(days.nth(0)).not.toContainText(planned);
  for (const index of [1, 2, 3]) {
    await expect(days.nth(index)).toContainText(planned);
  }
  await expect(days.nth(4)).not.toContainText(planned);
  await expect(page.getByRole("main")).not.toContainText(cancelled);

  const notPlanned = page.getByRole("region", { name: "Nog niet ingepland" });
  await expect(notPlanned).toContainText(unplanned);

  // Next week: the job is no longer there.
  await page.getByRole("link", { name: "Volgende →" }).click();
  await expect(page.getByRole("main").locator("ol > li").first()).toBeVisible();
  await expect(page.getByRole("main").locator("ol")).not.toContainText(planned);

  // Back to this week, and the job links to its page.
  await page.getByRole("link", { name: "Deze week" }).click();
  await days
    .nth(1)
    .getByRole("link", { name: new RegExp(planned) })
    .click();
  await expect(page.getByRole("heading", { name: planned })).toBeVisible();
});
