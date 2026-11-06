import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { readTestPlanTextExport } from "../lib/text-export";
import * as XLSX from "xlsx";

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

plansRouter.get("/:storyId/text", async (req, res) => {
  try {
    const text = await readTestPlanTextExport(req.params.storyId);
    res.type("text/plain").send(text);
  } catch {
    res.status(404).type("text/plain").send("Text export not found.");
  }
});

plansRouter.get("/:storyId/excel", async (req, res) => {
  try {
    const file = path.join(process.cwd(), "output", "sprint-plan.json");
    const sprintPlan = JSON.parse(await fs.readFile(file, "utf8"));
    const plan = sprintPlan.stories?.find(
      (story: any) => story.storyId === req.params.storyId,
    );

    if (!plan) {
      return res.status(404).send("Story plan not found.");
    }

    if (plan.status !== "approved") {
      return res.status(409).send("Only approved story plans can be downloaded.");
    }

    const rows = (plan.testCases ?? []).map((testCase: any) => ({
      "Story ID": plan.storyId,
      "Story Title": plan.title,
      "Test Case ID": testCase.id,
      "Test Case Title": testCase.title,
      Type: testCase.type,
      Priority: testCase.priority,
      Objective: testCase.objective,
      Preconditions: (testCase.preconditions ?? []).join("\n"),
      Steps: (testCase.steps ?? [])
        .map((step: string, index: number) => `${index + 1}. ${step}`)
        .join("\n"),
      "Expected Outcome": testCase.expectedOutcome,
      "Review Status": testCase.reviewStatus,
      "Automation Feasibility": testCase.automationFeasibility ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 42 },
      { wch: 16 },
      { wch: 42 },
      { wch: 14 },
      { wch: 12 },
      { wch: 48 },
      { wch: 48 },
      { wch: 64 },
      { wch: 48 },
      { wch: 16 },
      { wch: 26 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Approved Test Cases");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res
      .type(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      )
      .setHeader(
        "Content-Disposition",
        `attachment; filename="${plan.storyId}-approved-test-cases.xlsx"`,
      )
      .send(buffer);
  } catch (error: any) {
    console.error("Excel Export Error:", error);
    return res.status(500).send("Unable to create Excel export.");
  }
});
