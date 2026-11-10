import { z } from "zod";

export const ExecutionStatusSchema = z.enum([
  "queued", "planning", "exploring", "executing", "generating", "replaying",
  "passed", "failed", "blocked",
]);

export const StepExecutionResultSchema = z.object({
  stepId: z.string(),
  sourceStep: z.string(),
  status: z.enum(["passed", "failed", "blocked"]),
  detail: z.string(),
  locatorKey: z.string().optional(),
  reusedLocator: z.boolean().optional(),
}).passthrough();

export const ExecutionResultSchema = z.object({
  executionId: z.string().uuid(),
  storyId: z.string().optional(),
  testCaseId: z.string().min(1),
  status: ExecutionStatusSchema,
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
  plan: z.unknown().optional(),
  steps: z.array(StepExecutionResultSchema).default([]),
  generatedTest: z.string().optional(),
  replay: z.unknown().optional(),
  healer: z.unknown().optional(),
  locatorMetrics: z.unknown().optional(),
  artifacts: z.array(z.string()).default([]),
  error: z.string().optional(),
}).passthrough();

export type StepExecutionResult = z.infer<typeof StepExecutionResultSchema>;
export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;
