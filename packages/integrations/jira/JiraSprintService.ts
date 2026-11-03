import { JiraClient } from "./JiraClient";
export interface SprintStory {
  id: string;
  key: string;
  summary: string;
}
export class JiraSprintService {
  private readonly client = new JiraClient();

  async getSprints(board: number) {
    return await this.client.get(`/rest/agile/1.0/board/${board}/sprint`);
  }

  async getSprintStories(sprintId: number): Promise<SprintStory[]> {
    const response = await this.client.get(
      `/rest/agile/1.0/sprint/${sprintId}/issue`,
    );
    return response.issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary:issue.fields.summary
    }));
  }
}
