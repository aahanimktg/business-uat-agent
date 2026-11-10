import dotenv from "dotenv";
import path from "node:path";
import { executeApprovedCase } from "./executeApprovedCase.js";
import { executeStory } from "./executeStory.js";

const repoRoot = path.resolve(__dirname, "../../..");
process.chdir(repoRoot);
dotenv.config({ path: path.join(repoRoot, ".env") });

const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const storyId = option("--story");
const testCaseId = option("--case");
const planPath = option("--plan") ?? "output/sprint-plan.json";

if (Boolean(storyId) === Boolean(testCaseId)) {
  console.error("Usage: npm run orchestrator -- --case <testCaseId> [--plan path]\n   or: npm run orchestrator -- --story <storyId> [--plan path]");
  process.exit(2);
}

async function main() {
  try {
    const result = testCaseId
      ? await executeApprovedCase(testCaseId, planPath)
      : await executeStory(storyId!, planPath);
    console.log(JSON.stringify(result, null, 2));
    if ("status" in result && (result.status === "failed" || result.status === "blocked")) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

void main();
