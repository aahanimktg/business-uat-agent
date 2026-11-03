import { Router } from "express";
import * as fs from "node:fs/promises";
import { SprintPlanningService } from "../../../../packages/orchestration/SprintPlanningService";

export const generatePlanRouter = Router();

generatePlanRouter.post("/", async (req, res) => {
  try {
    console.log("Request received:", req.body);
    const { sprintId } = req.body;
    const service = new SprintPlanningService();
    console.log("Calling planner...");
    const plans = await service.generateSprintPlan(Number(sprintId));
    const sprintPlan = {
      sprintId,
      status: "in-review",
      stories: plans.map((plan) => ({
        ...plan,
        version: 1,
        status: "draft",
      })),
    };

    await fs.writeFile(
      "./output/sprint-plan.json",
      JSON.stringify(sprintPlan, null, 2),
    );
    console.log("Generated:", plans.length);
    return res.json({
      success: true,
      plans: sprintPlan.stories,
    });
  } catch (error: any) {
    console.error("Generate Plan Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
