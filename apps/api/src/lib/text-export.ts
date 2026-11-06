import * as fs from "node:fs/promises";
import * as path from "node:path";

function renderTestPlanAsText(plan: any): string {
  const lines: string[] = [];

  lines.push(`Story: ${plan.storyId} - ${plan.title}`);
  lines.push(`Version: ${plan.version ?? 1}`);
  lines.push(`Status: ${plan.status ?? "draft"}`);
  lines.push(`Generated On: ${plan.generatedOn ?? ""}`);
  if (plan.jiraUpdatedAt) {
    lines.push(`Jira Updated At: ${plan.jiraUpdatedAt}`);
  }
  if (plan.coverageSummary) {
    lines.push("", "Coverage Summary:", plan.coverageSummary);
  }

  lines.push("", "=== Test Cases ===");
  for (const tc of plan.testCases ?? []) {
    lines.push(
      "",
      `[${tc.id}] ${tc.title} (${tc.type}, priority: ${tc.priority})`,
      `Acceptance Criteria: ${(tc.acceptanceCriteriaIds ?? []).join(", ")}`,
      `Objective: ${tc.objective}`,
      "Preconditions:",
      ...(tc.preconditions ?? []).map((p: string) => `  - ${p}`),
      "Steps:",
      ...(tc.steps ?? []).map((s: string, i: number) => `  ${i + 1}. ${s}`),
      `Expected Outcome: ${tc.expectedOutcome}`,
    );
  }

  if (plan.clarifications?.length) {
    lines.push("", "=== Clarifications ===");
    for (const cl of plan.clarifications) {
      lines.push(
        "",
        `[${cl.id}] ${cl.question}`,
        `Business Impact: ${cl.businessImpact}`,
        `Resolved: ${cl.resolved ? "yes" : "no"}${cl.answer ? ` - ${cl.answer}` : ""}`,
      );
    }
  }

  return lines.join("\n");
}

export async function writeTestPlanTextExport(plan: any): Promise<void> {
  const dir = path.join(process.cwd(), "output", "text");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${plan.storyId}.txt`);
  await fs.writeFile(file, renderTestPlanAsText(plan), "utf8");
}

export async function readTestPlanTextExport(storyId: string): Promise<string> {
  const file = path.join(process.cwd(), "output", "text", `${storyId}.txt`);
  return fs.readFile(file, "utf8");
}
