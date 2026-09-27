import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // De tests delen één mailbox en één database: na elkaar uitvoeren.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        // Lokaal kan een vooraf geïnstalleerde Chromium gebruikt worden.
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined },
      },
    },
    {
      // De laptopweergave: enkel de tests die over de indeling gaan.
      name: "desktop",
      testMatch: [
        "navigation.spec.ts",
        "customers-jobs.spec.ts",
        "clock.spec.ts",
        "materials.spec.ts",
        "trips.spec.ts",
        "rate-overrides.spec.ts",
        "forgotten-clock.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined },
      },
    },
  ],
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: `http://127.0.0.1:${port}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
