import type { TestCase } from "../../domain/schemas/test-plan.schema.js";
import { getApplicationBaseUrl } from "../../playwright/config/applicationConfig.js";

type PlannedAction = {
  id: string;
  sourceStep: string;
  action: string;
  target?: string;
  value?: string;
  valueRef?: string;
  expected?: string;
};

export function buildTypedActionPlan(testCase: TestCase, storyId?: string) {
  const steps = testCase.steps.map((sourceStep, index) => compileStep(sourceStep, testCase, index));
  appendOutcomeAssertions(steps, testCase);
  return {
    testCaseId: testCase.id,
    storyId,
    steps: steps.map((step, index) => ({ ...step, id: `S${index + 1}` })),
  };
}

function compileStep(sourceStep: string, testCase: TestCase, index: number): PlannedAction {
  const fieldStep = sourceStep.match(/^Enter\s+(.+?)\s+in\s+(Origin|Destination)(?:\s+field)?$/i);
  if (fieldStep) {
    const field = fieldStep[2].toLowerCase();
    const valueRef = dataKey(testCase, field);
    return {
      id: `S${index + 1}`,
      sourceStep,
      action: "fill",
      target: field === "origin" ? "Flying from" : "Flying to",
      ...(valueRef ? { valueRef } : { value: fieldStep[1].trim() }),
    };
  }

  const suggestionStep = sourceStep.match(/^Select\s+(.+?)\s+from\s+(Origin|Destination)\s+suggestions?$/i);
  if (suggestionStep) {
    const field = suggestionStep[2].toLowerCase();
    const valueRef = dataKey(testCase, field);
    return {
      id: `S${index + 1}`,
      sourceStep,
      action: "click",
      target: `Airport suggestions: ${valueRef ? String(dataValue(testCase, valueRef)) : suggestionStep[1].trim()}`,
      ...(valueRef ? { valueRef } : {}),
    };
  }

  if (/^Do not select any (?:Origin|Destination) suggestion$/i.test(sourceStep)) {
    return { id: `S${index + 1}`, sourceStep, action: "noOp" };
  }
  if (/^Open application$/i.test(sourceStep)) {
    return { id: `S${index + 1}`, sourceStep, action: "navigate", value: getApplicationBaseUrl() };
  }

  const click = sourceStep.match(/^Click\s+(.+?)\.?$/i);
  if (click) {
    return {
      id: `S${index + 1}`,
      sourceStep,
      action: "click",
      target: canonicalTarget(click[1], testCase),
    };
  }

  const disabled = sourceStep.match(/^Verify\s+(.+?)\s+is disabled$/i);
  if (disabled) {
    return { id: `S${index + 1}`, sourceStep, action: "assertDisabled", target: canonicalTarget(disabled[1], testCase) };
  }
  const enabled = sourceStep.match(/^Verify\s+(.+?)\s+is enabled$/i);
  if (enabled) {
    return { id: `S${index + 1}`, sourceStep, action: "assertEnabled", target: canonicalTarget(enabled[1], testCase) };
  }
  const hidden = sourceStep.match(/^Verify\s+(.+?)\s+is not visible$/i);
  if (hidden) {
    return { id: `S${index + 1}`, sourceStep, action: "assertHidden", target: canonicalTarget(hidden[1], testCase) };
  }
  const visible = sourceStep.match(/^Verify\s+(.+?)\s+is visible$/i);
  if (visible) {
    return { id: `S${index + 1}`, sourceStep, action: "assertVisible", target: canonicalTarget(visible[1], testCase) };
  }
  const value = sourceStep.match(/^Verify\s+(.+?)\s+value equals\s+(.+)$/i);
  if (value) {
    return {
      id: `S${index + 1}`,
      sourceStep,
      action: "assertValue",
      target: canonicalTarget(value[1], testCase),
      expected: value[2].trim(),
    };
  }

  throw new Error(`No deterministic action mapping for approved step ${index + 1}: ${sourceStep}`);
}

function appendOutcomeAssertions(steps: PlannedAction[], testCase: TestCase) {
  const outcome = testCase.expectedOutcome.toLowerCase();
  const add = (action: string, target: string) => {
    if (steps.some(step => step.sourceStep === testCase.expectedOutcome && step.action === action && step.target?.toLowerCase() === target.toLowerCase())) return;
    steps.push({ id: "", sourceStep: testCase.expectedOutcome, action, target });
  };

  if (/economy.*default|default.*economy/i.test(outcome)) add("assertSelected", "Economy");
  const requestedCabin = testCase.test_data?.find(item => /expected.?cabin/i.test(item.name));
  if (requestedCabin && /only one cabin|single cabin|no conflicting cabin/i.test(outcome)) {
    const selected = String(requestedCabin.value);
    add("assertSelected", selected);
    for (const cabin of ["Economy", "Business", "First"]) {
      if (cabin.toLowerCase() !== selected.toLowerCase()) add("assertUnselected", cabin);
    }
  }
  if (/adult.*(?:minimum|below 1)|adults below 1/i.test(outcome)) {
    const minimum = testCase.test_data?.find(item => /adult.*minimum/i.test(item.name));
    add("assertValue", "Adults");
    const last = steps[steps.length - 1];
    if (last.sourceStep === testCase.expectedOutcome && last.target === "Adults" && last.action === "assertValue") {
      last.expected = String(minimum?.value ?? 1);
    }
  }
  if (/infants? greater than adults|infant with seat greater than adults/i.test(outcome)) {
    const target = /infant with seat/i.test(outcome) ? "Increase Infant With Seat" : "Increase infants";
    add("assertDisabled", target);
  }
  if (/occupied seats.*(?:9|nine)|maximum.*9/i.test(outcome)) {
    const maximum = testCase.test_data?.find(item => /occupiedseat/i.test(item.name));
    add("assertValue", "Adults");
    const last = steps[steps.length - 1];
    if (last.sourceStep === testCase.expectedOutcome && last.target === "Adults" && last.action === "assertValue") {
      last.expected = String(maximum?.value ?? 9);
    }
    add("assertDisabled", "Increase adults");
  }
  if (/until both origin and destination|until valid airports|guests\s*&\s*cabin remains blocked|cannot open guests/i.test(outcome)) {
    add("assertHidden", "Guests & Cabin");
  }
  if (/does not proceed with search|prevents further increases.*search|does not proceed/i.test(outcome)) {
    add("assertVisible", "Guests & Cabin");
  }
}

function canonicalTarget(target: string, testCase: TestCase): string {
  const normalized = target.replace(/[?.:]+$/g, "").trim();
  if (/^(origin|flying from)(?: field)?$/i.test(normalized)) return "Flying from";
  if (/^(destination|flying to)(?: field)?$/i.test(normalized)) return "Flying to";
  if (/^(guests|passengers)\s*&\s*cabin$/i.test(normalized)) return "Guests & Cabin";
  const valueCheck = normalized.match(/^(Adults|Infants|Infant With Seat)(?: value)?$/i);
  if (valueCheck) return valueCheck[1];
  const data = testCase.test_data ?? [];
  if (/^(Business|Economy|First)$/i.test(normalized)) return normalized;
  if (/increase|decrease|search/i.test(normalized)) return normalized;
  const testDataMatch = data.find(item => String(item.value).toLowerCase() === normalized.toLowerCase());
  return testDataMatch ? String(testDataMatch.value) : normalized;
}

function dataKey(testCase: TestCase, field: string): string | undefined {
  const aliases: Record<string, string[]> = {
    origin: ["origin", "origincity", "from", "fromcity"],
    destination: ["destination", "destinationcity", "to", "tocity"],
  };
  const names = aliases[field] ?? [field];
  return testCase.test_data?.find(item => names.includes(item.name.toLowerCase().replace(/[^a-z]/g, "")))?.name;
}

function dataValue(testCase: TestCase, key: string): string | number | boolean | undefined {
  return testCase.test_data?.find(item => item.name === key)?.value;
}
