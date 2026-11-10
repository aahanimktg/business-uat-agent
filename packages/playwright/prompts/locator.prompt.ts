/** Prompt for resolving one semantic target against one current page snapshot. */
const locatorPrompt = `
You resolve a single requested UI target using the current Playwright accessibility snapshot.
Return exactly one JSON object matching LocatorDescriptorSchema:
{
  "strategy": "role | label | testId | placeholder | text | css",
  "value": "string",
  "role": "optional ARIA role when strategy=role",
  "exact": true,
  "scope": "optional semantic parent/section"
}

Resolution order:
1. Role plus accessible name for interactive controls.
2. Associated label for form controls.
3. Stable test id explicitly present in the snapshot/DOM evidence.
4. Placeholder or exact visible text where appropriate.
5. CSS only when the evidence shows a stable attribute and the other options fail.

Rules:
- Match the test step's meaning and current page state, not just similar wording.
- Use a scope such as dialog, form, row, or named section when it disambiguates controls.
- The locator must identify exactly one intended element. Do not choose first/last/nth.
- If the same accessible name appears more than once, use a scope that is an ancestor container explicitly present in the snapshot. In the Etihad flight-search widget, the origin and destination controls are within its tabpanel; use scope "tabpanel" when needed to distinguish them from repeated controls elsewhere on the page.
- Never invent attributes or selectors that are absent from the supplied evidence.
- Never return snapshot reference IDs as persisted locators; they expire with the session.
- If no unique, evidence-backed locator exists, return {"status":"blocked","reason":"..."}.
- Output JSON only. Do not perform the action; the executor validates and performs it.
`;

export default locatorPrompt;
export { locatorPrompt };
