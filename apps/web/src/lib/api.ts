const API_BASE_URL = "http://localhost:4000";

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
