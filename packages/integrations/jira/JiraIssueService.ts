import { JiraClient } from "./JiraClient";
import { JiraADFParser } from "./JiraADFParser";

export class JiraIssueService {
  private readonly client = new JiraClient();

  async createIssue(options: {
    projectKey: string;
    summary: string;
    description: string;
    issueType?: string;
  }): Promise<{ key: string; id: string }> {
    const response = await this.client.post("/rest/api/3/issue", {
      fields: {
        project: { key: options.projectKey },
        summary: options.summary,
        description: JiraADFParser.textToAdf(options.description),
        issuetype: { name: options.issueType ?? "Story" },
      },
    });

    return { key: response.key, id: response.id };
  }

  async addIssueToSprint(sprintId: number, issueKey: string): Promise<void> {
    await this.client.post(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
      issues: [issueKey],
    });
  }
}
