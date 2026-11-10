import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import path from "node:path";

type JsonRpcResponse = {
  id?: number;
  result?: {
    content?: Array<{ type?: string; text?: string }>;
    isError?: boolean;
  };
  error?: { message?: string };
};

function responseText(response: JsonRpcResponse): string {
  return (response.result?.content ?? [])
    .map((item) => item.text ?? "")
    .filter(Boolean)
    .join("\n");
}

export class PlaywrightMcpClient {
  private readonly process: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<
    number,
    { resolve: (response: JsonRpcResponse) => void; reject: (error: Error) => void }
  >();
  private nextId = 1;
  private buffer = "";
  private stderr = "";

  private constructor(
    child: ChildProcessWithoutNullStreams,
    private readonly cwd: string,
  ) {
    this.process = child;
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => this.read(chunk));
    child.stderr.on("data", (chunk: string) => {
      this.stderr += chunk;
    });
    child.on("error", (error) => this.rejectPending(error));
    child.on("exit", (code) => {
      if (code !== 0) {
        this.rejectPending(
          new Error(
            `Playwright MCP server exited with code ${code}.${this.stderr ? ` ${this.stderr.trim()}` : ""}`,
          ),
        );
      }
    });
  }

  static start(cwd: string): PlaywrightMcpClient {
    const npxCommand =
      process.platform === "win32"
        ? path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")
        : "npx";
    const command = process.platform === "win32" ? process.execPath : npxCommand;
    const args =
      process.platform === "win32"
        ? [npxCommand, "playwright", "run-test-mcp-server", "--headless"]
        : ["playwright", "run-test-mcp-server", "--headless"];
    const child = spawn(command, args, {
      cwd,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return new PlaywrightMcpClient(child, cwd);
  }

  private read(chunk: string): void {
    this.buffer += chunk;
    let newlineIndex = this.buffer.indexOf("\n");
    while (newlineIndex >= 0) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);
      if (line) {
        try {
          const response = JSON.parse(line) as JsonRpcResponse;
          if (typeof response.id === "number") {
            const pending = this.pending.get(response.id);
            if (pending) {
              this.pending.delete(response.id);
              pending.resolve(response);
            }
          }
        } catch {
          // The MCP server may write non-JSON diagnostics to stdout while starting.
        }
      }
      newlineIndex = this.buffer.indexOf("\n");
    }
  }

  private rejectPending(error: Error): void {
    for (const { reject } of this.pending.values()) {
      reject(error);
    }
    this.pending.clear();
  }

  private request(
    method: string,
    params: Record<string, unknown>,
    timeoutMs = 10 * 60 * 1000,
  ): Promise<JsonRpcResponse> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Playwright MCP request timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject });
      const pending = this.pending.get(id);
      if (pending) {
        pending.resolve = (response) => {
          clearTimeout(timer);
          resolve(response);
        };
        pending.reject = (error) => {
          clearTimeout(timer);
          reject(error);
        };
      }
      this.process.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    });
  }

  private notify(method: string, params: Record<string, unknown>): void {
    this.process.stdin.write(
      `${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`,
    );
  }

  async runTest(specPath: string): Promise<string> {
    const initialized = await this.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "business-uat-agent", version: "1.0.0" },
    });
    if (initialized.error) {
      throw new Error(initialized.error.message ?? "Playwright MCP initialization failed.");
    }

    this.notify("notifications/initialized", {});
    const testDir = path.join(this.cwd, "packages", "playwright", "tests");
    const location = path
      .relative(testDir, path.resolve(specPath))
      .replace(/\\/g, "/");
    const result = await this.request("tools/call", {
      name: "test_run",
      arguments: {
        locations: [location],
        projects: ["chromium"],
      },
    });

    if (result.error) {
      throw new Error(result.error.message ?? "Playwright MCP test execution failed.");
    }
    const output = responseText(result);
    if (result.result?.isError) {
      throw new Error(output || "Playwright MCP test execution failed.");
    }
    return output;
  }

  async close(): Promise<void> {
    this.process.stdin.end();
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        if (this.process.exitCode === null) {
          this.process.kill();
        }
        resolve();
      }, 5_000);
      this.process.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}
