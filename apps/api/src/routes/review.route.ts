import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { ReviewRequestSchema } from "../../../../packages/domain/schemas/test-plan.schema";
import { AIProvider } from "../../../../packages/ai/providers/AIProvider";
import { StructuredResponseService } from "../../../../packages/ai/services/structured-response.service";
import { FeedbackService } from "../../../../packages/ai/services/feedback.service";
export const reviewRouter = Router();

reviewRouter.post("/", async (req, res) => {
  try {
    const request = ReviewRequestSchema.parse(req.body);
    const { storyId, version, answers, additionalFeedback, currentPlan } =
      request;
    const outputDir = path.join(process.cwd(), "output");
    await fs.mkdir(outputDir, { recursive: true });
    const sessionFile = path.join(outputDir, "review-session.json");
    let session: any = { stories: {} };

    try {
      const existing = await fs.readFile(sessionFile, "utf8");
      session = JSON.parse(existing);
    } catch {}

    if (!session.stories[storyId]) {
      session.stories[storyId] = {
        feedbackHistory: [],
      };
    }

    session.stories[storyId].feedbackHistory.push({
      version,
      answers,
      additionalFeedback,
      createdOn: new Date().toISOString(),
    });

    await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));

    const provider = new AIProvider();
    const parser = new StructuredResponseService();
    const feedbackService = new FeedbackService(provider, parser);
    const updatedPlan = await feedbackService.updatePlan(
      currentPlan,
      session.stories[storyId].feedbackHistory,
    );

    const sprintPlanFile = path.join(
      process.cwd(),
      "output",
      "sprint-plan.json",
    );
    const sprintPlan = JSON.parse(await fs.readFile(sprintPlanFile, "utf8"));

    sprintPlan.stories = sprintPlan.stories.map((story: any) => {
      if (story.storyId === storyId) {
        return {...updatedPlan,
          status:updatedPlan.clarifications.length === 0
              ? "updated"
              : "draft",
        };
      }
      return story;
    });

    await fs.writeFile(sprintPlanFile,JSON.stringify(sprintPlan,null,2));
    
    // console.log(JSON.stringify(session.stories[storyId], null, 2))
    // console.log(JSON.stringify(updatedPlan, null, 2))
    return res.json({
      success: true,
      updatedPlan,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
