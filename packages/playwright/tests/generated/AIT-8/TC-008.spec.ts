// Generated for TC-008; replay status is recorded separately.
import { test, expect } from "@playwright/test";
import { CommonPage } from "../../../pages/CommonPage.js";
import { FlightSearchPage } from "../../../pages/FlightSearchPage.js";
import { requireTestData } from "../../../test-data/runtimeTestData.js";

test("TC-008", async ({ page }) => {
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
  await common.click(flightSearch.passengerControl("Adults", "increase"));

  // S10
  await common.click(flightSearch.passengerControl("Adults", "increase"));

  // S11
  await common.click(flightSearch.passengerControl("Adults", "increase"));

  // S12
  await common.click(flightSearch.passengerControl("Adults", "increase"));

  // S13
  await common.click(flightSearch.passengerControl("Adults", "increase"));

  // S14
  await common.click(flightSearch.passengerControl("Adults", "increase"));

  // S15
  await common.click(flightSearch.passengerControl("Adults", "increase"));

  // S16
  await common.click(flightSearch.passengerControl("Adults", "increase"));

  // S17
  await common.expectValue(flightSearch.passengerCount("Adults"), "9");

  // S18
  await common.expectDisabled(flightSearch.passengerControl("Adults", "increase"));

  // S19
  await common.click(common.locator({"strategy":"role","value":"Search","role":"button","exact":true}));

  // S20
  await common.expectVisible(flightSearch.guestsCabinTile);

  // S21
  await common.expectVisible(flightSearch.guestsCabinTile);

});
