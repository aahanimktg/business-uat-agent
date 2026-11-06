import { JiraClient } from "./JiraClient";
export interface SprintStory {
  id: string;
  key: string;
  summary: string;
  updated: string;
}
export class JiraSprintService {
  private readonly client = new JiraClient();

  async getSprints(board: number) {
    return await this.client.get(`/rest/agile/1.0/board/${board}/sprint`);
  }

  async getBoardIdForProject(projectKey: string): Promise<number> {
    const boards = await this.client.get(
      `/rest/agile/1.0/board?projectKeyOrId=${projectKey}`,
    );
    const boardId = boards.values?.[0]?.id;
    if (!boardId) {
      throw new Error(`No Jira board found for project ${projectKey}`);
    }
    return boardId;
  }

  async getSprintContext(projectKey: string) {
    const boardId = await this.getBoardIdForProject(projectKey);
    const response = await this.getSprints(boardId);
    const sprints = response.values ?? [];

    const activeIndex = sprints.findIndex((s: any) => s.state === "active");
    const current = activeIndex >= 0 ? sprints[activeIndex] : null;
    const previous = activeIndex > 0 ? sprints[activeIndex - 1] : null;
    const next =
      activeIndex >= 0 && activeIndex < sprints.length - 1
        ? sprints[activeIndex + 1]
        : null;

    return { current, previous, next };
  }

  async getAllSprintsForProject(projectKey: string) {
    const boardId = await this.getBoardIdForProject(projectKey);
    const response = await this.getSprints(boardId);
    return response.values ?? [];
  }

  async getSprintStories(sprintId: number): Promise<SprintStory[]> {
    const response = await this.client.get(
      `/rest/agile/1.0/sprint/${sprintId}/issue`,
    );
    return response.issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary:issue.fields.summary,
      updated:issue.fields.updated
    }));
  }
}
