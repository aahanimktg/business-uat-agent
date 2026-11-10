import { AIProvider } from "../providers/AIProvider";
import { Requirement, RequirementSchema } from "../../domain/schemas/requirement.schema";
import { TestPlan, TestPlanSchema, TestCase } from "../../domain/schemas/test-plan.schema";
import { buildPlannerPrompt } from "../prompts/planner.prompt";
import { StructuredResponseService } from "./structured-response.service";

import fs from "fs/promises";
import path from "path";
import { ExecutionPlanSchema } from "@domain/schemas/executionPlan.schema";
import { buildTypedActionPlan } from "./typedActionPlan.js";

export class PlannerService {
  constructor(
    private readonly provider: AIProvider,
    private readonly structuredResponse: StructuredResponseService,
  ) {}

  async createPlan(requirementInput: Requirement): Promise<TestPlan> {
    const requirement = RequirementSchema.parse(requirementInput);
    const domainContext = await this.readDomainContext();
    const prompt = buildPlannerPrompt(
      JSON.stringify(requirement, null, 2),
      domainContext,
    );
    const response = await this.provider.chat([
      {
        role: "system",
        content:"You are a senior web testing architect. Return only valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    const plan = await this.structuredResponse.parse(response, TestPlanSchema);
    // Keep legacy top-level coverageSummary in sync for existing UI/text-export consumers.
    return {
      ...plan,
      coverageSummary: plan.coverageSummary || plan.coverage?.coverageSummary || "",
    };
  }

  private async readDomainContext(): Promise<string> {
    try {
      return await fs.readFile(
        path.join(process.cwd(), "packages","", "domain", "etihad-context.md"),
        "utf8",
      );
    } catch {
      return "";
    }
  }

  async makeTypedPlan(testCase: TestCase, storyId?: string) {
    try {
      return ExecutionPlanSchema.parse(buildTypedActionPlan(testCase, storyId));
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith("No deterministic action mapping")) throw error;
    }
    const masked = maskTestData(testCase);
    const response = await this.provider.chat([
        { role: "system", content: `Convert the supplied UI test case into a JSON action plan. Return exactly {"testCaseId":"...","storyId":"...","steps":[{"id":"S1","sourceStep":"original step","action":"navigate|click|fill|press|waitForLoad|waitForText|assertVisible|assertHidden|assertEnabled|assertDisabled|assertSelected|assertUnselected|assertValue|assertText|assertUrl|noOp","target":"semantic UI target when needed","value":"URL or literal value when needed","valueRef":"test_data name for sensitive or reusable values","expected":"expected assertion value"}]}. Preserve all input steps in order. For the Etihad flight-search form, use the accessible control names "Flying from" for the Origin/departure field and "Flying to" for the Destination/arrival field. Map a step that says to wait for the page to load to waitForLoad, not waitForText; navigation already waits for the page navigation and waitForLoad confirms the current page is ready. For waitForText, always provide expected as the visible text to wait for. For a step waiting for airport suggestions after a field was filled, use the entered value (including the referenced test_data value) as expected, not the test_data key name. For assertValue steps, use expected with the literal expected field value from test_data; do not use valueRef for an assertion. Add explicit assertions for the expectedOutcome without changing its meaning. When expectedOutcome narratively describes a validation message, set the assertion expected value to the message phrase it describes, not the entire narrative sentence; do not assert that the narrative sentence itself appears in the UI. Do not produce selectors or code. Use valueRef for test_data values in fill steps. Omit optional fields when they do not apply; do not emit empty strings. If a step is ambiguous, encode it as a target and do not invent behavior.` },
        { role: "user", content: JSON.stringify({ storyId, testCase: masked.testCase }) },
      ],);
    const parsed = await this.structuredResponse.parse(response, ExecutionPlanSchema);
    return ExecutionPlanSchema.parse(restoreTestDataMarkers(parsed, masked.values));
  }


}

function maskTestData(testCase: TestCase) {
  const values = (testCase.test_data ?? []).map((item, index) => ({
    name: item.name,
    value: String(item.value),
    marker: `__UAT_TEST_DATA_${index}__`,
  })).sort((left, right) => right.value.length - left.value.length);
  const masked = replaceStrings(testCase, values);
  masked.test_data = (testCase.test_data ?? []).map((item, index) => ({
    ...item,
    value: values.find(value => value.name === item.name)?.marker ?? `__UAT_TEST_DATA_${index}__`,
  }));
  return { testCase: masked, values };
}

function replaceStrings<T>(value: T, replacements: Array<{ value: string; marker: string }>): T {
  if (typeof value === "string") {
    let result: string = value;
    for (const item of replacements) {
      if (item.value) result = result.split(item.value).join(item.marker);
    }
    return result as T;
  }
  if (Array.isArray(value)) return value.map(item => replaceStrings(item, replacements)) as T;
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceStrings(item, replacements)])) as T;
  }
  return value;
}

function restoreTestDataMarkers<T>(value: T, replacements: Array<{ value: string; marker: string }>): T {
  if (typeof value === "string") {
    let result: string = value;
    for (const item of replacements) result = result.split(item.marker).join(item.value);
    return result as T;
  }
  if (Array.isArray(value)) {
    return value.map(item => restoreTestDataMarkers(item, replacements)) as T;
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, restoreTestDataMarkers(item, replacements)])) as T;
  }
  return value;
}
