import { JiraSprintService } from "../integrations/jira/JiraSprintService";
import { JiraStoryService } from "../integrations/jira/JiraStoryService";
import { StoryMapper } from "../integrations/jira/JiraStoryMapper";

import { AIProvider } from "../ai/providers/AIProvider";
import { PlannerService } from "../ai/services/planner.service";
import { StructuredResponseService } from "../ai/services/structured-response.service";

import { Requirement } from "../ai/schemas/requirement.schema";

function storyToRequirement(story: any): Requirement {
  const parsedCriteria = StoryMapper.extractAcceptanceCriteria(
    story.acceptanceCriteria || "",
    story.description,
  );

  return {
    storyId: story.id,
    title: story.title,
    description: story.description,
    acceptanceCriteria: parsedCriteria,
  };
}

export class SprintPlanningService {
  async generateSprintPlan(sprintId: number) {
    const jira = new JiraSprintService();
    const storyService = new JiraStoryService();
    const provider = new AIProvider();
    const parser = new StructuredResponseService();
    const planner = new PlannerService(provider, parser);
    const issues = await jira.getSprintStories(sprintId);

    const plans = [];

    for (const story of issues) {
      const issue = await storyService.getIssue(story.key);
      const mappedStory = StoryMapper.map(issue);
      const requirement = storyToRequirement(mappedStory);
      const testPlan = await planner.createPlan(requirement);
      plans.push(testPlan);
    }

    return plans;
  }
}
