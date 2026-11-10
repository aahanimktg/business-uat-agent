import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const executionRedactions = new Map<string, string[]>();

export type ExecutionEvent = {
  executionId: string; timestamp?: string; storyId?: string; testCaseId?: string;
  status: string; event: string; details?: unknown;
};

export function setExecutionRedactions(executionId: string, values: unknown[]): void {
  executionRedactions.set(executionId, [...new Set(values
    .filter((value): value is string | number | boolean => typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    .map(String)
    .filter(value => value.length > 0))].sort((a, b) => b.length - a.length));
}

export function clearExecutionRedactions(executionId: string): void {
  executionRedactions.delete(executionId);
}

export function redactExecutionData<T>(value: T, executionId: string): T {
  const redactions = executionRedactions.get(executionId) ?? [];
  return redactValue(value, redactions) as T;
}

export async function recordExecutionEvent(event: ExecutionEvent): Promise<void> {
  const timestamp = event.timestamp ?? new Date().toISOString();
  const folder = path.join("output/automation/executions", event.executionId);
  await mkdir(folder, { recursive: true });
  const safeEvent = redactExecutionData({ ...event, timestamp }, event.executionId);
  await appendFile(path.join(folder, "history.jsonl"), `${JSON.stringify(safeEvent)}\n`, "utf8");
}

export async function readExecutionHistory(executionId: string): Promise<ExecutionEvent[]> {
  const file = path.join("output/automation/executions", executionId, "history.jsonl");
  try {
    const contents = await readFile(file, "utf8");
    return contents.split("\n").filter(Boolean).map(line => JSON.parse(line) as ExecutionEvent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function listExecutionIds(): Promise<string[]> {
  const root = "output/automation/executions";
  try {
    const { readdir } = await import("node:fs/promises");
    return (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort().reverse();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function redactValue(value: unknown, redactions: string[]): unknown {
  if (typeof value === "string") {
    return redactions.reduce((result, sensitive) => {
      const escaped = sensitive.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return result.replace(new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "giu"), "[REDACTED]");
    }, value);
  }
  if (Array.isArray(value)) return value.map(item => redactValue(item, redactions));
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactValue(item, redactions)]));
  }
  return value;
}
