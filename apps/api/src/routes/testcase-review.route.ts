import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { KnowledgeExtractionService } from "../../../../packages/ai/services/knowledge-extraction.service";
import { ContextService } from "../../../../packages/ai/services/context.service";

export const testCaseReviewRouter = Router();

const APPROVAL_THRESHOLD_PERCENT = 70;

testCaseReviewRouter.post("/", async (req, res) => {
  try {
    const { storyId, testCaseIds, action } = req.body as {
      storyId: string;
      testCaseIds: string[];
      action: "approve" | "reject";
    };

    if (!storyId || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "storyId and testCaseIds are required",
      });
    }

    if (action !== "approve" && action !== "reject") {
      return res.status(400).json({
        success: false,
        message: "action must be 'approve' or 'reject'",
      });
    }

    const file = path.join(process.cwd(), "output", "sprint-plan.json");
    const sprintPlan = JSON.parse(await fs.readFile(file, "utf8"));

    const storyIndex = sprintPlan.stories.findIndex(
      (s: any) => s.storyId === storyId,
    );
    if (storyIndex < 0) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    const story = sprintPlan.stories[storyIndex];
    const reviewStatus = action === "approve" ? "approved" : "rejected";

    const testCases = (story.testCases ?? []).map((tc: any) =>
      testCaseIds.includes(tc.id) ? { ...tc, reviewStatus } : tc,
    );

    const total = testCases.length;
    const approvedCount = testCases.filter(
      (tc: any) => tc.reviewStatus === "approved",
    ).length;
    const approvedPercentage = total > 0 ? (approvedCount / total) * 100 : 0;

    const previousStatus = story.status;
    const crossedThreshold = approvedPercentage > APPROVAL_THRESHOLD_PERCENT;
    const newStatus = crossedThreshold
      ? "approved"
      : previousStatus === "approved"
        ? "updated"
        : previousStatus;

    if (crossedThreshold && previousStatus !== "approved") {
      try {
        const sessionFile = path.join(
          process.cwd(),
          "output",
          "review-session.json",
        );
        const session = JSON.parse(await fs.readFile(sessionFile, "utf8"));
        const feedbackHistory = session.stories?.[storyId]?.feedbackHistory ?? [];
        const extractor = new KnowledgeExtractionService();
        const rules = await extractor.extractKnowledge(
          { ...story, testCases },
          feedbackHistory,
        );
        const contextService = new ContextService();
        await contextService.appendKnowledge(rules);
      } catch (error) {
        console.error("Knowledge extraction on auto-approval failed:", error);
      }
    }

    const updatedStory = { ...story, testCases, status: newStatus };
    sprintPlan.stories[storyIndex] = updatedStory;

    await fs.writeFile(file, JSON.stringify(sprintPlan, null, 2));

    return res.json({
      success: true,
      plan: updatedStory,
      approvedCount,
      total,
      approvedPercentage,
      readyToMove: crossedThreshold,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
