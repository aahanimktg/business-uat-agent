import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import path from "node:path";

/**
 * Local MCP client for Microsoft's Playwright MCP server.
 *
 * The server is started as a child process using stdio. Playwright MCP is headed
 * by default, so when this process runs in the user's desktop session the browser
 * is visible. Do not put the AI provider key here; it belongs in the AI provider.
 */
export class PlaywrightMcpClient {
  private constructor(
    private readonly client: Client,
    private readonly transport: StdioClientTransport,
    private readonly allowedTools: Set<string>,
  ) {}

  static async connect(options: {
    command?: string;
    args?: string[];
    configPath?: string;
    env?: NodeJS.ProcessEnv;
    clientName?: string;
    clientVersion?: string;
  } = {}): Promise<PlaywrightMcpClient> {
    const command = options.command ?? process.env.PLAYWRIGHT_MCP_COMMAND ?? "npx";
    const configPath = path.resolve(options.configPath ?? path.join(__dirname, "playwright-mcp.config.json"));
    const configuredArgs = options.args ?? parseArgs(process.env.PLAYWRIGHT_MCP_ARGS);
    const args = configuredArgs ? [...configuredArgs] : ["-y", "@playwright/mcp@latest"];
    if (options.configPath) {
      for (let index = args.length - 1; index >= 0; index -= 1) {
        if (args[index] === "--config") args.splice(index, 2);
        else if (args[index].startsWith("--config=")) args.splice(index, 1);
      }
      args.push("--config", configPath);
    } else if (!args.some(argument => argument === "--config" || argument.startsWith("--config="))) {
      args.push("--config", configPath);
    }

    // Do not set --headless by default. The MCP server defaults to headed mode.
    const transport = new StdioClientTransport({
      command,
      args,
      env: cleanEnv(options.env ?? process.env),
      stderr: "pipe",
    });
    const client = new Client({
      name: options.clientName ?? "business-uat-agent",
      version: options.clientVersion ?? "1.0.0",
    });

    try {
      await client.connect(transport);
      const listed = await client.listTools();
      const tools = listed.tools.filter(isAllowedTool);
      if (tools.length === 0) throw new Error("Playwright MCP connected but exposed no allowed browser tools");
      return new PlaywrightMcpClient(client, transport, new Set(tools.map(tool => tool.name)));
    } catch (error) {
      await safeClose(client, transport);
      throw new Error(`Could not start/connect to Playwright MCP (${command} ${args.join(" ")}): ${errorMessage(error)}`);
    }
  }

  /** Returns only tools permitted for the autonomous test runner. */
  async listTools(): Promise<Tool[]> {
    const result = await this.client.listTools();
    return result.tools.filter(tool => this.allowedTools.has(tool.name));
  }

  /** Calls a discovered, allowlisted Playwright MCP tool. */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<CallToolResult> {
    if (!this.allowedTools.has(name)) {
      throw new Error(`MCP tool '${name}' is unavailable or blocked by the Playwright client allowlist`);
    }
    const response = await this.client.callTool({ name, arguments: args });
    if (!isCallToolResult(response)) {
      throw new Error(`Playwright MCP tool '${name}' returned a non-result response`);
    }
    const result = response;
    if (result.isError) {
      const detail = result.content
        .filter((item): item is Extract<typeof item, { type: "text" }> => item.type === "text")
        .map(item => item.text).join("\n");
      throw new Error(`Playwright MCP tool '${name}' failed${detail ? `: ${detail}` : ""}`);
    }
    return result;
  }

  async close(): Promise<void> {
    await safeClose(this.client, this.transport);
  }
}

/** Only browser observation and ordinary UI actions are exposed to the model. */
function isAllowedTool(tool: Tool): boolean {
  const denied = new Set([
    "browser_run_code_unsafe",
    "browser_evaluate",
    "browser_install",
    "browser_get_console_message",
    "browser_network_request",
  ]);
  if (denied.has(tool.name)) return false;
  return new Set([
    "browser_navigate", "browser_navigate_back", "browser_snapshot", "browser_find",
    "browser_click", "browser_hover", "browser_drag", "browser_type", "browser_fill_form",
    "browser_select_option", "browser_press_key", "browser_wait_for", "browser_take_screenshot",
    "browser_tabs", "browser_handle_dialog", "browser_file_upload", "browser_console_messages",
    "browser_network_requests", "browser_resize", "browser_close",
  ]).has(tool.name);
}

function parseArgs(value?: string): string[] | undefined {
  if (!value?.trim()) return undefined;
  // Prefer a JSON array, e.g. ["-y", "@playwright/mcp@latest"].
  if (value.trim().startsWith("[")) {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some(item => typeof item !== "string")) {
      throw new Error("PLAYWRIGHT_MCP_ARGS JSON value must be an array of strings");
    }
    return parsed;
  }
  // Comma-separated form is supported for the existing .env.example.
  return value.split(",").map(part => part.trim()).filter(Boolean);
}

function isCallToolResult(value: unknown): value is CallToolResult {
  return typeof value === "object" && value !== null && "content" in value && Array.isArray(value.content);
}

function cleanEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) if (value !== undefined) result[key] = value;
  return result;
}

async function safeClose(client: Client, transport: StdioClientTransport) {
  try { await client.close(); } catch { /* may not have completed initialize */ }
  try { await transport.close(); } catch { /* process may already have exited */ }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
