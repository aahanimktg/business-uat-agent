# Business UAT Agent

AI-powered Business Validation & UAT Agent that transforms Jira Sprint Stories into structured UAT Test Plans, enables Human-in-the-Loop Review & Approval, and prepares approved plans for future Playwright automation execution.

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
- Prepares Approved Plans for Playwright Automation

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
Future Playwright Automation
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
Future Automation Execution
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
- GitHub Actions

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

⬜ Playwright Automation Generation

⬜ Automated Test Execution

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

⬜ Playwright Script Generation

⬜ Automated UAT Execution

---

Phase 4

⬜ Autonomous Validation Agent