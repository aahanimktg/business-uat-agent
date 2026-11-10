import { expect, type Locator, type Page } from "@playwright/test";
import { CommonPage } from "./CommonPage.js";

export type AirportField = "origin" | "destination";
export type JourneyType = "oneWay" | "roundTrip" | "multiCity";
export type PassengerGroup = "Adults" | "Children" | "Infants" | "Infants with Seat" | "Young Adults";
export type PassengerDirection = "increase" | "decrease";

export class FlightSearchPage extends CommonPage {
  readonly searchPanel: Locator;
  readonly origin: Locator;
  readonly destination: Locator;
  readonly oneWay: Locator;
  readonly roundTrip: Locator;
  readonly multiCity: Locator;

  constructor(page: Page) {
    super(page);
    this.searchPanel = page.getByRole("tabpanel").filter({
      has: page.getByRole("button", { name: "Search", exact: true }),
    });
    this.origin = this.searchPanel.getByRole("combobox", {
      name: "Flying from",
      exact: true,
    });
    this.destination = this.searchPanel.getByRole("combobox", {
      name: "Flying to",
      exact: true,
    });
    this.oneWay = page.getByRole("tab", { name: "One way", exact: true });
    this.roundTrip = page.getByRole("tab", { name: "Round trip", exact: true });
    this.multiCity = page.getByRole("tab", { name: "Multi-city", exact: true });
  }

  async waitUntilReady(url: string): Promise<void> {
    await expect(this.page).toHaveURL(url);
    await expect(this.searchPanel, "Expected exactly one flight-search panel.").toHaveCount(1);
    await expect(this.origin, "Expected one Origin field in the flight-search panel.").toHaveCount(1);
    await expect(this.destination, "Expected one Destination field in the flight-search panel.").toHaveCount(1);
  }

  async fillAirport(field: AirportField, value: string): Promise<void> {
    const locator = this.airportField(field);
    await locator.press("Control+A");
    await locator.press("Backspace");
    await locator.pressSequentially(value);
  }

  async waitForAirportSuggestions(expectedText: string): Promise<void> {
    await expect(this.page.getByRole("listbox"), "Expected airport suggestions to be visible.").toBeVisible();
    await expect(
      this.page.getByRole("option").filter({ hasText: expectedText }),
      `Expected a visible airport suggestion containing '${expectedText}'.`,
    ).not.toHaveCount(0);
  }

  async selectFirstAirportSuggestion(field: AirportField): Promise<void> {
    const locator = this.airportField(field);
    await locator.press("ArrowDown");
    await locator.press("Enter");
  }

  async selectJourneyType(type: JourneyType): Promise<void> {
    await (type === "oneWay" ? this.oneWay : this.roundTrip).click();
  }

  async expectGuestsCabinPanelHidden(): Promise<void> {
    await expect(this.page.getByRole("radio", { name: /^(Economy|Business|First)$/ })).toHaveCount(0);
  }

  get guestsCabinTile(): Locator {
    return this.page.getByText("Guests and Cabin", { exact: true });
  }

  cabinOption(cabin: string): Locator {
    return this.page.getByRole("radio", { name: cabin, exact: true });
  }

  passengerCount(group: PassengerGroup): Locator {
    return this.passengerRow(group).getByRole("textbox");
  }

  passengerControl(group: PassengerGroup, direction: PassengerDirection): Locator {
    return this.passengerRow(group).getByRole("tab", {
      name: direction === "increase" ? "+" : "-",
      exact: true,
    });
  }

  private passengerRow(group: PassengerGroup): Locator {
    return this.page.getByText(group, { exact: true }).locator("xpath=ancestor::*[.//input][1]");
  }

  private airportField(field: AirportField): Locator {
    return field === "origin" ? this.origin : this.destination;
  }
}
