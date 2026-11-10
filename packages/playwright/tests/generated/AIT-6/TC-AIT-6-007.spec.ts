// Generated for TC-AIT-6-007; replay status is recorded separately.
import { test, expect } from "@playwright/test";
import { CommonPage } from "../../../pages/CommonPage.js";
import { FlightSearchPage } from "../../../pages/FlightSearchPage.js";
import { requireTestData } from "../../../test-data/runtimeTestData.js";

test("TC-AIT-6-007", async ({ page }) => {
  const common = new CommonPage(page);
  const flightSearch = new FlightSearchPage(page);

  // S1
  await page.goto("https://www.etihad.com/en-ae/", { waitUntil: "domcontentloaded" });

  // S2
  await flightSearch.waitUntilReady("https://www.etihad.com/en-ae/");

  // S3
  await common.click(flightSearch.origin);

  // S4
  await flightSearch.fillAirport("origin", "A");

  // S5
  await flightSearch.waitForAirportSuggestions("A");

  // S6
  await flightSearch.fillAirport("origin", "AU");

  // S7
  await flightSearch.waitForAirportSuggestions("AU");

  // S8
  await flightSearch.fillAirport("origin", requireTestData("originCode"));

  // S9
  await flightSearch.waitForAirportSuggestions(requireTestData("originCode"));

  // S10
  await flightSearch.selectFirstAirportSuggestion("origin");

  // S11
  await common.expectValue(flightSearch.origin, requireTestData("originCode"));

  // S12
  await common.expectValue(flightSearch.origin, requireTestData("originCode"));

});
