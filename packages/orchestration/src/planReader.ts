import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  ApprovedSprintPlanSchema,
  type ApprovedSprintPlan,
  type ApprovedTestCase,
  type Story,
} from "../../domain/schemas/approvedSprintPlan.schema.js";
import { normalizePlan } from "../../domain/src/testPlan.js";

export const DEFAULT_APPROVED_PLAN_PATH = "output/approved-sprint-plan.json";

/** Read JSON, normalize supported export aliases, then validate the whole plan. */
export async function readApprovedPlan(filePath = DEFAULT_APPROVED_PLAN_PATH): Promise<ApprovedSprintPlan> {
  const absolutePath = path.resolve(filePath);
  let raw: string;
  try {
    raw = await readFile(absolutePath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") throw new Error(`Approved sprint plan not found: ${absolutePath}`);
    if (code === "EACCES") throw new Error(`Permission denied reading approved plan: ${absolutePath}`);
    throw error;
  }

  let json: unknown;
  try {
    json = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error(`Approved sprint plan is not valid JSON (${absolutePath}): ${error instanceof Error ? error.message : String(error)}`);
  }

  const parsed = ApprovedSprintPlanSchema.safeParse(normalizePlan(json));
  if (!parsed.success) {
    const details = parsed.error.issues
      .map(issue => `${issue.path.length ? issue.path.join(".") : "plan"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Approved sprint plan validation failed (${absolutePath}): ${details}`);
  }
  return parsed.data;
}

export function listStories(plan: ApprovedSprintPlan): Story[] {
  return plan.stories;
}

export function casesForStory(story: Story): ApprovedTestCase[] {
  return story.testCases;
}

export function findStory(plan: ApprovedSprintPlan, storyId: string): Story | undefined {
  const wanted = normalizeId(storyId);
  return plan.stories.find(story => normalizeId(story.id) === wanted);
}

export function findTestCase(plan: ApprovedSprintPlan, testCaseId: string): { story: Story; testCase: ApprovedTestCase } | undefined {
  const wanted = normalizeId(testCaseId);
  for (const story of plan.stories) {
    const testCase = story.testCases.find(item => normalizeId(item.id) === wanted);
    if (testCase) return { story, testCase };
  }
  return undefined;
}

export function getTestData(testCase: ApprovedTestCase): Record<string, unknown> {
  return Object.fromEntries((testCase.test_data ?? []).map(item => [item.name, item.value]));
}

export function summarizePlan(plan: ApprovedSprintPlan) {
  const testCases = plan.stories.flatMap(story => story.testCases);
  return {
    storyCount: plan.stories.length,
    testCaseCount: testCases.length,
    stories: plan.stories.map(story => ({ id: story.id, title: story.title, testCaseCount: story.testCases.length })),
  };
}

function normalizeId(value: string) { return value.trim().toLowerCase(); }
