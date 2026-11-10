import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import { getApplicationBaseUrl } from "./packages/playwright/config/applicationConfig.js";
import { chromiumContextOptions, chromiumLaunchOptions } from "./packages/playwright/config/browserProfile.js";

dotenv.config();

export default defineConfig({
  testDir: "./packages/playwright/tests",
  fullyParallel: true,
  timeout: 60_000,
  expect: {timeout: 10_000,},
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "playwright-report",
        open: "never",
      },
    ],
  ],

  use: {
    baseURL: getApplicationBaseUrl(),
    ...chromiumContextOptions,
    headless: chromiumLaunchOptions.headless,
    actionTimeout: 15_000,
    navigationTimeout: 120_000,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { launchOptions: chromiumLaunchOptions },
    },
  ],

  outputDir: "test-results",
});