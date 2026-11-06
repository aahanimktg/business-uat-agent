import { Router } from "express";
import fs from "fs/promises";
import path from "path";

export const createdJirasRouter = Router();

createdJirasRouter.get("/", async (_req, res) => {
  try {
    const file = path.join(process.cwd(), "output", "created-jiras.json");
    const entries = JSON.parse(await fs.readFile(file, "utf8"));
    return res.json({ success: true, count: entries.length, entries });
  } catch {
    return res.json({ success: true, count: 0, entries: [] });
  }
});
