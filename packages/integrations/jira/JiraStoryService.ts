import { JiraClient } from "./JiraClient";
import { Requirement, RequirementSchema } from "../../ai/schemas/requirement.schema";

export interface JiraIssue {
  key: string;
  summary: string;
  description: any;
  fields: any;
}

export class JiraStoryService{
    private readonly client=new JiraClient();

    /**
     * Returns the raw Jira issue payload (as returned by Jira REST API).
     * Useful when downstream logic needs Jira fields/customfields (e.g. StoryMapper).
     */
    async getIssue(storyKey: string): Promise<JiraIssue> {
      return await this.client.get(`/rest/api/3/issue/${storyKey}`);
    }

    async getStory(storyKey: string): Promise<Requirement> {
    const issue =await this.getIssue(storyKey);
    return {
      storyId: issue.key,
      title: issue.fields.summary,
      description:issue.fields.description,
      acceptanceCriteria: []
    };
  }
}