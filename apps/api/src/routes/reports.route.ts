import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { JiraSprintService } from "../../../../packages/integrations/jira/JiraSprintService";

export const reportsRouter = Router();

async function readGlobalSprintPlan(): Promise<any | null> {
  try {
    const file = path.join(process.cwd(), "output", "sprint-plan.json");
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

reportsRouter.get("/overview", async (_req, res) => {
  try {
    const projectKey = process.env.JIRA_PROJECT_KEY;
    if (!projectKey) {
      return res
        .status(500)
        .json({ success: false, message: "JIRA_PROJECT_KEY is not configured" });
    }

    const jira = new JiraSprintService();
    const sprints = await jira.getAllSprintsForProject(projectKey);

    const sprintPlan = await readGlobalSprintPlan();
    const planByStoryId = new Map(
      (sprintPlan?.stories ?? []).map((s: any) => [s.storyId, s]),
    );

    const sprintSummaries = await Promise.all(
      sprints.map(async (sprint: any) => {
        const stories = await jira.getSprintStories(sprint.id);
        const generated = stories.filter((s) => planByStoryId.has(s.key)).length;
        const approved = stories.filter(
          (s) => (planByStoryId.get(s.key) as any)?.status === "approved",
        ).length;

        return {
          sprintId: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate ?? null,
          endDate: sprint.endDate ?? null,
          totalStories: stories.length,
          generated,
          approved,
        };
      }),
    );

    const monthBuckets = new Map<string, any>();
    for (const summary of sprintSummaries) {
      if (!summary.startDate) continue;
      const month = summary.startDate.slice(0, 7); // YYYY-MM
      const bucket = monthBuckets.get(month) ?? {
        month,
        sprintCount: 0,
        totalStories: 0,
        generated: 0,
        approved: 0,
      };
      bucket.sprintCount += 1;
      bucket.totalStories += summary.totalStories;
      bucket.generated += summary.generated;
      bucket.approved += summary.approved;
      monthBuckets.set(month, bucket);
    }

    const monthSummaries = Array.from(monthBuckets.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    return res.json({ success: true, sprintSummaries, monthSummaries });
  } catch (error: any) {
    console.error("Reports Overview Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
