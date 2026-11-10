import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import playwrightConfig from "../../../playwright.config.js";
import {
  chromiumContextOptions,
  chromiumLaunchOptions,
  createMcpBrowserConfig,
} from "./browserProfile.js";

test("MCP and Playwright runner use the same headed Chromium launch and context profile", () => {
  const project = playwrightConfig.projects?.find(item => item.name === "chromium");
  assert.ok(project);

  const mcpBrowser = createMcpBrowserConfig("output/automation/mcp").browser;
  assert.deepEqual(mcpBrowser.launchOptions, project.use?.launchOptions);
  assert.deepEqual(mcpBrowser.launchOptions, chromiumLaunchOptions);

  const runnerContextOptions = Object.fromEntries(
    Object.keys(chromiumContextOptions).map(key => [key, playwrightConfig.use?.[key as keyof typeof playwrightConfig.use]]),
  );
  assert.deepEqual(mcpBrowser.contextOptions, runnerContextOptions);
  assert.deepEqual(mcpBrowser.contextOptions, chromiumContextOptions);
  assert.equal(playwrightConfig.use?.headless, false);
});

test("the checked-in MCP profile stays aligned with the shared browser profile", async () => {
  const file = path.resolve("packages/playwright/mcp/playwright-mcp.config.json");
  const value: unknown = JSON.parse(await readFile(file, "utf8"));
  assert.ok(value && typeof value === "object" && "browser" in value);
  const browser = (value as { browser: { launchOptions: unknown; contextOptions: unknown } }).browser;
  assert.deepEqual(browser.launchOptions, chromiumLaunchOptions);
  assert.deepEqual(browser.contextOptions, chromiumContextOptions);
});
