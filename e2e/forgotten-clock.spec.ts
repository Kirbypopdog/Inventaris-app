import { expect, test } from "@playwright/test";
import { logIn, sql, users } from "./support";

test("a forgotten clock of a colleague is found and stopped", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const customer = `E2E Vergeten-klok-klant ${p}`;
  const job = `E2E Vergeten klok ${p}`;
  sql(`insert into public.customers (type, name) values ('private', '${customer}')`);
  sql(
    `insert into public.jobs (customer_id, title, status)
     select id, '${job}', 'active'::public.job_status from public.customers where name = '${customer}'`,
  );
  // The admin clocked in hours ago and forgot to clock out.
  sql(
    `insert into public.time_entries (job_id, user_id, hourly_rate_cents, started_at)
     select j.id, u.id, 5000, now() - interval '3 hours'
     from public.jobs j, auth.users u
     where j.title = '${job}' and u.email = '${users.admin.email}'`,
  );

  await logIn(page, users.owner.email, users.owner.password);

  // The start page shows whose clock is still running, with a link to the job.
  const others = page.getByRole("region", { name: "Klokken van anderen" });
  const link = others.getByRole("link", { name: new RegExp(job) });
  await expect(link).toContainText(users.admin.displayName);
  await link.click();

  // On the job page, the clock can be stopped.
  const hours = page.getByRole("region", { name: "Uren" }).getByRole("listitem");
  const running = hours.filter({ hasText: "nu" });
  page.once("dialog", (dialog) => dialog.accept());
  await running
    .getByRole("button", { name: `Klok van ${users.admin.displayName} stoppen` })
    .click();
  await expect(hours.first()).toContainText("3u 00m");
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Klokken van anderen" })).toHaveCount(0);
});
