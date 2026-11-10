// Generated for TC-AIT-6-013; replay status is recorded separately.
import { test, expect } from "@playwright/test";
import { CommonPage } from "../../../pages/CommonPage.js";
import { FlightSearchPage } from "../../../pages/FlightSearchPage.js";
import { requireTestData } from "../../../test-data/runtimeTestData.js";

test("TC-AIT-6-013", async ({ page }) => {
  const common = new CommonPage(page);
  const flightSearch = new FlightSearchPage(page);

  // S1
  await page.goto("https://www.etihad.com/en-ae/", { waitUntil: "domcontentloaded" });

  // S2
  await flightSearch.waitUntilReady("https://www.etihad.com/en-ae/");

  // S3
  await common.click(flightSearch.origin);

  // S4
  await flightSearch.fillAirport("origin", requireTestData("originCity"));

  // S5
  await flightSearch.waitForAirportSuggestions(requireTestData("originCity"));

  // S6
  await flightSearch.selectFirstAirportSuggestion("origin");

  // S7
  await common.click(flightSearch.destination);

  // S8
  await flightSearch.fillAirport("destination", requireTestData("destinationCity"));

  // S9
  await flightSearch.waitForAirportSuggestions(requireTestData("destinationCity"));

  // S10
  await flightSearch.selectFirstAirportSuggestion("destination");

  // S11
  await flightSearch.selectJourneyType("oneWay");

  // S12
  await common.expectValue(flightSearch.origin, requireTestData("originCity"));

  // S13
  await common.expectValue(flightSearch.destination, requireTestData("destinationCity"));

  // S14
  await flightSearch.selectJourneyType("roundTrip");

  // S15
  await common.expectValue(flightSearch.origin, requireTestData("originCity"));

  // S16
  await common.expectValue(flightSearch.destination, requireTestData("destinationCity"));

  // S17
  await common.expectValue(flightSearch.origin, requireTestData("originCity"));

  // S18
  await common.expectValue(flightSearch.destination, requireTestData("destinationCity"));

});
