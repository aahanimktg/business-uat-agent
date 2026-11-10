# Etihad Flight Search Context

## Purpose
This document captures known Etihad Flight Search business rules and UI behaviors to improve AI-generated test scenarios, UAT coverage, validation rules, and planner accuracy.

---

# Business Assumptions

## Nearby Airport Recommendations

- Nearby airport recommendations are generated based on:
  - User country / geolocation
  - Entered city or airport
  - CMS / business configuration

- When a customer searches using a city name:
  - Airports within that city may be displayed.
  - Nearby airports may also be suggested.
  - Google location suggestions may appear before airport suggestions.
  - Selecting a suggested location displays nearby airports available for booking.

## Airport Availability

- Only active/bookable airports are returned by the search system.
- Active/inactive airport validation is considered a backend business rule.
- Do not raise clarification requests unless inactive airport test data is explicitly provided.

## Responsive Scope

The booking widget supports:

- Desktop Web
- Tablet Web
- Mobile Web

## Search Outcome

When Search is executed successfully:

1. User is navigated to Search Results Page (SRP).
2. Available flights matching the selected criteria are displayed.

---

# Journey Types

Currently supported journey types:

1. Round Trip
2. One Way
3. Multi City

Rules:

- Round Trip is selected by default.
- Round Trip is the default selection when the booking widget loads.
- Only one journey type can be selected at a time.

---

# Flight Search Flow

Default booking flow:

1. Trip Type Selection
2. Origin Selection
3. Destination Selection
4. Guests & Cabin Selection
5. Travel Date Selection
6. Search

---

# Origin Selection

## Default Behavior

- Origin is pre-populated using user geolocation.
- User can replace the pre-populated origin.
- Airport search supports:
  - Airport Code
  - Airport Name
  - City Name

## Suggestions

Users can search and select origin using:

- Airport Code
- Airport Name
- City Name
- Airport suggestions

---

# Destination Selection

## Default Behavior

When Destination field is opened:

- Popular destinations are displayed immediately.
- User can select a destination without typing.
- User can also search using:
  - Airport Code
  - Airport Name
  - City Name

## Nearby Airport Suggestions

When a city is searched:

- Airports within the city may be shown.
- Nearby airports may also be suggested.
- Google-style location suggestions may appear first.
- Selecting a location displays airports available for that location.

## Validation Rules

- Origin and Destination cannot be identical.
- Origin and Destination cannot belong to the same city.
- Domestic routing where both selected airports belong to the same country is not supported in current booking flow.
- If Origin is changed after Destination was selected:
  - Destination is automatically cleared.
  - User must select Destination again.

---

# Guests and Cabin

## Availability

Guests & Cabin selection cannot be accessed until:

- Origin is selected.
- Destination is selected.

If either field is missing:

- Guest & Cabin selection is blocked.

## Auto Open Behavior

- Immediately after Destination selection, Guests & Cabin popup opens automatically.

## Closing Behavior

Popup closes when:

- Continue is clicked.
- User clicks outside the popup.

## Continue Behavior

When Continue is clicked:

- Date Picker opens automatically.

If popup is closed without Continue:

- User must manually open Date Picker.

---

# Passenger Rules

## Passenger Types

### Adult

- Age: 12+
- Default Count: 1
- Minimum Count: 1
- Cannot be reduced to 0 through UI.
- Minus button remains disabled when only 1 Adult exists.

### Child

- Age: 2 to 11 years

### Infant

- Under 2 years
- No seat assigned

### Infant with Seat

- Under 2 years
- Dedicated seat assigned

---

# Passenger Limits

## Seat Limit

Maximum seats per booking:

- 9 passengers

Seat count calculation:

- Adults
- Children
- Infants with Seat

Total of above categories cannot exceed 9.

## Child Limit

- Maximum Children = 8
- Overall booking must still comply with maximum 9 seat rule.

## Adult Requirement

- At least 1 Adult is mandatory for every booking.

## Infant Rules

- Infants must always be associated with an Adult.
- Applies to:
  - Infant
  - Infant with Seat

- Infant-only bookings are not allowed.

---

# Cabin Selection

Supported cabin classes:

1. Economy
2. Business
3. First

Rules:

- Economy is selected by default.
- Cabin options are displayed as radio buttons.
- Only one cabin class can be selected at a time.

---

# Date Selection

## Round Trip

After Guests & Cabin selection:

- Date Picker opens.

Round Trip selection requires:

- Departure Date
- Return Date

Rules:

- Both dates are selected within the same calendar window.
- Calendar behaves as a date range selector.

## Flight Availability Calendar

- Dates displaying a price indicate flight availability.
- Dates without a displayed amount generally indicate no available flights.

### Exception

For bookings using:

- Etihad Guest Miles
- Loyalty Points

Price values may not be displayed in the calendar.

---

# Multi City Rules

## General

Multi City supports:

- Maximum 6 flight segments

## Default Flow

When Multi City is selected:

1. Flight 1 Destination field receives focus.
2. Popular destination suggestions are displayed.
3. Current date is selected by default.
4. Destination selection triggers Date Picker.
5. After date selection:
   - Flight 2 Origin field becomes active.
   - User continues building itinerary.

---

# Search Button Behavior

## General

- Search button remains enabled at all times.
- No inline field validation messages are displayed on the booking widget.

## Validation Handling

Validation is managed within:

- Origin popup
- Destination popup
- Guests & Cabin popup
- Date Picker

Validation messages are not shown outside these components.

## Search Execution

When Search is clicked:

### If all required fields are valid

- Search executes.
- User is navigated to SRP.

### If required fields are missing or invalid

- Relevant incomplete component opens automatically.
- User is guided to complete missing information.
- Search is not executed until required inputs are valid.

---

# Key UAT Assumptions

Do not raise clarification requests for:

- Nearby airport country configuration
- Active vs inactive airport definition
- Supported responsive devices
- Search results behavior after successful search

These areas are considered predefined business behavior for Etihad Flight Search.