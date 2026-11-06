import { Router } from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { extractTextFromFile } from "../lib/doc-extract";
import { AIProvider } from "../../../../packages/ai/providers/AIProvider";
import { StructuredResponseService } from "../../../../packages/ai/services/structured-response.service";
import { JiraDraftService } from "../../../../packages/ai/services/jira-draft.service";
import { JiraIssueService } from "../../../../packages/integrations/jira/JiraIssueService";

export const jiraCreateRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

function createdJirasFilePath() {
  return path.join(process.cwd(), "output", "created-jiras.json");
}

async function appendCreatedJira(entry: any) {
  const file = createdJirasFilePath();
  await fs.mkdir(path.dirname(file), { recursive: true });

  let entries: any[] = [];
  try {
    entries = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {}

  entries.push(entry);
  await fs.writeFile(file, JSON.stringify(entries, null, 2));
}

jiraCreateRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    const { sprintId, description } = req.body;
    if (!sprintId) {
      return res.status(400).json({ success: false, message: "sprintId is required" });
    }
    if (!description && !req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Provide a description and/or a file" });
    }

    const projectKey = process.env.JIRA_PROJECT_KEY;
    if (!projectKey) {
      return res
        .status(500)
        .json({ success: false, message: "JIRA_PROJECT_KEY is not configured" });
    }

    let extractedText = "";
    if (req.file) {
      extractedText = await extractTextFromFile(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
      );
    }

    const combinedInput = [description, extractedText]
      .filter((part) => part && part.trim())
      .join("\n\n");

    if (!combinedInput.trim()) {
      return res.status(400).json({
        success: false,
        message: "Could not extract any usable content from the description/file",
      });
    }

    const provider = new AIProvider();
    const parser = new StructuredResponseService();
    const draftService = new JiraDraftService(provider, parser);
    const draft = await draftService.draft(combinedInput);

    const fullDescription = [
      draft.description,
      draft.acceptanceCriteria.length > 0
        ? `Acceptance Criteria:\n${draft.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const jiraIssueService = new JiraIssueService();
    const issue = await jiraIssueService.createIssue({
      projectKey,
      summary: draft.summary,
      description: fullDescription,
    });

    await jiraIssueService.addIssueToSprint(Number(sprintId), issue.key);

    const createdEntry = {
      key: issue.key,
      id: issue.id,
      summary: draft.summary,
      sprintId: Number(sprintId),
      createdAt: new Date().toISOString(),
    };
    await appendCreatedJira(createdEntry);

    return res.json({ success: true, issue: createdEntry, draft });
  } catch (error: any) {
    console.error("Create Jira Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
