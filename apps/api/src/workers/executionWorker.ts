import type { ExecutionJob } from "../controllers/executionController.js";
import { getExecutionJob, saveExecutionJob } from "../controllers/executionController.js";
import { executeApprovedCase } from "../../../../packages/orchestration/src/executeApprovedCase.js";
import { executeStory } from "../../../../packages/orchestration/src/executeStory.js";
import { recordExecutionEvent } from "../../../../packages/playwright/services/executionHistory.js";

/** Runs one queued job; each case creates its own isolated MCP/browser session. */
export async function runExecutionWorker(job: ExecutionJob): Promise<void> {
  try {
    const latest = await getExecutionJob(job.executionId);
    if (!latest || latest.status !== "queued") throw new Error("Execution job is missing or is no longer queued");
    latest.status = "planning";
    latest.startedAt = new Date().toISOString();
    await saveExecutionJob(latest);
    await recordExecutionEvent({ executionId: latest.executionId, storyId: latest.storyId, testCaseId: latest.testCaseId, status: "planning", event: "worker_started" });

    latest.status = "executing";
    await saveExecutionJob(latest);
    let result;
    if (latest.testCaseId) result = await executeApprovedCase(latest.testCaseId, latest.planPath);
    else if (latest.storyId) result = await executeStory(latest.storyId, latest.planPath, async progress => {
      latest.progress = progress;
      await saveExecutionJob(latest);
    });
    else throw new Error("Queued execution has neither a testCaseId nor a storyId");

    latest.result = result;
    const resultStatus = "status" in result ? result.status : "failed";
    latest.status = resultStatus === "passed" ? "passed" : resultStatus === "blocked" ? "blocked" : "failed";
    latest.finishedAt = new Date().toISOString();
    await saveExecutionJob(latest);
    await recordExecutionEvent({ executionId: latest.executionId, storyId: latest.storyId, testCaseId: latest.testCaseId, status: latest.status, event: "worker_finished", details: { resultStatus } });
  } catch (error) {
    const latest = await getExecutionJob(job.executionId);
    if (latest) {
      latest.status = "failed";
      latest.finishedAt = new Date().toISOString();
      latest.error = error instanceof Error ? error.message : String(error);
      await saveExecutionJob(latest);
    }
    await recordExecutionEvent({ executionId: job.executionId, storyId: job.storyId, testCaseId: job.testCaseId, status: "failed", event: "worker_failed", details: error instanceof Error ? error.message : String(error) });
  }
}
