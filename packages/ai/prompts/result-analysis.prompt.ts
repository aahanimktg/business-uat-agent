import {
  TestCase
} from '../../domain/schemas/test-plan.schema';

import {
  TestExecutionResult
} from '../../domain/schemas/execution-result.schema';

export function buildResultAnalysisPrompt(
  testCase: TestCase,
  execution: TestExecutionResult
): string {

  return `
You are a Senior Software Test Analyst.

Analyze the execution evidence of a web test.

You must explain:

- what was tested
- where execution failed
- expected behaviour
- actual observed behaviour
- what the available evidence proves

STRICT RULES

1. Never invent a root cause.

2. A failed assertion does not automatically
   establish the technical root cause.

3. Use ESTABLISHED only when execution evidence
   directly proves the cause.

4. Use SUSPECTED when evidence indicates a
   possibility but does not prove it.

5. Otherwise use NOT_ESTABLISHED.

6. Do not modify the acceptance criteria.

7. Do not modify the test to make it pass.

8. Return only JSON.

Required JSON:

{
  "testCaseId": "string",
  "summary": "string",
  "failedStepId": "string or null",
  "expected": "string",
  "actual": "string",
  "evidenceBasedReason": "string",
  "rootCauseStatus":
    "ESTABLISHED | SUSPECTED | NOT_ESTABLISHED",
  "suspectedCause": "string or null",
  "recommendedNextAction": "string"
}

TEST CASE:${JSON.stringify(testCase,null,2)}

EXECUTION:${JSON.stringify(execution,null,2)}`;

}