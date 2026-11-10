const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export type ExecutionStatus =
  | "queued"
  | "planning"
  | "executing"
  | "passed"
  | "failed"
  | "blocked";

export type ExecutionCaseResult = {
  testCaseId: string;
  title?: string;
  expectedResult?: string;
  status: ExecutionStatus | "planning" | "executing";
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  currentStep?: number;
  totalSteps?: number;
  activeStepId?: string;
  plannedSteps?: string[];
  actualResult?: string;
  failureType?: "application" | "automation";
  testData?: Array<{ name: string; value: string }>;
  evidence?: Record<string, string>;
  aiAnalysis?: string;
  steps?: Array<{ stepId: string; sourceStep: string; status: string; detail?: string }>;
};

export type ExecutionObservation = {
  timestamp: string;
  text: string;
  status: "passed" | "failed" | "blocked" | "running";
};

export type StoryExecutionResult = {
  status: ExecutionStatus;
  totals?: { total: number; passed: number; failed: number; blocked: number };
  results?: ExecutionCaseResult[];
  artifacts?: Record<string, string>;
};

export type ExecutionJob = {
  executionId: string;
  storyId?: string;
  testCaseId?: string;
  status: ExecutionStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  progress?: {
    storyTitle: string;
    totalCases: number;
    completedCases: number;
    cases: ExecutionCaseResult[];
    currentCase?: ExecutionCaseResult;
    observation: ExecutionObservation[];
  };
  result?: StoryExecutionResult;
  error?: string;
};

export async function generatePlan(sprintId: number) {
  console.log("Calling API...");

  const response = await fetch(`${API_BASE_URL}/generate-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sprintId }),
  });

  console.log("Status:", response.status);
  const data = await response.json();
  // console.log("Response:", data);
  if (!response.ok) {
    throw new Error(data.message ?? "Generate Plan Failed");
  }
  return data;
}

export async function regenerateStory(sprintId: number, storyId: string) {
  const response = await fetch(`${API_BASE_URL}/generate-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sprintId, storyId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message ?? "Regenerate Story Failed");
  }
  return data;
}

export async function getJiraStatus(sprintId: number) {
  const response = await fetch(
    `${API_BASE_URL}/jira-status?sprintId=${sprintId}`,
  );
  return response.json();
}

export async function getSprintStories(sprintId: number) {
  const response = await fetch(
    `${API_BASE_URL}/sprint-stories?sprintId=${sprintId}`,
  );
  return response.json();
}

export async function getSprintContext() {
  const response = await fetch(`${API_BASE_URL}/sprint-context`);
  return response.json();
}

export async function getAllSprints() {
  const response = await fetch(`${API_BASE_URL}/sprints`);
  return response.json();
}

export async function createJira(input: {
  sprintId: number;
  description: string;
  file?: File | null;
}) {
  const formData = new FormData();
  formData.append("sprintId", String(input.sprintId));
  formData.append("description", input.description);
  if (input.file) {
    formData.append("file", input.file);
  }

  const response = await fetch(`${API_BASE_URL}/jira-create`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message ?? "Create Jira Failed");
  }
  return data;
}

export async function getCreatedJiras() {
  const response = await fetch(`${API_BASE_URL}/created-jiras`);
  return response.json();
}

export async function getReportsOverview() {
  const response = await fetch(`${API_BASE_URL}/reports/overview`);
  return response.json();
}

export function getTextExportUrl(storyId: string) {
  return `${API_BASE_URL}/plans/${storyId}/text`;
}

export function getExcelExportUrl(storyId: string) {
  return `${API_BASE_URL}/plans/${storyId}/excel`;
}

export async function executeApprovedTests(storyId: string) {
  const response = await fetch(`${API_BASE_URL}/api/executions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storyId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Could not start automation execution");
  }
  return data as ExecutionJob;
}

export async function getExecutionStatus(executionId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/executions/${encodeURIComponent(executionId)}`,
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Could not retrieve execution status");
  }
  return data as ExecutionJob;
}

export async function reviewTestCases(
  storyId: string,
  testCaseIds: string[],
  action: "approve" | "reject",
) {
  const response = await fetch(`${API_BASE_URL}/testcase-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storyId, testCaseIds, action }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message ?? "Test Case Review Failed");
  }
  return data;
}

export async function getPlans() {
  const response = await fetch(`${API_BASE_URL}/plans`);
  return response.json();
}

export async function approveSprint() {
  const response = await fetch(`${API_BASE_URL}/approve-sprint`, {
    method: "POST",
  });
  return response.json();
}
