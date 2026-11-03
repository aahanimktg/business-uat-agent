import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { KnowledgeExtractionService } from "../../../../packages/ai/services/knowledge-extraction.service";
import { ContextService } from "../../../../packages/ai/services/context.service";

export const approveRouter = Router();

approveRouter.post("/", async (req, res) => {
  try {
    const { storyId, currentPlan } = req.body;
    const sessionFile = path.join(
      process.cwd(),
      "output",
      "review-session.json",
    );

    const session = JSON.parse(await fs.readFile(sessionFile, "utf8"));
    const feedbackHistory = session.stories[storyId]?.feedbackHistory || [];
    const extractor = new KnowledgeExtractionService();
    const rules = await extractor.extractKnowledge(
      currentPlan,
      feedbackHistory,
    );
    const contextService = new ContextService();
    await contextService.appendKnowledge(rules);
    const file = path.join(process.cwd(), "output", "sprint-plan.json");
    const sprintPlan = JSON.parse(await fs.readFile(file, "utf8"));
    sprintPlan.stories = sprintPlan.stories.map((story: any) => {
    if (story.storyId === storyId) {return {...story,status: "approved",};}return story;});
    await fs.writeFile(file,JSON.stringify(sprintPlan, null, 2),);
    return res.json({success: true,approved: true,});
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
