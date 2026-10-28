import { Router } from "express";
import fs from "fs/promises";
import path from "path";

export const approveSprintRouter = Router();

approveSprintRouter.post(
  "/",

  async (_, res) => {
    const sprintPlan = JSON.parse(
      await fs.readFile("./output/sprint-plan.json", "utf8"),
    );

    const allApproved = sprintPlan.stories.every(
      (s: any) => s.status === "approved",
    );

    if (!allApproved) {
      return res.status(400).json({
        success: false,
        message: "All stories must be approved",
      });
    }

    await fs.writeFile(
      "./output/approved-sprint-plan.json",
      JSON.stringify(sprintPlan, null, 2),
    );

    res.json({
      success: true,
    });
  },
);
