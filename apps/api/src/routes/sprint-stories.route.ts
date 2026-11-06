import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { JiraSprintService } from "../../../../packages/integrations/jira/JiraSprintService";
import { JiraStoryService } from "../../../../packages/integrations/jira/JiraStoryService";
import { StoryMapper } from "../../../../packages/integrations/jira/JiraStoryMapper";

export const sprintStoriesRouter = Router();
const storyService = new JiraStoryService();

function sprintDocPath(sprintId: number) {
  return path.join(process.cwd(), "output", "sprints", `${sprintId}.json`);
}

sprintStoriesRouter.get("/", async (req, res) => {
  try {
    const sprintId = Number(req.query.sprintId);
    if (!sprintId) {
      return res.status(400).json({ success: false, message: "sprintId is required" });
    }

    const jira = new JiraSprintService();
    const liveStories = await jira.getSprintStories(sprintId);

    const file = sprintDocPath(sprintId);
    await fs.mkdir(path.dirname(file), { recursive: true });

    let doc: { sprintId: number; stories: Record<string, any> } = {
      sprintId,
      stories: {},
    };
    try {
      doc = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {}

    const now = new Date().toISOString();
    const liveKeys = new Set(liveStories.map((s) => s.key));

    // Fetch full issue details (needed for AI test-case generation) in parallel, and
    // only for stories that are new or have changed in Jira since the last sync.
    await Promise.all(
      liveStories.map(async (story) => {
        const existing = doc.stories[story.key];
        const unchanged =
          existing &&
          existing.updated === story.updated &&
          existing.requirement;

        const requirement = unchanged
          ? existing.requirement
          : StoryMapper.toRequirement(
              StoryMapper.map(await storyService.getIssue(story.key)),
            );

        doc.stories[story.key] = {
          key: story.key,
          id: story.id,
          summary: story.summary,
          updated: story.updated,
          requirement,
          firstSeenAt: existing?.firstSeenAt ?? now,
          lastSyncedAt: now,
          isNew: !existing,
          inSprint: true,
        };
      }),
    );

    // keep previously known stories that have since left the sprint, but mark them as such
    for (const key of Object.keys(doc.stories)) {
      if (!liveKeys.has(key)) {
        doc.stories[key].inSprint = false;
      }
    }

    await fs.writeFile(file, JSON.stringify(doc, null, 2));

    return res.json({
      success: true,
      sprintId,
      stories: Object.values(doc.stories)
        .filter((story: any) => story.inSprint === true)
        .map(({ requirement, ...story }: any) => ({
          ...story,
          description: requirement?.description ?? "",
        }))
        .sort((a: any, b: any) => a.key.localeCompare(b.key)),
    });
  } catch (error: any) {
    console.error("Sprint Stories Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
