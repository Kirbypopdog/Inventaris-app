import { expect, test } from "@playwright/test";
import { logIn, openFromMenu, sql, users } from "./support";

test("the agenda shows the planned jobs as bars per week and per month", async ({
  page,
}, testInfo) => {
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
  await openFromMenu(page, "Agenda");
  await expect(page.getByRole("heading", { name: /^Week \d+$/ })).toBeVisible();

  // One row per job, with a bar from Tuesday (column 2) to Thursday (column 4).
  const main = page.getByRole("main");
  const job = main.getByRole("link", { name: new RegExp(`^${planned}`) });
  await expect(job).toBeVisible();
  const bar = job.locator("[data-bar]");
  await expect(bar).toHaveCSS("grid-column-start", "2");
  await expect(bar).toHaveCSS("grid-column-end", "5");
  await expect(main).not.toContainText(cancelled);

  const notPlanned = page.getByRole("region", { name: "Nog niet ingepland" });
  await expect(notPlanned).toContainText(unplanned);

  // Next week: the job is no longer there.
  await page.getByRole("link", { name: "Volgende week" }).click();
  await expect(main.getByText("Niets gepland deze week.")).toBeVisible();
  await expect(job).toHaveCount(0);

  // The month shows the job as well; from there, back to this week.
  await page.getByRole("link", { name: "Vandaag" }).click();
  await page.getByRole("link", { name: "Maand", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^[A-Z][a-z]+ \d{4}$/ })).toBeVisible();
  await expect(main.getByRole("link", { name: new RegExp(`^${planned}`) })).toBeVisible();
  await expect(main).not.toContainText(cancelled);
  await page.getByRole("link", { name: "Week", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Week \d+$/ })).toBeVisible();

  // The job links to its page.
  await job.click();
  await expect(page.getByRole("heading", { name: planned })).toBeVisible();
});
