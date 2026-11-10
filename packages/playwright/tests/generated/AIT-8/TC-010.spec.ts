// Generated for TC-010; replay status is recorded separately.
import { test, expect } from "@playwright/test";
import { CommonPage } from "../../../pages/CommonPage.js";
import { FlightSearchPage } from "../../../pages/FlightSearchPage.js";
import { requireTestData } from "../../../test-data/runtimeTestData.js";

test("TC-010", async ({ page }) => {
  const common = new CommonPage(page);
  const flightSearch = new FlightSearchPage(page);

  // S1
  await page.goto("https://www.etihad.com/en-in/", { waitUntil: "domcontentloaded" });

  // S2
  await common.click(flightSearch.origin);

  // S3
  await flightSearch.fillAirport("origin", requireTestData("origin"));

  // S4
  // S5
  await common.click(flightSearch.destination);

  // S6
  await flightSearch.fillAirport("destination", requireTestData("destination"));

  // S7
  // S8
  await common.clickIfPresent(page.getByText("Guests & Cabin", { exact: true }));

  // S9
  await flightSearch.expectGuestsCabinPanelHidden();

  // S10
  await flightSearch.expectGuestsCabinPanelHidden();

});
