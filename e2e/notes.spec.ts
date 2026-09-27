import { type Page, expect, test } from "@playwright/test";
import { logIn, openJob, openJobTab, sql, users } from "./support";

/** A fresh job for one test, opened on its overview. */
async function openNewJob(page: Page, job: string): Promise<void> {
  const customer = `Klant van ${job}`;
  sql(`insert into public.customers (type, name) values ('private', '${customer}')`);
  sql(
    `insert into public.jobs (customer_id, title)
     select id, '${job}' from public.customers where name = '${customer}'`,
  );
  await logIn(page, users.owner.email, users.owner.password);
  await openJob(page, job);
}

test("tasks per job", async ({ page }, testInfo) => {
  await openNewJob(page, `E2E Takenjob ${testInfo.project.name}`);

  // No tasks yet: the overview shows nothing about them.
  await expect(page.getByRole("heading", { name: "Nog te doen" })).toHaveCount(0);

  // Add two tasks; the field is empty again after each one.
  await openJobTab(page, "Notities");
  const taskField = page.getByRole("textbox", { name: "Nieuwe taak" });
  await taskField.fill("Plinten bestellen");
  await page.getByRole("button", { name: "Toevoegen" }).click();
  const open = page.getByRole("list", { name: "Open taken" });
  await expect(open.getByRole("listitem")).toHaveCount(1);
  await expect(taskField).toHaveValue("");
  await taskField.fill("Silicone afwerken");
  await page.getByRole("button", { name: "Toevoegen" }).click();
  await expect(open.getByRole("listitem")).toHaveCount(2);

  // The overview lists the open tasks, and ticking one off works there too.
  await openJobTab(page, "Overzicht");
  const overview = page.getByRole("list", { name: "Nog te doen" });
  await expect(overview.getByRole("listitem")).toHaveCount(2);
  await overview.getByRole("checkbox", { name: "Plinten bestellen" }).check();
  await expect(overview.getByRole("listitem")).toHaveCount(1);

  // The ticked task is under Afgewerkt, and can be opened again.
  await openJobTab(page, "Notities");
  await expect(open.getByRole("listitem")).toHaveCount(1);
  await page.getByText("Afgewerkt (1)").click();
  const done = page.getByRole("list", { name: "Afgewerkte taken" });
  await expect(done.getByRole("checkbox", { name: "Plinten bestellen" })).toBeChecked();
  await done.getByRole("checkbox", { name: "Plinten bestellen" }).uncheck();
  await expect(open.getByRole("listitem")).toHaveCount(2);

  // Tick it off again and clear the done tasks.
  await open.getByRole("checkbox", { name: "Plinten bestellen" }).check();
  await expect(open.getByRole("listitem")).toHaveCount(1);
  await page.getByText("Afgewerkt (1)").click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Afgewerkte taken wissen" }).click();
  await expect(page.getByText(/^Afgewerkt \(/)).toHaveCount(0);

  // Tasks can be found in search.
  await page.goto("/zoeken?q=silicone");
  await expect(page.getByRole("main")).toContainText("Taak: Silicone afwerken");
});

test("notes per job", async ({ page }, testInfo) => {
  await openNewJob(page, `E2E Notitiejob ${testInfo.project.name}`);
  await openJobTab(page, "Notities");

  // A note: the form opens from "+ Nieuwe notitie".
  await page.getByText("+ Nieuwe notitie").click();
  await page
    .getByLabel("Nieuwe notitie")
    .fill("Klant wil de deur links draaiend.\nSleutel bij de buren.");
  await page.getByRole("button", { name: "Notitie bewaren" }).click();
  const notes = page.getByRole("main").getByRole("listitem").filter({ hasText: "draaiend" });
  await expect(notes).toHaveCount(1);
  await expect(notes).toContainText(users.owner.displayName);

  // Correct it, then delete it.
  await notes.getByText("Aanpassen of verwijderen").click();
  await notes
    .getByRole("textbox", { name: "Notitie", exact: true })
    .fill("Klant wil de deur rechts draaiend.");
  await notes.getByRole("button", { name: "Aanpassing opslaan" }).click();
  await expect(notes).toContainText("rechts draaiend");

  // Notes are part of the export.
  const response = await page.request.get("/export/notities");
  expect(await response.text()).toContain(
    `${users.owner.displayName};Klant wil de deur rechts draaiend.`,
  );

  page.once("dialog", (dialog) => dialog.accept());
  await notes.getByRole("button", { name: "Verwijderen" }).click();
  await expect(notes).toHaveCount(0);
});

test("measurements per job", async ({ page }, testInfo) => {
  await openNewJob(page, `E2E Opmeetjob ${testInfo.project.name}`);
  await openJobTab(page, "Notities");

  // At least one size, in whole mm.
  await page.getByText("+ Nieuwe opmeting").click();
  const form = page.locator("form").filter({ hasText: "Opmeting bewaren" });
  await form.getByLabel("Wat").fill("Kast hal");
  await form.getByRole("button", { name: "Opmeting bewaren" }).click();
  await expect(form.getByRole("alert")).toContainText("Vul minstens één maat in.");
  await form.getByLabel("Breedte").fill("12,5");
  await form.getByRole("button", { name: "Opmeting bewaren" }).click();
  await expect(form.getByRole("alert")).toContainText("hele millimeter");

  await form.getByLabel("Breedte").fill("1 200");
  await form.getByLabel("Hoogte").fill("2400");
  await form.getByLabel("Diepte").fill("600");
  await form.getByLabel("Notitie").fill("Plafond loopt af");
  await form.getByRole("button", { name: "Opmeting bewaren" }).click();
  const list = page.getByRole("list", { name: "Opmetingen" });
  const item = list.getByRole("listitem").filter({ hasText: "Kast hal" });
  await expect(item).toContainText("B 1200 × H 2400 × D 600 mm");
  await expect(item).toContainText("Plafond loopt af");

  // Correct it (tap the measurement): only the width.
  await item.getByText("Kast hal").click();
  await item.getByLabel("Hoogte").fill("");
  await item.getByLabel("Diepte").fill("");
  await item.getByLabel("Breedte").fill("5320");
  await item.getByRole("button", { name: "Aanpassing opslaan" }).click();
  await expect(item).toContainText("B 5320 mm");
  await expect(item).not.toContainText("H 2400");

  // Found in search and part of the export.
  await page.goto("/zoeken?q=plafond");
  await expect(page.getByRole("main")).toContainText("Opmeting: Kast hal");
  const response = await page.request.get("/export/opmetingen");
  expect(await response.text()).toContain(";Kast hal;5320;;;Plafond loopt af;");

  // Delete it.
  await page.goBack();
  await item.getByText("Kast hal").click();
  page.once("dialog", (dialog) => dialog.accept());
  await item.getByRole("button", { name: "Verwijderen" }).click();
  await expect(list).toHaveCount(0);
});
