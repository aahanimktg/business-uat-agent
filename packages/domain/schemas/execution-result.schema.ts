export interface TestExecutionResult {
  testCaseId: string;
  status?: "passed" | "failed" | "skipped";
  failedStepId?: string | null;
  expected?: string;
  actual?: string;
  evidence?: string[];
  [key: string]: unknown;
}
