import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createMcpBrowserConfig } from "../../playwright/config/browserProfile.js";
import { PlannerService } from "@ai/services/planner.service.js";
import { AIProvider } from "@ai/providers/AIProvider.js";
import { StructuredResponseService } from "@ai/services/structured-response.service";
import { PlaywrightMcpClient } from "../../playwright/mcp/playwrightMcpClient";
import {executePlan,type StepResult,} from "../../playwright/services/stepExecutor";
import { generateTestFile } from "../../playwright/services/testCodeGenerator";
import { replayGeneratedTest } from "../../playwright/services/testReplay";
import { proposeRepair } from "../../playwright/services/healer";
import { getLocatorMetrics } from "../../playwright/services/locatorMetrics";
import { LocatorRegistry } from "../../playwright/registry/locatorRegistry.js";
import { LocatorResolver } from "../../playwright/services/locatorResolver.js";
import { clearExecutionRedactions, recordExecutionEvent, redactExecutionData, setExecutionRedactions } from "../../playwright/services/executionHistory.js";
import type { TestCase } from "../../domain/schemas/test-plan.schema";
import type { ExecutionStatus } from "../../domain/src/testPlan";
import { transition } from "./executionStateMachine.js";
import { casesForStory, readApprovedPlan } from "./planReader.js";

type TestStory = { id?: string; title?: string };
export type CaseProgressUpdate = {
  phase: "planning" | "executing" | "finished";
  currentStep: number;
  totalSteps: number;
  activeStepId?: string;
  plannedSteps: string[];
  steps: StepResult[];
  observation?: string;
};
export type CaseProgressCallback = (update: CaseProgressUpdate) => void | Promise<void>;
type ExecutionOutcome = {
  executionId: string;
  storyId?: string;
  testCaseId: string;
  title: string;
  expectedResult: string;
  testData: Array<{ name: string; value: string }>;
  status: ExecutionStatus;
  plan?: unknown;
  steps: StepResult[];
  generatedTest?: string;
  replay?: unknown;
  healer?: unknown;
  error?: string;
  locatorMetrics?: unknown;
  screenshot?: string;
  screenshotError?: string;
  failureType?: "application" | "automation";
  artifacts?: Record<string, string>;
};

export async function executeApprovedCase(
  testCaseId: string,
  planPath = "output/sprint-plan.json",
) {
  const approvedPlan = await readApprovedPlan(planPath);
  for (const story of approvedPlan.stories) {
    const testCase = casesForStory(story).find(
      (candidate) => candidate.id === testCaseId,
    );
    if (testCase) return runCase(testCase, story, planPath);
  }
  throw new Error(`Test case not found in ${planPath}: ${testCaseId}`);
}

export async function runCase(
  testCase: TestCase,
  story: TestStory,
  planPath = "output/sprint-plan.json",
  onProgress?: CaseProgressCallback,
): Promise<ExecutionOutcome> {
  const executionId = randomUUID();
  const root = path.resolve(__dirname, "../../..");
  const outputDir = path.join(root, "output/automation/executions", executionId);
  await mkdir(outputDir, { recursive: true });
  const testData = Object.fromEntries(
    (testCase.test_data ?? []).map((item) => [item.name, item.value]),
  );
  setExecutionRedactions(executionId, Object.values(testData));
  let status: ExecutionStatus = "queued";
  const steps: StepResult[] = [];
  let browser: PlaywrightMcpClient | undefined;
  let resolver: LocatorResolver | undefined;
  const artifacts: Record<string, string> = {
    result: path.join(outputDir, "result.json"),
    history: path.join(outputDir, "history.jsonl"),
    metrics: path.join(outputDir, "metrics.json"),
  };
  const outcome: ExecutionOutcome = {
    executionId,
    storyId: story.id,
    testCaseId: testCase.id,
    title: testCase.title,
    expectedResult: testCase.expectedOutcome,
    testData: (testCase.test_data ?? []).map(({ name }) => ({ name, value: "[REDACTED]" })),
    status,
    steps,
    artifacts,
  };

  const move = async (
    next: ExecutionStatus,
    event: string,
    details?: unknown,
  ) => {
    status = transition(status, next);
    outcome.status = status;
    await recordExecutionEvent({
      executionId,
      storyId: story.id,
      testCaseId: testCase.id,
      status,
      event,
      details,
    });
  };

  await onProgress?.({
    phase: "planning",
    currentStep: 0,
    totalSteps: testCase.steps.length,
    plannedSteps: testCase.steps,
    steps: [],
    observation: redactExecutionData(`Planning ${testCase.id}: ${testCase.title}`, executionId) as string,
  });
  await recordExecutionEvent({
    executionId,
    storyId: story.id,
    testCaseId: testCase.id,
    status,
    event: "execution_created",
    details: { planPath },
  });
  try {
    await move("planning", "planning_started");
    const provider = new AIProvider();
    const structuredResponse = new StructuredResponseService();
    const planner = new PlannerService(provider, structuredResponse);
    const plan = await planner.makeTypedPlan(testCase, story.id);
    validatePlanForCase(plan, testCase);
    outcome.plan = plan;
    await onProgress?.({
      phase: "executing",
      currentStep: 0,
      totalSteps: plan.steps.length,
      plannedSteps: plan.steps.map(step => step.sourceStep),
      steps: [],
      observation: `Validated action plan with ${plan.steps.length} steps`,
    });
    artifacts.plan = path.join(outputDir, "action-plan.json");
    await writeFile(artifacts.plan, JSON.stringify(redactExecutionData(plan, executionId), null, 2));

    const mcpConfigPath = await createIsolatedMcpConfig(outputDir);
    await move("exploring", "browser_starting", { headless: false, isolated: true, config: mcpConfigPath });
    browser = await connectMcpWithRetry(mcpConfigPath, executionId, story.id, testCase.id);
    await move("executing", "steps_started", { count: plan.steps.length });
    resolver = new LocatorResolver();
    const runSteps = await executePlan({
      plan,
      browser,
      testData,
      pageKey: story.id ?? "app-home",
      resolver,
      onStepStart: async (step, completedSteps, totalSteps) => {
        await onProgress?.({
          phase: "executing",
          currentStep: completedSteps,
          totalSteps,
          activeStepId: step.id,
          plannedSteps: plan.steps.map(item => item.sourceStep),
          steps: redactExecutionData(steps, executionId),
          observation: `Executing: ${step.sourceStep}`,
        });
      },
      onStep: async (step, completedSteps, totalSteps) => {
        await onProgress?.({
          phase: "executing",
          currentStep: completedSteps.length,
          totalSteps,
          activeStepId: undefined,
          plannedSteps: plan.steps.map(item => item.sourceStep),
          steps: redactExecutionData(completedSteps, executionId),
          observation: redactExecutionData(
            `${step.status === "passed" ? "Verified" : step.status === "failed" ? "Failed" : "Blocked"}: ${step.sourceStep}`,
            executionId,
          ) as string,
        });
      },
    });
    steps.push(...runSteps);
    outcome.steps = steps;
    artifacts.steps = path.join(outputDir, "steps.json");
    await writeFile(artifacts.steps, JSON.stringify(redactExecutionData(steps, executionId), null, 2));
    await recordExecutionEvent({
      executionId,
      storyId: story.id,
      testCaseId: testCase.id,
      status,
      event: "steps_finished",
      details: steps,
    });

    const failed = steps.find((step) => step.status !== "passed");
    if (failed) {
      const screenshot = path.join(outputDir, `failure-${failed.stepId}.png`);
      try {
        await browser.callTool("browser_take_screenshot", { filename: screenshot });
        outcome.screenshot = screenshot;
        await recordExecutionEvent({
          executionId,
          storyId: story.id,
          testCaseId: testCase.id,
          status,
          event: "failure_screenshot_captured",
          details: { file: screenshot, stepId: failed.stepId },
        });
      } catch (error) {
        outcome.screenshotError = error instanceof Error ? error.message : String(error);
        await recordExecutionEvent({
          executionId,
          storyId: story.id,
          testCaseId: testCase.id,
          status,
          event: "failure_screenshot_failed",
          details: { file: screenshot, error: outcome.screenshotError },
        });
      }
      outcome.failureType = failed.status === "failed" ? "application" : "automation";
      outcome.error = `Step ${failed.stepId} ${outcome.failureType} failure: ${failed.detail}`;
      const repair = await proposeRepair({
        failure: redactExecutionData(failed, executionId),
        evidence: { plan, steps: redactExecutionData(steps, executionId) },
        attempt: 0,
      });
      outcome.healer = { proposals: steps.flatMap(step => step.repairs ?? []), diagnosis: repair };
      await recordExecutionEvent({
        executionId,
        storyId: story.id,
        testCaseId: testCase.id,
        status,
        event: "healer_proposal",
        details: repair,
      });
    }

    if (!outcome.screenshot) {
      const screenshot = path.join(outputDir, "exploration.png");
      try {
        await browser.callTool("browser_take_screenshot", { filename: screenshot });
        outcome.screenshot = screenshot;
      } catch (error) {
        outcome.screenshotError = error instanceof Error ? error.message : String(error);
      }
    }
    if (outcome.screenshot) artifacts.explorationScreenshot = outcome.screenshot;

    await move("generating", "test_generation_started");
    const registry = new LocatorRegistry();
    const verifiedLocators = await Promise.all(
      steps.flatMap((step) => step.status === "passed" && step.locatorKey
        ? [registry.get(step.locatorKey).then((record) => record
            ? {
                stepId: step.stepId,
                sourceStep: step.sourceStep,
                locator: record.locator,
                evidence: record.evidence,
              }
            : undefined)]
        : []),
    );
    const verifiedLocatorRecords = verifiedLocators.filter(
      (item): item is NonNullable<typeof item> => item !== undefined,
    );
    const generatedTest = await generateTestFile({
      storyId: story.id,
      actionPlan: plan,
      testCase: {
        id: testCase.id,
        title: testCase.title,
        expectedOutcome: testCase.expectedOutcome,
        steps: testCase.steps,
      },
      testData,
      verifiedLocators: verifiedLocatorRecords,
    });
    outcome.generatedTest = generatedTest;
    await recordExecutionEvent({
      executionId,
      storyId: story.id,
      testCaseId: testCase.id,
      status,
      event: "test_generated",
      details: { file: generatedTest },
    });

    await move("replaying", "fresh_replay_started", { file: generatedTest });
    const replay = await replayGeneratedTest({
      file: generatedTest,
      executionId,
      approvedAssertionTexts: plan.steps
        .filter((step) => step.action.startsWith("assert") && step.expected)
        .map((step) => step.expected!),
      approvedOptionNames: verifiedLocatorRecords
        .filter((item) => item.locator.strategy === "role" && item.locator.role === "option" && item.locator.exact)
        .map((item) => item.locator.value),
      testData,
    });
    outcome.replay = replay;
    if (replay.artifacts) {
      for (const [name, file] of Object.entries(replay.artifacts)) artifacts[`replay${capitalize(name)}`] = file;
    }
    const replayFailureType = replay.status === "passed" ? undefined : replay.failureType ?? "automation";
    const applicationFailure = outcome.failureType === "application" || replayFailureType === "application";
    const automationFailure = outcome.failureType === "automation" || replayFailureType === "automation";
    const finalStatus: ExecutionStatus = applicationFailure ? "failed" : automationFailure ? "blocked" : "passed";
    outcome.failureType = applicationFailure ? "application" : automationFailure ? "automation" : undefined;
    if (replay.status !== "passed" && !outcome.error) {
      outcome.error = `Fresh Playwright replay ${replay.status}: ${replay.stderr || replay.stdout}`;
    }
    await move(finalStatus, "execution_finished", {
      replayStatus: replay.status,
      failureType: outcome.failureType,
    });
    await onProgress?.({
      phase: "finished",
      currentStep: steps.length,
      totalSteps: plan.steps.length,
      plannedSteps: plan.steps.map(step => step.sourceStep),
      steps: redactExecutionData(steps, executionId),
      observation: `Execution ${finalStatus}${outcome.error ? `: ${outcome.error}` : ""}`,
    });
    const aggregateMetrics = await getLocatorMetrics();
    const safeMetrics = {
      ...aggregateMetrics,
      run: resolver?.getRunMetrics() ?? { reuseCount: 0, missCount: 0, failureCount: 0, repairCount: 0 },
    };
    outcome.locatorMetrics = safeMetrics;
    await writeFile(artifacts.metrics, JSON.stringify(safeMetrics, null, 2));
    const safeOutcome = redactExecutionData(outcome, executionId);
    await writeFile(artifacts.result, JSON.stringify(safeOutcome, null, 2));
    await onProgress?.({
      phase: "finished",
      currentStep: steps.length,
      totalSteps: outcome.plan && typeof outcome.plan === "object" && "steps" in outcome.plan && Array.isArray(outcome.plan.steps)
        ? outcome.plan.steps.length
        : steps.length,
      plannedSteps: outcome.plan && typeof outcome.plan === "object" && "steps" in outcome.plan && Array.isArray(outcome.plan.steps)
        ? outcome.plan.steps.map(step => typeof step === "object" && step !== null && "sourceStep" in step ? String(step.sourceStep) : "")
        : testCase.steps,
      steps: redactExecutionData(steps, executionId),
      observation: `Execution blocked: ${outcome.error}`,
    });
    return safeOutcome;
  } catch (error) {
    outcome.error = error instanceof Error ? error.message : String(error);
    if (!statusIsTerminal(status)) {
      const terminal: ExecutionStatus = "blocked";
      outcome.failureType = "automation";
      try {
        await move(terminal, "execution_error", { error: outcome.error });
      } catch {
        outcome.status = terminal;
        status = terminal;
      }
    }
    const safeOutcome = redactExecutionData(outcome, executionId);
    await writeFile(artifacts.result, JSON.stringify(safeOutcome, null, 2));
    return safeOutcome;
  } finally {
    try {
      await browser?.close();
    } finally {
      clearExecutionRedactions(executionId);
    }
  }
}

async function connectMcpWithRetry(
  configPath: string,
  executionId: string,
  storyId: string | undefined,
  testCaseId: string,
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await PlaywrightMcpClient.connect({ configPath });
    } catch (error) {
      lastError = error;
      await recordExecutionEvent({
        executionId,
        storyId,
        testCaseId,
        status: "exploring",
        event: "mcp_connection_retry",
        details: { attempt, limit: 3, error: error instanceof Error ? error.message : String(error) },
      });
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  throw new Error(`Playwright MCP connection failed after 3 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function validatePlanForCase(plan: { testCaseId: string; steps: Array<{ sourceStep: string; action: string; expected?: string; value?: string; valueRef?: string }> }, testCase: TestCase) {
  if (plan.testCaseId !== testCase.id) {
    throw new Error(`Planner returned case '${plan.testCaseId}' for requested case '${testCase.id}'`);
  }
  let cursor = 0;
  for (const approvedStep of testCase.steps) {
    const expected = normalizeStep(approvedStep);
    const match = plan.steps.findIndex((step, index) => index >= cursor && normalizeStep(step.sourceStep) === expected);
    if (match < 0) throw new Error(`Typed action plan omitted or reordered approved step: ${approvedStep}`);
    const valueAssertion = approvedStep.match(/^Verify value:\s*(.+?)\s+equals\s+(.+)$/i);
    if (valueAssertion) {
      const assertion = plan.steps[match];
      const approvedValue = valueAssertion[2].trim().replace(/^["']|["']$/g, "");
      const plannedValue = assertion.valueRef
        ? testCase.test_data?.find(item => item.name === assertion.valueRef)?.value
        : assertion.expected ?? assertion.value;
      if (assertion.action !== "assertValue" || String(plannedValue) !== approvedValue) {
        throw new Error(`Typed action plan changed the approved value assertion: ${approvedStep}`);
      }
    }
    cursor = match + 1;
  }
  if (testCase.expectedOutcome && !testCase.steps.some(step => normalizeStep(step) === normalizeStep(testCase.expectedOutcome))
      && !plan.steps.some(step => step.action.startsWith("assert") && normalizeStep(step.sourceStep) === normalizeStep(testCase.expectedOutcome))) {
    throw new Error("Typed action plan omitted an explicit assertion for the approved expected outcome");
  }
}

function normalizeStep(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

async function createIsolatedMcpConfig(outputDir: string) {
  const mcpOutputDir = path.join(outputDir, "mcp");
  await mkdir(mcpOutputDir, { recursive: true });
  const destination = path.join(outputDir, "mcp-config.json");
  await writeFile(destination, JSON.stringify(createMcpBrowserConfig(mcpOutputDir), null, 2), "utf8");
  return destination;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusIsTerminal(status: ExecutionStatus) {
  return status === "passed" || status === "failed" || status === "blocked";
}
