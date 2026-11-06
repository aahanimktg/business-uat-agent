import { z } from "zod";

export const JiraDraftSchema = z.object({
  summary: z.string().min(1),
  description: z.string().min(1),
  acceptanceCriteria: z.array(z.string()).default([]),
});

export type JiraDraft = z.infer<typeof JiraDraftSchema>;
