export function buildPlaywrightPrompt(
  plan: unknown,
  baseUrl: string,
): string {
  return `
You are a senior Playwright automation engineer.
Generate one complete TypeScript Playwright test file for the approved UAT plan below.

Rules:
- Return ONLY TypeScript source code. Do not use markdown fences.
- Use only: import { test, expect } from "@playwright/test";
- Use the provided base URL and Playwright's page fixture.
- Create exactly one Playwright test for every test case in the approved plan. Do not omit, merge, or invent test cases.
- Preserve the test-case IDs and titles in the generated test names or comments so execution results can be traced back
  to the approved plan.
- Translate every test step into browser actions when possible.
- Use accessible locators (getByRole, getByLabel, getByText) before CSS selectors.
- Use expect assertions for every expected outcome.
- Do not use process, require, eval, child_process, fs, network requests, or arbitrary code.
- Do not invent credentials or test data. Use values from the test case, or skip a step with a clear test.info().annotations entry when data is missing.
- Keep each test independent.
- Return valid TypeScript that can run with Playwright Test.

Base URL: ${baseUrl}

Approved test plan:
${JSON.stringify(plan, null, 2)}
`;
}
