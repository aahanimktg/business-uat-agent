// Generated for TC-004; replay status is recorded separately.
import { test, expect } from "@playwright/test";
import { CommonPage } from "../../../pages/CommonPage.js";
import { FlightSearchPage } from "../../../pages/FlightSearchPage.js";
import { requireTestData } from "../../../test-data/runtimeTestData.js";

test("TC-004", async ({ page }) => {
  const common = new CommonPage(page);
  const flightSearch = new FlightSearchPage(page);

  // S1
  await page.goto("https://www.etihad.com/en-in/", { waitUntil: "domcontentloaded" });

  // S2
  await common.click(flightSearch.origin);

  // S3
  await flightSearch.fillAirport("origin", requireTestData("origin"));

  // S4
  await flightSearch.selectFirstAirportSuggestion("origin");

  // S5
  await common.click(flightSearch.destination);

  // S6
  await flightSearch.fillAirport("destination", requireTestData("destination"));

  // S7
  await flightSearch.selectFirstAirportSuggestion("destination");

  // S8
  await common.expectVisible(flightSearch.guestsCabinTile);

  // S9
  await common.expectDisabled(flightSearch.passengerControl("Adults", "decrease"));

  // S10
  await common.expectValue(flightSearch.passengerCount("Adults"), requireTestData("expectedAdultCountMinimum"));

  // S11
  await common.expectValue(flightSearch.passengerCount("Adults"), requireTestData("expectedAdultCountMinimum"));

});
