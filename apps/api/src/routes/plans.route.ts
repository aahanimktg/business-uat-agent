import { Router } from "express";
import fs from "fs/promises";
import path from "path";

export const plansRouter = Router();

plansRouter.get("/", async (_, res) => {
  try {
    const file = path.join(process.cwd(), "output", "sprint-plan.json");
    const content = await fs.readFile(file, "utf8");
    return res.json(JSON.parse(content));
  } catch {
    return res.json({
      sprintId: null,
      stories: [],
    });
  }
});
