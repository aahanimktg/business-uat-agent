import { JiraSprintService } from "../integrations/jira/JiraSprintService";
import { JiraStoryService } from "../integrations/jira/JiraStoryService";
import { StoryMapper } from "../integrations/jira/JiraStoryMapper";

import { AIProvider } from "../ai/providers/AIProvider";
import { PlannerService } from "../ai/services/planner.service";
import { StructuredResponseService } from "../ai/services/structured-response.service";

import { Requirement } from "../ai/schemas/requirement.schema";

export class SprintPlanningService {
  // Legacy path: fetches everything from Jira live (sequential per story). Prefer
  // generatePlansFromRequirements() with pre-synced requirements where possible.
  async generateSprintPlan(sprintId: number) {
    const jira = new JiraSprintService();
    const storyService = new JiraStoryService();
    const issues = await jira.getSprintStories(sprintId);

    const requirements = await Promise.all(
      issues.map(async (story) => {
        const issue = await storyService.getIssue(story.key);
        const mappedStory = StoryMapper.map(issue);
        return {
          requirement: StoryMapper.toRequirement(mappedStory),
          jiraUpdatedAt: story.updated,
        };
      }),
    );

    return this.generatePlansFromRequirements(requirements);
  }

  async regenerateStory(storyKey: string) {
    const storyService = new JiraStoryService();
    const issue = await storyService.getIssue(storyKey);
    const mappedStory = StoryMapper.map(issue);
    const requirement = StoryMapper.toRequirement(mappedStory);

    return this.generatePlanForRequirement(
      requirement,
      (issue as any).fields?.updated,
    );
  }

  // Generates plans in parallel from already-synced requirements (no Jira calls) — fast path.
  async generatePlansFromRequirements(
    requirements: { requirement: Requirement; jiraUpdatedAt?: string }[],
  ) {
    return Promise.all(
      requirements.map(({ requirement, jiraUpdatedAt }) =>
        this.generatePlanForRequirement(requirement, jiraUpdatedAt),
      ),
    );
  }

  async generatePlanForRequirement(
    requirement: Requirement,
    jiraUpdatedAt?: string,
  ) {
    const provider = new AIProvider();
    const parser = new StructuredResponseService();
    const planner = new PlannerService(provider, parser);

    const testPlan = await planner.createPlan(requirement);
    return {
      ...testPlan,
      description: requirement.description ?? "",
      jiraUpdatedAt,
    };
  }
}
