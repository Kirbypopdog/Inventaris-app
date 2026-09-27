import { expect, test } from "@playwright/test";
import { logIn, openFromMenu, users } from "./support";

test("the main menu is at the bottom on a phone and on the left on a laptop", async ({ page }) => {
  await logIn(page, users.owner.email, users.owner.password);
  const nav = page.getByRole("navigation", { name: "Hoofdmenu" });
  await expect(nav).toBeVisible();

  const box = await nav.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  const onLaptop = viewport !== null && viewport.width >= 768;
  if (box && viewport) {
    if (onLaptop) {
      expect(box.x).toBe(0);
      expect(box.width).toBeLessThan(300);
    } else {
      expect(Math.round(box.y + box.height)).toBe(viewport.height);
      expect(box.width).toBe(viewport.width);
    }
  }

  // A phone shows the five daily items; the rest sits behind "Meer".
  await expect(nav.getByRole("link")).toHaveCount(onLaptop ? 8 : 5);

  for (const [label, heading] of [
    ["Projecten", "Projecten"],
    ["Agenda", /^Week \d+$/],
    ["Offertes", "Offertes"],
    ["Meer", "Meer"],
    ["Start", null],
  ] as const) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    if (heading) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }

  // Materiaal and Analyses: in the sidebar on a laptop, under "Meer" on a phone.
  for (const label of ["Materiaal", "Analyses"]) {
    await openFromMenu(page, label);
    await expect(
      page.getByRole("heading", { level: 1, name: new RegExp(`^${label}`) }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: onLaptop ? label : "Meer", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});
