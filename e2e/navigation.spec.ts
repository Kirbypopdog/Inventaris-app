import { expect, test } from "@playwright/test";
import { logIn, users } from "./support";

test("the main menu is at the bottom on a phone and on the left on a laptop", async ({ page }) => {
  await logIn(page, users.owner.email, users.owner.password);
  const nav = page.getByRole("navigation", { name: "Hoofdmenu" });
  await expect(nav).toBeVisible();

  const box = await nav.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (box && viewport) {
    if (viewport.width >= 768) {
      expect(box.x).toBe(0);
      expect(box.width).toBeLessThan(300);
    } else {
      expect(Math.round(box.y + box.height)).toBe(viewport.height);
      expect(box.width).toBe(viewport.width);
    }
  }

  for (const [label, heading] of [
    ["Jobs", "Jobs"],
    ["Klanten", "Klanten"],
    ["Materiaal", "Materiaal"],
    ["Account", "Account"],
  ] as const) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  }
});
