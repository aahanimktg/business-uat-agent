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
