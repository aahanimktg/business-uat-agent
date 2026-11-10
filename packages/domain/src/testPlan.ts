export { ExecutionStatusSchema } from "../schemas/executionResult.schema.js";
export type { ExecutionStatus } from "../schemas/executionResult.schema.js";

import { z } from "zod";
import { TestCase } from "../schemas/test-plan.schema.js";

/** Convert named test data entries into the lookup map consumed by the executor. */
export function testDataAsRecord(testCase: TestCase): Record<string, unknown> {
  return Object.fromEntries((testCase.test_data ?? []).map(({ name, value }) => [name, value]));
}

/** Return preconditions without mutating the approved test case. */
export function getPreconditions(testCase: TestCase): string[] {
  return [...testCase.preconditions];
}

export function normalizePlan(input: unknown): unknown {
  if (!isRecord(input)) return input;
  const rawStories = firstArray(input, ["stories", "userStories", "sprintStories", "storyList"]);
  if (!rawStories) return input;
  return {
    ...input,
    stories: rawStories.map((rawStory, storyIndex) => {
      if (!isRecord(rawStory)) return rawStory;
      const rawCases = firstArray(rawStory, ["testCases", "test_cases", "testcases", "cases"]);
      return {
        ...rawStory,
        id: firstString(rawStory, ["id", "storyId", "key"]) ?? `story-${storyIndex + 1}`,
        title: firstString(rawStory, ["title", "name", "summary"]) ?? `Story ${storyIndex + 1}`,
        testCases: rawCases?.map((rawCase, caseIndex) => normalizeCase(rawCase, caseIndex)) ?? [],
      };
    }),
  };
}

function normalizeCase(input: unknown, index: number): unknown {
  if (!isRecord(input)) return input;
  const rawSteps = Array.isArray(input.steps) ? input.steps : Array.isArray(input.testSteps) ? input.testSteps : [];
  const rawData = Array.isArray(input.test_data) ? input.test_data : Array.isArray(input.testData) ? input.testData : [];
  return {
    ...input,
    id: firstString(input, ["id", "testCaseId", "caseId", "key"]) ?? `case-${index + 1}`,
    title: firstString(input, ["title", "name", "summary"]) ?? `Test case ${index + 1}`,
    steps: rawSteps.map(step => typeof step === "string" ? step : stepToText(step)),
    test_data: rawData,
    expectedOutcome: firstString(input, ["expectedOutcome", "expected_outcome", "expectedResult", "expected"]),
  };
}

function stepToText(step: unknown): string {
  if (typeof step === "string") return step;
  if (!isRecord(step)) return String(step ?? "");
  return [step.action, step.target, step.value, step.expected].filter(value => value !== undefined).join(" ");
}
function firstArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) if (Array.isArray(record[key])) return record[key] as unknown[];
  return undefined;
}
function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) if (typeof record[key] === "string" && (record[key] as string).trim()) return (record[key] as string).trim();
  return undefined;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
