import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { TestCaseSchema } from "../../domain/schemas/test-plan.schema.js";
import { ExecutionPlanSchema } from "../../domain/schemas/executionPlan.schema.js";
import { buildTypedActionPlan } from "./typedActionPlan.js";

test("AIT-8 approved story cases compile to schema-valid plans preserving each source step", async () => {
  const content = await readFile(path.resolve("output/sprint-plan.json"), "utf8");
  const source = JSON.parse(content) as { stories: Array<{ storyId?: string; testCases?: unknown[] }> };
  const story = source.stories.find(item => item.storyId === "AIT-8");
  assert.ok(story, "AIT-8 must exist in the sprint plan");
  const testCases = (story.testCases ?? []).map(item => TestCaseSchema.parse(item));
  assert.equal(testCases.length, 10);

  for (const testCase of testCases) {
    const plan = ExecutionPlanSchema.parse(buildTypedActionPlan(testCase, "AIT-8"));
    const mappedSourceSteps = plan.steps.slice(0, testCase.steps.length).map(step => step.sourceStep);
    assert.deepEqual(mappedSourceSteps, testCase.steps, `${testCase.id} source steps remain unchanged and ordered`);
    assert.ok(
      plan.steps.some(step => step.action.startsWith("assert") && step.sourceStep === testCase.expectedOutcome),
      `${testCase.id} has a typed assertion linked to its unchanged expected outcome`,
    );
  }

  const cabinSwitch = ExecutionPlanSchema.parse(
    buildTypedActionPlan(testCases[1], "AIT-8"),
  );
  assert.ok(cabinSwitch.steps.some(step => step.action === "assertSelected" && step.target === "Business"));
  assert.ok(cabinSwitch.steps.some(step => step.action === "assertUnselected" && step.target === "Economy"));
  assert.ok(cabinSwitch.steps.some(step => step.action === "assertUnselected" && step.target === "First"));
});
