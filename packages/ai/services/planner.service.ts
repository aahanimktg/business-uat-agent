import { AIProvider } from "../providers/AIProvider";
import { Requirement, RequirementSchema } from "../schemas/requirement.schema";
import { TestPlan, TestPlanSchema } from "../schemas/test-plan.schema";
import { buildPlannerPrompt } from "../prompts/planner.prompt";
import { StructuredResponseService } from "./structured-response.service";

import fs from "fs/promises";
import path from "path";

export class PlannerService {
  constructor(
    private readonly provider: AIProvider,
    private readonly structuredResponse: StructuredResponseService,
  ) {}

  async createPlan(requirementInput: Requirement): Promise<TestPlan> {
    const requirement = RequirementSchema.parse(requirementInput);
    const domainContext = await this.readDomainContext();
    const prompt = buildPlannerPrompt(
      JSON.stringify(requirement, null, 2),
      domainContext,
    );
    const response = await this.provider.chat([
      {
        role: "system",
        content:"You are a senior web testing architect. Return only valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    const plan = await this.structuredResponse.parse(response, TestPlanSchema);
    // Keep legacy top-level coverageSummary in sync for existing UI/text-export consumers.
    return {
      ...plan,
      coverageSummary: plan.coverageSummary || plan.coverage?.coverageSummary || "",
    };
  }

  private async readDomainContext(): Promise<string> {
    try {
      return await fs.readFile(
        path.join(process.cwd(), "output", "context", "etihad-context.md"),
        "utf8",
      );
    } catch {
      return "";
    }
  }
}

