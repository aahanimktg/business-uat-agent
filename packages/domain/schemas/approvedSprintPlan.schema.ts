

import { z } from "zod";
import { TestCaseSchema } from "./test-plan.schema.js";

export const ApprovedTestCaseSchema = TestCaseSchema.passthrough();
export type ApprovedTestCase = z.infer<typeof ApprovedTestCaseSchema>;

export const ApprovedStorySchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  testCases: z.array(ApprovedTestCaseSchema),
}).passthrough();
export type Story = z.infer<typeof ApprovedStorySchema>;

export const ApprovedSprintPlanSchema = z.object({
  sprintId: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  stories: z.array(ApprovedStorySchema).min(1),
}).passthrough();
export type ApprovedSprintPlan = z.infer<typeof ApprovedSprintPlanSchema>;
