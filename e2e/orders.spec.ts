import { expect, test } from "@playwright/test";
import { logIn, openJob, openJobTab, sql, users } from "./support";

test("order list per supplier", async ({ page, context }, testInfo) => {
  const p = testInfo.project.name;
  const supplier = `E2E Leverancier ${p}`;
  const material = `E2E Scharnier ${p}`;
  const customer = `E2E Bestelklant ${p}`;
  const job = `E2E Besteljob ${p}`;
  sql(
    `insert into public.materials (name, unit, package_price_cents, units_per_package, supplier)
     values ('${material}', 'stuk', 900, 2, '${supplier}')`,
  );
  sql(`insert into public.customers (type, name) values ('private', '${customer}')`);
  sql(
    `insert into public.jobs (customer_id, title, status)
     select id, '${job}', 'active'::public.job_status from public.customers where name = '${customer}'`,
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await logIn(page, users.owner.email, users.owner.password);

  // From the job: pick from the catalogue, which fills in the unit and the supplier.
  await openJob(page, job);
  await openJobTab(page, "Materiaal");
  await page.getByText("+ Op de bestellijst").click();
  const jobForm = page.locator("form").filter({ hasText: "Uit de catalogus" }).last();
  await jobForm.getByLabel("Uit de catalogus").selectOption({ label: material });
  await expect(jobForm.getByLabel("Leverancier")).toHaveValue(supplier);
  await jobForm.getByLabel("Aantal").fill("12");
  await jobForm.getByRole("button", { name: "Op de bestellijst" }).click();
  await expect(jobForm.getByRole("status")).toContainText(`${material} staat op de bestellijst.`);

  // The order list, via the materials page.
  await page.goto("/materiaal");
  await page.getByRole("link", { name: /^Bestellijst/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Bestellijst" })).toBeVisible();
  const group = page.getByRole("region", { name: supplier });
  const line = group.getByRole("listitem").filter({ hasText: material });
  await expect(line).toContainText(`12 stuk ${material}`);
  await expect(line).toContainText(`Voor ${job}`);

  // Something else, without a supplier.
  const toggle = page.getByText("+ Iets op de lijst zetten");
  const form = page.locator("form").filter({ hasText: "Voor job" });
  if (!(await form.isVisible())) {
    await toggle.click();
  }
  await form.getByLabel("Wat").fill(`E2E Silicone ${p}`);
  await form.getByLabel("Aantal").fill("3");
  await form.getByLabel("Eenheid").fill("koker");
  await form.getByRole("button", { name: "Op de bestellijst" }).click();
  await expect(
    page
      .getByRole("region", { name: "Zonder leverancier" })
      .getByRole("listitem")
      .filter({ hasText: `E2E Silicone ${p}` }),
  ).toContainText(`3 koker E2E Silicone ${p}`);

  // Copy the list for the supplier.
  await group.getByRole("button", { name: "Kopieer lijst" }).click();
  await expect(group.getByRole("button", { name: "Gekopieerd" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    `12 stuk ${material}`,
  );

  // Ordered: it moves to Besteld, and can be cleared.
  await line.getByRole("checkbox").check();
  await expect(group).toHaveCount(0);
  await page.getByText(/^Besteld \(\d+\)$/).click();
  const ordered = page.getByRole("list", { name: "Besteld" });
  await expect(ordered.getByRole("checkbox", { name: new RegExp(material) })).toBeChecked();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Bestelde regels wissen" }).click();
  await expect(page.getByText(/^Besteld \(/)).toHaveCount(0);
  await expect(page.getByRole("main")).toContainText(`E2E Silicone ${p}`);

  // Part of the export.
  const response = await page.request.get("/export/bestellijst");
  expect(await response.text()).toContain(`;E2E Silicone ${p};3;koker;`);

  // A line can be deleted without ordering it.
  page.once("dialog", (dialog) => dialog.accept());
  const silicone = page.getByRole("listitem").filter({ hasText: `3 koker E2E Silicone ${p}` });
  await page.getByRole("button", { name: `Verwijderen: 3 koker E2E Silicone ${p}` }).click();
  await expect(silicone).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Bestellijst" })).toBeVisible();
  await expect(silicone).toHaveCount(0);
});
