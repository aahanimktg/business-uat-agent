# Business UAT Agent

AI-powered Business Validation & UAT Agent that transforms Jira Sprint Stories into structured UAT Test Plans, enables Human-in-the-Loop Review & Approval, and executes approved plans through the Playwright Test MCP server.

---

## Vision

The goal of this platform is to help Business Users, QA Teams and Product Owners collaborate on UAT planning through AI-assisted test design and validation.

The platform:

- Reads Jira Sprint Stories
- Extracts Acceptance Criteria
- Generates AI-powered Test Plans
- Identifies Missing Clarifications
- Supports Human Review & Feedback
- Produces Approved Test Plans
- Learns Approved Business Knowledge
- Executes Approved Plans through Playwright Test MCP

---

# Current Workflow

```text
Jira Sprint
     ↓
Stories
     ↓
AI Planner
     ↓
Draft Test Plan
     ↓
Clarifications
     ↓
Review
     ↓
Updated Test Plan
     ↓
Story Approval
     ↓
Sprint Approval
     ↓
Approved Sprint Plan
     ↓
Playwright Test MCP Execution
```

---

# Features

## Sprint Planning

- Jira Sprint Integration
- Story Fetching
- Acceptance Criteria Extraction
- AI-Based Test Planning

---

## Human Review Workflow

- View Generated Test Cases
- View Clarifications
- Submit Clarification Answers
- Submit Additional Feedback
- Regenerate Updated Test Plans
- Multi-Version Story Review

---

## Approval Workflow

### Story Approval

A Story can only be approved when:

```text
Clarifications = 0
```

Once approved:

```text
Status = Approved
```

---

### Sprint Approval

A Sprint can only be approved when:

```text
All Stories Approved
```

Approval generates:

```text
output/approved-sprint-plan.json
```

---

## Business Knowledge Learning

Approved feedback is transformed into reusable business knowledge.

Stored in:

```text
output/context/business-knowledge.json
```

Used in future AI planning runs.

---

# Architecture

```text
apps/web
    ↓
Next.js UI

apps/api
    ↓
Express API

packages/orchestration
    ↓
Planning & Review Services

packages/integrations
    ↓
Jira Integration

packages/ai
    ↓
AI Planner
AI Feedback Service
Knowledge Extraction

packages/playwright
    ↓
Playwright Test MCP Execution
```

---

# Repository Structure

```text
business-uat-agent

apps
│
├── api
│   └── src
│       ├── routes
│       └── server.ts
│
└── web
    └── src
        ├── app
        ├── components
        ├── lib
        └── types

packages
│
├── ai
│   ├── prompts
│   ├── providers
│   ├── schemas
│   └── services
│
├── orchestration
│
├── integrations
│   └── jira
│
├── domain
│
└── playwright

output
│
├── sprint-plan.json
├── review-session.json
├── approved-sprint-plan.json
└── context
    └── business-knowledge.json
```

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Backend

- Express
- TypeScript

## AI

- LLM Provider Integration
- Structured JSON Responses
- Feedback-Based Plan Refinement

## Automation

- Playwright
- Playwright Test MCP (`test_run`)
- GitHub Actions

### Run a Sprint-Plan Test Case

From any terminal, run one case from the real `output/sprint-plan.json` through
typed planning, headed Playwright MCP execution, generated-test creation, and a
fresh Playwright replay:

```bash
npx tsx packages/orchestration/src/cli.ts --case TC-AIT-6-013
```

Run every case in a story sequentially:

```bash
npx tsx packages/orchestration/src/cli.ts --story AIT-6
```

Use `--plan <path>` to select a different sprint-plan JSON file. The reader
normalizes the repository's existing `sprintId`/`stories[].storyId`/
`testCases[].id` shape; it does not rewrite the source plan. The CLI and
orchestrator do not gate execution on `reviewStatus`.

Generated specs are written only under
`packages/playwright/tests/generated/<storyId>/<testCaseId>.spec.ts`. Run a
generated test directly with Playwright Test:

```bash
npx playwright test generated/AIT-6/TC-AIT-6-013.spec.ts --project=chromium
```

Generated test paths are relative to the configured Playwright `testDir`
(`packages/playwright/tests`).

The MCP browser is headed and isolated per case. Replay uses a fresh Playwright
browser context with the project's `playwright.config.ts` settings. Reusable
page objects and flows live under `packages/playwright/pages/`.
The shared Chromium profile is defined in
`packages/playwright/config/browserProfile.ts` and is used by both the
Playwright Test runner and the per-execution MCP config. This keeps the browser
arguments, desktop device defaults, viewport/screen, user agent, locale,
timezone, permissions, geolocation, HTTPS handling, and color scheme aligned.

On a worker machine without the MCP Chromium binary, install it once with:

```bash
npx -y @playwright/mcp@latest install-browser chromium
```

### API Execution Queue

Start the API with `npx tsx apps/api/src/server.ts`. Submit either a case or a
story; the queue returns a job ID immediately:

```http
POST http://localhost:4000/api/executions
Content-Type: application/json

{"testCaseId":"TC-AIT-6-013"}
```

or

```json
{"storyId":"AIT-6"}
```

Poll `GET /api/executions/<executionId>` for the per-job result. Set
`EXECUTION_QUEUE_CONCURRENCY` (default `1`) to configure concurrent jobs; cases
inside a story always run sequentially. Every job starts its own MCP browser and
replay process. `MAX_HEAL_ATTEMPTS` (default `2`) bounds semantic-locator repair
attempts. Repairs can update locators only; approved assertions are never
removed or changed.

In the web dashboard, clicking **Execute Tests** on an approved story creates
the same queued job and opens `/executions/<executionId>`. The execution screen
polls the job for live case/step progress, observations, evidence, and the final
summary. Progress is also available from the job response; screenshots can be
retrieved through `GET /api/executions/<executionId>/artifacts/<artifactName>`.
Test-data values are redacted from persisted progress.

The generated spec reads test data from `UAT_TESTDATA_<NAME>` environment
variables (camelCase names become uppercase snake case, for example
`originCity` becomes `UAT_TESTDATA_ORIGIN_CITY`). The orchestrator supplies the
approved plan's values to its replay process without writing them into generated
source or execution logs. Set these variables yourself when running a generated
spec independently.

### Execution Artifacts

Each case run is stored in
`output/automation/executions/<executionId>/`: `result.json`, `history.jsonl`,
`action-plan.json`, `steps.json`, `metrics.json`, the isolated MCP config and
browser output, and any exploration/replay screenshots, videos, error context,
or traces. Story runs have their own summary/history/metrics directory and
include each child case's artifact paths. The persistent semantic locator
registry is `output/automation/locator-registry/etihad.json`.

Application assertion failures are reported as failed executions. Plan,
locator, browser, and replay-runner failures are reported as blocked automation
failures.

---

# Setup

## Install Dependencies

```bash
npm install
```

---

## Run Frontend

```bash
cd apps/web

npm run dev
```

Application:

```text
http://localhost:3000
```

---

## Run Backend

```bash
npx tsx apps/api/src/server.ts
```

API:

```text
http://localhost:4000
```

---

# Configuration

Create:

```text
.env
```

Example:

```env
API_URL=
API_KEY=
MODEL_NAME=

JIRA_BASE_URL=
JIRA_EMAIL=
JIRA_TOKEN=
```

---

# Output Files

## Sprint Plan

Generated AI Sprint Plan

```text
output/sprint-plan.json
```

---

## Review Session

Review Feedback History

```text
output/review-session.json
```

---

## Approved Sprint

Final Approved Test Plan

```text
output/approved-sprint-plan.json
```

---

## Business Knowledge

Approved Learnings

```text
output/context/business-knowledge.json
```

---

# Current Status

Implemented:

✅ Jira Integration

✅ Sprint Planning

✅ AI Test Plan Generation

✅ Clarification Generation

✅ Review Workflow

✅ Story Approval

✅ Sprint Approval

✅ Knowledge Extraction Framework

Upcoming:

⬜ Human review of generated tests

⬜ CI/CD replay integration

⬜ Result Analysis

⬜ Defect Generation

⬜ Dashboard Analytics

---

# Future Roadmap

Phase 1

✅ AI Planning

✅ Review Workflow

✅ Approval Workflow

---

Phase 2

⬜ Business Knowledge Learning

⬜ Context-Aware Planning

---

Phase 3

✅ Playwright Script Generation

✅ CLI/API Automated UAT Execution

---

Phase 4

⬜ Autonomous Validation Agent