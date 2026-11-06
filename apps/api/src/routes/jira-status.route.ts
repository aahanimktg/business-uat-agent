import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { JiraSprintService } from "../../../../packages/integrations/jira/JiraSprintService";

export const jiraStatusRouter = Router();

jiraStatusRouter.get("/", async (req, res) => {
  try {
    const sprintId = Number(req.query.sprintId);
    if (!sprintId) {
      return res.status(400).json({ success: false, message: "sprintId is required" });
    }

    const file = path.join(process.cwd(), "output", "sprint-plan.json");
    const sprintPlan = JSON.parse(await fs.readFile(file, "utf8"));

    const jira = new JiraSprintService();
    const stories = await jira.getSprintStories(sprintId);
    const jiraUpdatedByKey = new Map(stories.map((s) => [s.key, s.updated]));

    const statuses = (sprintPlan.stories ?? []).map((story: any) => {
      const jiraUpdated = jiraUpdatedByKey.get(story.storyId) ?? null;
      const changed =
        !!jiraUpdated &&
        !!story.jiraUpdatedAt &&
        new Date(jiraUpdated).getTime() !== new Date(story.jiraUpdatedAt).getTime();

      return {
        storyId: story.storyId,
        jiraUpdatedAt: story.jiraUpdatedAt ?? null,
        currentJiraUpdatedAt: jiraUpdated,
        changed,
      };
    });

    return res.json({ success: true, statuses });
  } catch (error: any) {
    console.error("Jira Status Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
