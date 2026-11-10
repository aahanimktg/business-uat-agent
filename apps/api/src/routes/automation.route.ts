import { Router } from "express";
import { createExecutionJob } from "../controllers/executionController.js";
import { ExecutionQueue } from "../workers/executionQueue.js";

type Summary = {
  totals?: { total?: number };
  results?: Array<{ testCaseId?: string }>;
  artifacts?: Record<string, string>;
};

export function createAutomationRouter(queue: ExecutionQueue) {
  const router = Router();

  router.post("/execute", async (req, res) => {
    const storyId = typeof req.body?.storyId === "string" ? req.body.storyId : "";
    if (!storyId.trim()) return res.status(400).json({ success: false, message: "storyId is required" });

    try {
      const job = await createExecutionJob({ storyId });
      const completed = await queue.enqueueAndWait(job);
      const summary = readSummary(completed.result);
      const success = completed.status === "passed";
      const testCaseIds = (summary.results ?? [])
        .map(result => result.testCaseId)
        .filter((id): id is string => typeof id === "string");
      return res.status(success ? 200 : 422).json({
        success,
        executionId: completed.executionId,
        storyId,
        testCaseCount: summary.totals?.total ?? testCaseIds.length,
        testCaseIds,
        output: success ? undefined : completed.error ?? `Execution ${completed.status}`,
        artifacts: summary.artifacts,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ success: false, message });
    }
  });

  return router;
}

function readSummary(value: unknown): Summary {
  if (typeof value !== "object" || value === null) return {};
  const record = value as Record<string, unknown>;
  const totals = typeof record.totals === "object" && record.totals !== null
    ? record.totals as Summary["totals"]
    : undefined;
  const results = Array.isArray(record.results)
    ? record.results.filter((item): item is { testCaseId?: string } =>
        typeof item === "object" && item !== null && (!("testCaseId" in item) || typeof item.testCaseId === "string"))
    : undefined;
  const artifacts = typeof record.artifacts === "object" && record.artifacts !== null
    ? record.artifacts as Record<string, string>
    : undefined;
  return { totals, results, artifacts };
}
