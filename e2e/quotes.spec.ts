import { expect, test } from "@playwright/test";
import { logIn, sql, users } from "./support";

test("a quote: lines, VAT per rate, send, back to draft, delete", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const customer = `E2E Offerteklant ${p}`;
  const job = `E2E Offertejob ${p}`;
  sql(`update public.settings set vat_rate = 21`);
  sql(`insert into public.customers (type, name) values ('private', '${customer}')`);
  sql(
    `insert into public.jobs (customer_id, title)
     select id, '${job}' from public.customers where name = '${customer}'`,
  );

  await logIn(page, users.owner.email, users.owner.password);
  await page.goto("/jobs");
  await page.getByRole("link", { name: new RegExp(`^${job}`) }).click();
  await page.getByRole("button", { name: "Nieuwe offerte" }).click();
  await expect(page.getByRole("heading", { name: /^Offerte OFF-\d{4}-\d{3,}$/ })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Ontwerp");

  // Two lines: a cabinet at 21% and installation at 6%.
  const lines = page.getByRole("region", { name: "Regels" });
  const addForm = page.getByRole("region", { name: "Regel toevoegen" });
  await addForm.getByLabel("Omschrijving").fill("Keukenkast in eik");
  await addForm.getByLabel("Aantal").fill("2");
  await addForm.getByLabel("Prijs per eenheid").fill("450");
  await addForm.getByRole("button", { name: "Regel toevoegen" }).click();
  await expect(lines.getByRole("listitem")).toHaveCount(1);

  await addForm.getByLabel("Omschrijving").fill("Plaatsing");
  await addForm.getByLabel("Aantal").fill("8");
  await addForm.getByLabel("Eenheid", { exact: true }).fill("uur");
  await addForm.getByLabel("Prijs per eenheid").fill("50");
  await addForm.getByRole("combobox", { name: "Btw" }).selectOption("6");
  await addForm.getByRole("button", { name: "Regel toevoegen" }).click();
  await expect(lines.getByRole("listitem")).toHaveCount(2);

  const totals = page.getByRole("region", { name: "Totaal" });
  await expect(totals).toContainText(/Totaal excl\. btw\s*€\s1\.300,00/);
  await expect(totals).toContainText(/Btw 6% op €\s400,00\s*€\s24,00/);
  await expect(totals).toContainText(/Btw 21% op €\s900,00\s*€\s189,00/);
  await expect(totals).toContainText(/Totaal incl\. btw\s*€\s1\.513,00/);

  // Correct a line.
  const installation = lines.getByRole("listitem").filter({ hasText: "Plaatsing" });
  await installation.getByText("Aanpassen of verwijderen").click();
  await installation.getByLabel("Aantal").fill("10");
  await installation.getByRole("button", { name: "Regel opslaan" }).click();
  await expect(totals).toContainText(/Totaal incl\. btw\s*€\s1\.619,00/);

  // Sent: locked.
  await page.getByRole("button", { name: "Markeer als verzonden" }).click();
  await expect(page.getByRole("main")).toContainText("kan niet meer aangepast worden");
  await expect(page.getByRole("button", { name: "Regel toevoegen" })).toHaveCount(0);
  await expect(lines.getByText("Aanpassen of verwijderen")).toHaveCount(0);

  // The quote is in the list.
  await page.goto("/offertes?status=sent");
  await expect(page.getByRole("link", { name: new RegExp(job) })).toContainText("1.619,00");
  await page.getByRole("link", { name: new RegExp(job) }).click();

  // Back to draft, then delete.
  await page.getByRole("button", { name: "Terug naar ontwerp" }).click();
  await expect(page.getByRole("button", { name: "Regel toevoegen" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Offerte verwijderen" }).click();
  await expect(page.getByRole("heading", { name: job })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Nog geen offertes voor deze job.");
});

test("a job at 6% gives new quote lines 6% VAT", async ({ page }, testInfo) => {
  const p = testInfo.project.name;
  const customer = `E2E Renovatieklant ${p}`;
  const job = `E2E Renovatie ${p}`;
  sql(`update public.settings set vat_rate = 21`);
  sql(`insert into public.customers (type, name) values ('private', '${customer}')`);
  sql(
    `insert into public.jobs (customer_id, title)
     select id, '${job}' from public.customers where name = '${customer}'`,
  );

  await logIn(page, users.owner.email, users.owner.password);
  await page.goto("/jobs");
  await page.getByRole("link", { name: new RegExp(`^${job}`) }).click();
  await page.getByRole("combobox", { name: "Btw-tarief" }).selectOption("6");
  await page.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("opgeslagen");

  await page.getByRole("button", { name: "Nieuwe offerte" }).click();
  const addForm = page.getByRole("region", { name: "Regel toevoegen" });
  await expect(addForm.getByRole("combobox", { name: "Btw" })).toHaveValue("6");
});
