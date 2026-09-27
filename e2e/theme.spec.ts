import { expect, test } from "@playwright/test";
import { logIn, users } from "./support";

const LIGHT = "rgb(250, 247, 242)";
const DARK = "rgb(15, 13, 12)";

test("the look follows the device unless light or dark is chosen", async ({ page }) => {
  // The device is set to dark.
  await page.emulateMedia({ colorScheme: "dark" });
  await logIn(page, users.owner.email, users.owner.password);
  await page.goto("/account");
  const html = page.locator("html");
  const body = page.locator("body");
  const look = page.getByRole("region", { name: "Weergave" });

  // Automatic: dark like the device.
  await expect(look.getByRole("button", { name: "Automatisch" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(body).toHaveCSS("background-color", DARK);

  // Light wins over the device, also after a reload.
  await look.getByRole("button", { name: "Licht" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(body).toHaveCSS("background-color", LIGHT);
  await page.reload();
  await expect(look.getByRole("button", { name: "Licht" })).toHaveAttribute("aria-pressed", "true");
  await expect(body).toHaveCSS("background-color", LIGHT);

  // Dark on a light device.
  await page.emulateMedia({ colorScheme: "light" });
  await look.getByRole("button", { name: "Donker" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(body).toHaveCSS("background-color", DARK);

  // Back to automatic: the device decides again.
  await look.getByRole("button", { name: "Automatisch" }).click();
  await expect(html).not.toHaveAttribute("data-theme");
  await expect(body).toHaveCSS("background-color", LIGHT);
});
