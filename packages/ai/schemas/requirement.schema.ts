import { z } from 'zod';

export const AcceptanceCriteriaSchema =
  z.object({

    id: z.string()
      .min(1),

    description: z.string()
      .min(1)

  });

export const RequirementSchema =
  z.object({

    storyId: z.string()
      .optional(),

    title: z.string()
      .min(1),

    description: z.string()
      .optional(),

    acceptanceCriteria:
      z.array(AcceptanceCriteriaSchema)
        .min(1)

  });

export type AcceptanceCriteria =
  z.infer<typeof AcceptanceCriteriaSchema>;

export type Requirement =
  z.infer<typeof RequirementSchema>;