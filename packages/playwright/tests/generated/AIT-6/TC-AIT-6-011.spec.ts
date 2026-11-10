// Generated for TC-AIT-6-011; replay status is recorded separately.
import { test, expect } from "@playwright/test";
import { CommonPage } from "../../../pages/CommonPage.js";
import { FlightSearchPage } from "../../../pages/FlightSearchPage.js";
import { requireTestData } from "../../../test-data/runtimeTestData.js";

test("TC-AIT-6-011", async ({ page }) => {
  const common = new CommonPage(page);
  const flightSearch = new FlightSearchPage(page);

  // S1
  await page.goto("https://www.etihad.com/en-ae/", { waitUntil: "domcontentloaded" });

  // S2
  await flightSearch.waitUntilReady("https://www.etihad.com/en-ae/");

  // S3
  await common.click(flightSearch.origin);

  // S4
  await flightSearch.fillAirport("origin", requireTestData("originQuery"));

  // S5
  await flightSearch.waitForAirportSuggestions(requireTestData("originQuery"));

  // S6
  await common.expectVisible(page.getByText("", { exact: true }));

  // S7
  await common.expectVisible(page.getByText("", { exact: true }));

});
