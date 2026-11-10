import type { IncomingMessage, ServerResponse } from "node:http";
import { createExecutionJob, getExecutionJob } from "../controllers/executionController.js";
import { ExecutionQueue } from "../workers/executionQueue.js";

const executionQueue = new ExecutionQueue();

/**
 * Framework-free Node HTTP handler.
 * Mount it on a Node server; for example: server.on("request", handleExecutionsRoute).
 */
export async function handleExecutionsRoute(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  try {
    if (req.method === "POST" && url.pathname === "/api/executions") {
      const body = await readJsonBody(req);
      const job = await createExecutionJob(body);
      executionQueue.enqueue(job);
      return send(res, 202, {
        ...job,
        queue: { queued: executionQueue.queuedCount, active: executionQueue.activeCount, concurrency: executionQueue.concurrency },
      });
    }

    const match = url.pathname.match(/^\/api\/executions\/([a-f0-9-]{36})$/i);
    if (req.method === "GET" && match) {
      const job = await getExecutionJob(match[1]);
      return job ? send(res, 200, job) : send(res, 404, { error: "Execution not found" });
    }

    return send(res, 404, { error: "Route not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /invalid|provide exactly|required/i.test(message) ? 400 : 500;
    return send(res, status, { error: message });
  }
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > 1024 * 1024) throw new Error("Request body exceeds 1 MB");
    chunks.push(buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new Error("Request body must be valid JSON"); }
}

function send(res: ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}
