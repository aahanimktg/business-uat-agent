import type { ExecutionCaseResult } from "../../lib/api";

export const sampleCompletedCase: ExecutionCaseResult = {
  testCaseId: "TC-AIT-8-020",
  title: "Infant With Seat should not increase beyond adult count",
  status: "failed",
  startedAt: "2026-11-09T09:30:00.000Z",
  finishedAt: "2026-11-09T09:30:31.000Z",
  currentStep: 8,
  totalSteps: 8,
  plannedSteps: [
    "Open website",
    "Open passenger selector",
    "Set adult count to 1",
    "Set infant with seat count to 1",
    "Attempt to increment infant with seat",
    "Verify the increment is disabled",
    "Capture result",
    "Verify approved outcome",
  ],
  steps: [
    { stepId: "S1", sourceStep: "Open website", status: "passed", detail: "Page loaded" },
    { stepId: "S2", sourceStep: "Open passenger selector", status: "passed", detail: "Selector opened" },
    { stepId: "S3", sourceStep: "Set adult count to 1", status: "passed", detail: "Count is 1" },
    { stepId: "S4", sourceStep: "Set infant with seat count to 1", status: "passed", detail: "Count is 1" },
    { stepId: "S5", sourceStep: "Attempt to increment infant with seat", status: "failed", detail: "Count increased to 2" },
  ],
  testData: [{ name: "adultCount", value: "[REDACTED]" }],
  expectedResult: "Infant With Seat should not increase beyond Adult count",
  actualResult: "The count increased from 1 to 2.",
  aiAnalysis: "The passenger limit was not enforced when the increment control was activated.",
};
