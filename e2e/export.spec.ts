import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { logIn, sql, users } from "./support";

test("data can be downloaded as a CSV file for Excel", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const customer = `E2E Exportklant ${p}`;
  const job = `E2E Exportjob ${p}`;
  sql(
    `insert into public.customers (type, name, city) values ('private', '${customer}', 'Brugge')`,
  );
  sql(
    `insert into public.jobs (customer_id, title)
     select id, '${job}' from public.customers where name = '${customer}'`,
  );
  sql(
    `insert into public.time_entries (job_id, user_id, hourly_rate_cents, started_at, ended_at, note)
     select j.id, u.id, 4500, '2026-09-21 06:00+00', '2026-09-21 10:00+00', 'Opmeten; tekenen'
     from public.jobs j, auth.users u
     where j.title = '${job}' and u.email = '${users.owner.email}'`,
  );

  await logIn(page, users.owner.email, users.owner.password);
  await page.goto("/account");
  await page.getByRole("link", { name: "Gegevens exporteren" }).click();

  const download = async (name: string) => {
    const [file] = await Promise.all([
      page.waitForEvent("download"),
      page
        .getByRole("main")
        .getByRole("link", { name: new RegExp(`^${name}`) })
        .click(),
    ]);
    expect(file.suggestedFilename()).toMatch(/^schrijnwerk-.+-\d{4}-\d{2}-\d{2}\.csv$/);
    const path = await file.path();
    return readFile(path, "utf8");
  };

  const customers = await download("Klanten");
  expect(customers.startsWith("﻿Naam;Soort;")).toBe(true);
  expect(customers).toContain(`${customer};Particulier;`);

  // 4 hours at €45: 240 minutes, €180; a note with a semicolon is quoted.
  const hours = await download("Uren");
  expect(hours).toContain(
    `2026-09-21;08:00;12:00;240;${job};${users.owner.displayName};45;180;"Opmeten; tekenen"`,
  );
});

test("the export needs a login", async ({ request }) => {
  const response = await request.get("/export/klanten", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/login");
});
