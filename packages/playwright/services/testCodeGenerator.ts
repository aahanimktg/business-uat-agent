import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ExecutionPlan, PlannedStep } from "../schemas/actionPlan.schema.js";
import type { LocatorDescriptor } from "../schemas/locator.schema.js";

export type TestGenerationInput = {
  storyId?: string;
  actionPlan: ExecutionPlan;
  testCase: { id: string; title: string; expectedOutcome?: string; steps: string[] };
  testData: Record<string, unknown>;
  verifiedLocators: Array<{ stepId: string; sourceStep: string; locator: LocatorDescriptor; evidence?: string }>;
};

/** Creates a replayable Playwright spec from the approved case and validated action plan. */
export async function generateTestFile(input: TestGenerationInput) {
  const source = renderPlaywrightTest(input);
  validateGeneratedSource(source, input);

  const safeStory = safeName(input.storyId ?? "unassigned-story");
  const safeCase = safeName(input.testCase.id);
  const root = path.resolve(__dirname, "../../..");
  const file = path.join(root, "packages/playwright/tests/generated", safeStory, `${safeCase}.spec.ts`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `// Generated for ${input.testCase.id}; replay status is recorded separately.\n${source}\n`, "utf8");
  return file;
}

function renderPlaywrightTest(input: TestGenerationInput) {
  const { actionPlan, testCase, testData } = input;
  const lines = [
    'import { test, expect } from "@playwright/test";',
    'import { CommonPage } from "../../../pages/CommonPage.js";',
    'import { FlightSearchPage } from "../../../pages/FlightSearchPage.js";',
    'import { requireTestData } from "../../../test-data/runtimeTestData.js";',
    "",
    `test(${JSON.stringify(testCase.id)}, async ({ page }) => {`,
    "  const common = new CommonPage(page);",
    "  const flightSearch = new FlightSearchPage(page);",
    "",
  ];
  let activeAirportField: "origin" | "destination" | undefined;
  for (const [stepIndex, step] of actionPlan.steps.entries()) {
    lines.push(`  // ${step.id}`);
    lines.push(...renderStep(step, input, actionPlan.steps[stepIndex + 1]));
    if (step.action === "fill") {
      activeAirportField = fieldName(step.target);
    }
    if (step.action === "click" && isAirportSuggestionTarget(step.target ?? "")) {
      if (!activeAirportField) throw new Error(`${step.id}: airport suggestion selection has no preceding airport field`);
      lines.push(`  await flightSearch.selectFirstAirportSuggestion(${JSON.stringify(activeAirportField)});`);
      lines.push("");
    }
  }
  lines.push("});");
  return lines.join("\n");
}

function renderStep(
  step: PlannedStep,
  input: TestGenerationInput,
  nextStep?: PlannedStep,
) {
  if (step.action === "noOp") return [];
  if (step.action === "navigate") return [`  await page.goto(${JSON.stringify(step.value)}, { waitUntil: "domcontentloaded" });`, ""];
  if (step.action === "waitForLoad") {
    const url = input.actionPlan.steps.find(item => item.action === "navigate")?.value;
    if (!url) throw new Error(`${step.id}: cannot verify page load because the plan has no navigation URL`);
    if (input.actionPlan.steps.some(item => fieldName(item.target))) {
      return [`  await flightSearch.waitUntilReady(${JSON.stringify(url)});`, ""];
    }
    return [`  await expect(page).toHaveURL(${JSON.stringify(url)});`, ""];
  }
  if (step.action === "waitForText" && /airport suggestions?/i.test(step.sourceStep)) {
    return [`  await flightSearch.waitForAirportSuggestions(${valueExpression(step.expected ?? step.value ?? "", step.valueRef, input.testData)});`, ""];
  }
  if (step.action === "waitForText") {
    return [`  await expect(page.getByText(${valueExpression(step.expected ?? step.value ?? "", step.valueRef, input.testData)})).toBeVisible();`, ""];
  }
  if (step.action === "fill") {
    const field = fieldName(step.target);
    if (field) {
      return [`  await flightSearch.fillAirport(${JSON.stringify(field)}, ${valueExpression(step.value ?? "", step.valueRef, input.testData)});`, ""];
    }
    return [`  await common.fill(${locatorExpression(step, input)}, ${valueExpression(step.value ?? "", step.valueRef, input.testData)});`, ""];
  }
  if (step.action === "click" && isAirportSuggestionTarget(step.target ?? "")) return [];
  if (step.action === "click" && isJourneyTypeTarget(step.target ?? "")) {
    return [`  await flightSearch.selectJourneyType(${JSON.stringify(isOneWayTarget(step.target ?? "") ? "oneWay" : "roundTrip")});`, ""];
  }
  if (step.action === "click" && nextStep?.action === "assertHidden"
      && (nextStep.target ?? "").toLowerCase() === (step.target ?? "").toLowerCase()) {
    return [`  await common.clickIfPresent(page.getByText(${JSON.stringify(step.target)}, { exact: true }));`, ""];
  }
  if (step.action === "click") return [`  await common.click(${locatorExpression(step, input)});`, ""];
  if (step.action === "press") return [`  await common.press(${locatorExpression(step, input)}, ${JSON.stringify(step.value ?? "Enter")});`, ""];
  if (step.action === "assertValue") {
    return [`  await common.expectValue(${locatorExpression(step, input)}, ${valueExpression(step.expected ?? step.value ?? "", step.valueRef, input.testData)});`, ""];
  }
  if (step.action === "assertVisible") {
    return [`  await common.expectVisible(${visibleLocatorExpression(step, input)});`, ""];
  }
  if (step.action === "assertText") {
    const expected = step.expected ?? step.value ?? step.target ?? "";
    return [`  await common.expectVisible(page.getByText(${valueExpression(expected, step.valueRef, input.testData)}, { exact: true }));`, ""];
  }
  if (step.action === "assertUrl") {
    return [`  await expect(page).toHaveURL(${JSON.stringify(step.expected ?? step.value)});`, ""];
  }
  if (step.action === "assertHidden") {
    if (isGuestsCabinTarget(step.target ?? "")) {
      return [`  await flightSearch.expectGuestsCabinPanelHidden();`, ""];
    }
    return [`  await common.expectHidden(page.getByText(${JSON.stringify(step.target ?? "")}, { exact: true }));`, ""];
  }
  if (step.action === "assertEnabled") return [`  await common.expectEnabled(${locatorExpression(step, input)});`, ""];
  if (step.action === "assertDisabled") return [`  await common.expectDisabled(${locatorExpression(step, input)});`, ""];
  if (step.action === "assertSelected") return [`  await common.expectSelected(${locatorExpression(step, input)});`, ""];
  if (step.action === "assertUnselected") return [`  await common.expectUnselected(${locatorExpression(step, input)});`, ""];
  if (step.action === "waitForLoad") return [];
  throw new Error(`${step.id}: unsupported generated action '${step.action}'`);
}

function locatorExpression(step: PlannedStep, input: TestGenerationInput) {
  const target = step.target ?? step.locatorKey ?? "";
  const field = fieldName(target);
  if (field) return `flightSearch.${field}`;
  if (/^(Economy|Business|First)$/i.test(target)) {
    return `flightSearch.cabinOption(${valueExpression(target, undefined, input.testData)})`;
  }
  if (step.action === "assertValue") {
    const passengerGroup = passengerGroupName(target);
    if (passengerGroup) return `flightSearch.passengerCount(${JSON.stringify(passengerGroup)})`;
  }
  const passengerControl = target.match(/^(increase|decrease)\s+(adults?|children|infants?|infant\s+with\s+seat)$/i);
  if (passengerControl) {
    const direction = passengerControl[1].toLowerCase();
    const passengerGroup = passengerGroupName(passengerControl[2]);
    if (passengerGroup) {
      return `flightSearch.passengerControl(${JSON.stringify(passengerGroup)}, ${JSON.stringify(direction)})`;
    }
  }
  const evidence = input.verifiedLocators.find(item => item.sourceStep === step.sourceStep)?.locator;
  if (evidence) return `common.locator(${JSON.stringify(evidence)})`;
  throw new Error(`${step.id}: no supported, verified locator for '${target}'`);
}

function visibleLocatorExpression(step: PlannedStep, input: TestGenerationInput) {
  const target = step.target ?? step.locatorKey ?? "";
  if (isGuestsCabinTarget(target)) return "flightSearch.guestsCabinTile";
  if (/^(Economy|Business|First)$/i.test(target)) {
    return `flightSearch.cabinOption(${valueExpression(target, undefined, input.testData)})`;
  }
  if (fieldName(target)) return `flightSearch.${fieldName(target)}`;
  if (step.expected || step.value) {
    const expected = valueExpression(step.expected ?? step.value ?? "", step.valueRef, input.testData);
    return `page.getByText(${expected}, { exact: true })`;
  }
  return `page.getByText(${JSON.stringify(target)}, { exact: true })`;
}

function passengerGroupName(value: string): string | undefined {
  const normalized = value.toLocaleLowerCase().replace(/[^a-z]/g, "");
  if (normalized.startsWith("adult")) return "Adults";
  if (normalized === "children" || normalized === "child") return "Children";
  if (normalized.startsWith("infant") && normalized.includes("seat")) return "Infants with Seat";
  if (normalized.startsWith("infant")) return "Infants";
  return undefined;
}

function isJourneyTypeTarget(target: string) {
  const normalized = target.toLocaleLowerCase();
  return normalized.includes("one-way") || normalized.includes("one way") || normalized.includes("round trip");
}

function isOneWayTarget(target: string) {
  const normalized = target.toLocaleLowerCase();
  return normalized.includes("one-way") || normalized.includes("one way");
}

function fieldName(target?: string): "origin" | "destination" | undefined {
  if (target === "Flying from") return "origin";
  if (target === "Flying to") return "destination";
  return undefined;
}

function valueExpression(value: string, valueRef: string | undefined, testData: Record<string, unknown>) {
  const dataName = valueRef
    ? valueRef
    : Object.keys(testData).find(name => String(testData[name]) === value);
  if (dataName) {
    if (!Object.hasOwn(testData, dataName)) throw new Error(`Missing generated test data value '${dataName}'`);
    return `requireTestData(${JSON.stringify(dataName)})`;
  }
  if (valueRef) throw new Error(`Missing generated test data value '${valueRef}'`);
  return JSON.stringify(value);
}

function isAirportSuggestionTarget(target: string) {
  return /airport suggestions?/i.test(target);
}

function isGuestsCabinTarget(target: string) {
  return ["guestsandcabin", "passengersandcabin"].includes(target.toLocaleLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, ""));
}

function validateGeneratedSource(source: string, input: TestGenerationInput) {
  const caseId = input.testCase.id;
  if (!source.includes("@playwright/test") || !/\btest\s*\(/.test(source)) throw new Error(`Generator returned invalid Playwright test for ${caseId}`);
  if (!source.includes(caseId)) throw new Error(`Generated test does not identify approved case ${caseId}`);
  const requiredAssertions = input.actionPlan.steps.filter(step => step.action.startsWith("assert"));
  const generatedAssertions = source.match(/await (?:expect\(|common\.expect(?:Visible|Hidden|Enabled|Disabled|Value|Selected|Unselected)\(|flightSearch\.expectGuestsCabinPanelHidden\()/g)?.length ?? 0;
  if (generatedAssertions < requiredAssertions.length) throw new Error(`Generated test omitted one or more approved assertions for ${caseId}`);
  for (const step of requiredAssertions.filter(item => item.action === "assertValue")) {
    const expected = valueExpression(step.expected ?? step.value ?? "", step.valueRef, input.testData);
    const assertion = `await common.expectValue(${locatorExpression(step, input)}, ${expected});`;
    if (!source.includes(assertion)) throw new Error(`Generated test omitted approved value assertion ${step.id}`);
  }
  for (const value of Object.values(input.testData).filter((item): item is string => typeof item === "string" && item.length > 3)) {
    if (source.includes(value)) throw new Error("Generated test must load test data from environment variables, not embed values");
  }
  if (/\.(?:first|last|nth)\s*\(/.test(source)) throw new Error("Generated test uses a positional locator to hide ambiguity");
  if (/browser_run_code_unsafe|child_process|process\.exit|eval\s*\(/.test(source)) throw new Error("Generated test contains a disallowed execution primitive");
}
function safeName(value: string) { return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "case"; }
