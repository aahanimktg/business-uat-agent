// feedback-context.service.ts

import fs from "fs/promises";

export class FeedbackContextService {
  private readonly file = "./data/feedback-context.json";

  async getContext(storyId: string) {
    try {
      const data = await fs.readFile(this.file, "utf8");
      const contexts = JSON.parse(data);
      return contexts.find((x: any) => x.storyId === storyId);
    } catch {
      return null;
    }
  }

  async saveFeedback(storyId: string, feedback: string, version: number) {
    let contexts: any[] = [];
    try {
      const existing = await fs.readFile(this.file, "utf8");
      contexts = JSON.parse(existing);
    } catch {}

    let storyContext = contexts.find((x) => x.storyId === storyId);
    if (!storyContext) {
      storyContext = {
        storyId,
        feedbackHistory: [],
      };
      contexts.push(storyContext);
    }

    storyContext.feedbackHistory.push({
      timestamp: new Date().toISOString(),
      feedback,
      version,
    });

    await fs.mkdir("./data", { recursive: true });

    await fs.writeFile(this.file, JSON.stringify(contexts, null, 2));
  }
}


