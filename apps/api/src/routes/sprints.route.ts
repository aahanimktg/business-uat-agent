import { Router } from "express";
import { JiraSprintService } from "../../../../packages/integrations/jira/JiraSprintService";

export const sprintsRouter = Router();

sprintsRouter.get("/", async (_req, res) => {
  try {
    const projectKey = process.env.JIRA_PROJECT_KEY;
    if (!projectKey) {
      return res
        .status(500)
        .json({ success: false, message: "JIRA_PROJECT_KEY is not configured" });
    }

    const jira = new JiraSprintService();
    const sprints = await jira.getAllSprintsForProject(projectKey);

    return res.json({ success: true, sprints });
  } catch (error: any) {
    console.error("Sprints List Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
