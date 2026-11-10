import fs from "node:fs/promises";
import path from "node:path";
import { AIProvider } from "../ai/providers/AIProvider";
import { buildPlaywrightPrompt } from "../ai/prompts/playwright.prompt";
import { PlaywrightMcpClient } from "./PlaywrightMcpClient";

function extractSource(response: string): string {
  const fenced = response.match(/```(?:typescript|ts)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? response).trim();
}

function validateSource(source: string): void {
  if (!source.includes('from "@playwright/test"')) {
    throw new Error("Generated automation does not use Playwright Test.");
  }

  const imports = [...source.matchAll(/^\s*import\s+[\s\S]*?\s+from\s+["']([^"']+)["'];?\s*$/gm)]
    .map((match) => match[1]);
  if (
    imports.some((moduleName) => moduleName !== "@playwright/test") ||
    /\b(process|require|eval|child_process|from\s+["']node:)\b/.test(source)
  ) {
    throw new Error("Generated automation contains a disallowed operation or import.");
  }
}

function validateCoverage(source: string, testCases: Array<{ id: string }>): void {
  const missingIds = testCases
    .filter((testCase) => !source.includes(testCase.id))
    .map((testCase) => testCase.id);
  const testCount = (source.match(/\btest\s*\(/g) ?? []).length;

  if (missingIds.length > 0 || testCount !== testCases.length) {
    throw new Error(
      `Generated automation must contain exactly one test for every approved test case. ` +
        `Expected ${testCases.length}, found ${testCount}.` +
        (missingIds.length > 0 ? ` Missing: ${missingIds.join(", ")}.` : ""),
    );
  }
}

function validateExecution(output: string, expectedCount: number): void {
  const passedCount = Number(output.match(/(\d+)\s+passed\b/i)?.[1] ?? 0);
  if (
    passedCount !== expectedCount ||
    /\d+\s+(?:failed|timed out|skipped)\b/i.test(output) ||
    /\binterrupted\b/i.test(output)
  ) {
    throw new Error(
      `Playwright MCP did not pass all generated tests. Expected ${expectedCount} passed tests.\n${output}`,
    );
  }
}

export class PlaywrightAutomationService {
  async generateAndExecute(plan: any) {
    if (plan.status !== "approved") {
      throw new Error("Only approved story plans can be automated.");
    }

    const testCases = Array.isArray(plan.testCases) ? plan.testCases : [];
    if (testCases.length === 0) {
      throw new Error("The approved story plan has no test cases to execute.");
    }

    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      throw new Error("BASE_URL is not configured for Playwright execution.");
    }

    const approvedPlan = {
      ...plan,
      testCases,
    };
    const source = extractSource(
      await new AIProvider().chat([
        {
          role: "system",
          content: "Return only safe, valid Playwright TypeScript source code.",
        },
        {
          role: "user",
          content: buildPlaywrightPrompt(approvedPlan, baseUrl),
        },
      ]),
    );
    validateSource(source);
    validateCoverage(source, testCases);

    const automationDir = path.join(
      process.cwd(),
      "packages",
      "playwright",
      "tests",
      "generated",
    );
    await fs.mkdir(automationDir, { recursive: true });
    const specPath = path.join(automationDir, `${plan.storyId}.spec.ts`);
    await fs.writeFile(specPath, source, "utf8");

    const mcpClient = PlaywrightMcpClient.start(process.cwd());
    try {
      const output = await mcpClient.runTest(specPath);
      validateExecution(output, testCases.length);
      return {
        success: true,
        storyId: plan.storyId,
        testCaseCount: testCases.length,
        testCaseIds: testCases.map((testCase: any) => testCase.id),
        specPath: path.relative(process.cwd(), specPath),
        output,
      };
    } catch (error: any) {
      return {
        success: false,
        storyId: plan.storyId,
        testCaseCount: testCases.length,
        testCaseIds: testCases.map((testCase: any) => testCase.id),
        specPath: path.relative(process.cwd(), specPath),
        output: error.message ?? "Playwright MCP execution failed.",
      };
    } finally {
      await mcpClient.close();
    }
  }
}
