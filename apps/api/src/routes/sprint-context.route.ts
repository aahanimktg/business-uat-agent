import { Router } from "express";
import { JiraSprintService } from "../../../../packages/integrations/jira/JiraSprintService";

export const sprintContextRouter = Router();

sprintContextRouter.get("/", async (_req, res) => {
  try {
    const projectKey = process.env.JIRA_PROJECT_KEY;
    if (!projectKey) {
      return res
        .status(500)
        .json({ success: false, message: "JIRA_PROJECT_KEY is not configured" });
    }

    const jira = new JiraSprintService();
    const context = await jira.getSprintContext(projectKey);

    return res.json({ success: true, ...context });
  } catch (error: any) {
    console.error("Sprint Context Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
