import assert from "node:assert/strict";
import { test } from "node:test";
import type { PlaywrightMcpClient } from "../mcp/playwrightMcpClient.js";
import { executePlan } from "./stepExecutor.js";

test("asserts a passenger count from the textbox inside its labeled row", async () => {
  const browser = {
    callTool: async () => ({
      content: [{ type: "text", text: [
        '- generic [ref=row-adults]:',
        '  - generic [ref=label-adults]: Adults',
        '  - tab "-" [disabled] [ref=minus-adults]',
        '  - paragraph [ref=count-adults]:',
        '    - textbox: "1"',
        '  - tab "+" [ref=plus-adults]',
        '- generic [ref=row-infants]:',
        '  - generic [ref=label-infants]: Infants',
        '  - textbox: "0"',
      ].join("\n") }],
    }),
  } as unknown as PlaywrightMcpClient;
  const plan = (expected: string) => ({
    testCaseId: "TC-001",
    steps: [{
      id: "S1",
      sourceStep: `Verify Adults value equals ${expected}`,
      action: "assertValue",
      target: "Adults",
      expected,
    }],
  });

  const passed = await executePlan({ plan: plan("1"), browser });
  const failed = await executePlan({ plan: plan("2"), browser });

  assert.equal(passed[0].status, "passed");
  assert.match(passed[0].detail, /Adults value is '1'/);
  assert.equal(failed[0].status, "failed");
  assert.match(failed[0].detail, /received '1'/);
});

test("asserts a disabled passenger control even when the snapshot has no temporary ref", async () => {
  const browser = {
    callTool: async () => ({
      content: [{ type: "text", text: [
        '- generic [ref=row-adults]:',
        '  - generic [ref=label-adults]: Adults',
        '  - tab "-" [disabled]',
        '  - textbox: "1"',
        '  - tab "+" [ref=plus-adults]',
      ].join("\n") }],
    }),
  } as unknown as PlaywrightMcpClient;
  const result = await executePlan({
    plan: {
      testCaseId: "TC-001",
      steps: [{
        id: "S1",
        sourceStep: "Verify Decrease adults is disabled",
        action: "assertDisabled",
        target: "Decrease adults",
      }],
    },
    browser,
  });

  assert.equal(result[0].status, "passed");
  assert.match(result[0].detail, /Decrease adults is disabled/);
});
