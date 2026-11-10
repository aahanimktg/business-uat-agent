// Generated for TC-007; replay status is recorded separately.
import { test, expect } from "@playwright/test";
import { CommonPage } from "../../../pages/CommonPage.js";
import { FlightSearchPage } from "../../../pages/FlightSearchPage.js";
import { requireTestData } from "../../../test-data/runtimeTestData.js";

test("TC-007", async ({ page }) => {
  const common = new CommonPage(page);
  const flightSearch = new FlightSearchPage(page);

  // S1
  await page.goto("https://www.etihad.com/en-in/", { waitUntil: "domcontentloaded" });

  // S2
  await common.clickIfPresent(page.getByText("Guests & Cabin", { exact: true }));

  // S3
  await flightSearch.expectGuestsCabinPanelHidden();

  // S4
  await common.click(flightSearch.origin);

  // S5
  await flightSearch.fillAirport("origin", requireTestData("origin"));

  // S6
  await flightSearch.selectFirstAirportSuggestion("origin");

  // S7
  await common.clickIfPresent(page.getByText("Guests & Cabin", { exact: true }));

  // S8
  await flightSearch.expectGuestsCabinPanelHidden();

  // S9
  await flightSearch.expectGuestsCabinPanelHidden();

});
