export function buildFeedbackPrompt(
  currentPlan: any,
  feedbackHistory: any[]
) {
  return `
You are a Senior QA Architect.

IMPORTANT:

You are NOT generating a new test plan.

You MUST update the EXISTING test plan.

Preserve all existing fields.

Preserve all existing test cases unless feedback explicitly requests modification.

Resolve clarifications when answers are available.

If clarification is resolved:
- remove it from clarifications
- update test cases if needed

If feedback requests a new scenario:
- add a new test case

If feedback requests modification:
- update existing test case

Never return sample data.

Never invent placeholder values.

Never return empty expectedOutcome.

Never return empty title.

Return ONLY valid JSON matching EXACTLY the same structure as Current Plan.

Current Plan:

${JSON.stringify(currentPlan, null, 2)}

Feedback History:

${JSON.stringify(feedbackHistory, null, 2)}

Rules:

1. Keep storyId unchanged.
2. Keep title unchanged.
3. Increment version by 1.
4. Keep existing test cases.
5. Update only affected areas.
6. Remove resolved clarifications.
7. If all clarifications resolved return:
   "clarifications":[]
8. status should remain "draft".
9. Return ONLY JSON.
`;
}
