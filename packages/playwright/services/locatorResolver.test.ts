import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { LocatorRegistry } from "../registry/locatorRegistry.js";
import type { PlaywrightMcpClient } from "../mcp/playwrightMcpClient.js";
import { LocatorResolver } from "./locatorResolver.js";

test("resolves a sensitive cabin label locally and stores no raw test data", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "locator-resolver-"));
  try {
    const registry = new LocatorRegistry(path.join(directory, "registry.json"));
    const resolver = new LocatorResolver(registry);
    const resolved = await resolver.resolve({
      target: "Business",
      pageKey: "cabin",
      snapshot: [
        '- tab "Business" [ref=tab-business]',
        '- radio "Business" [ref=radio-business]',
        '- generic [ref=label-business]: Business',
      ].join("\n"),
      browser: {} as PlaywrightMcpClient,
      sensitiveValues: ["Business"],
    });
    const clicked = await resolver.resolve({
      target: "Business",
      pageKey: "cabin",
      snapshot: [
        '- tab "Business" [ref=tab-business]',
        '- radio "Business" [ref=radio-business]',
      ].join("\n"),
      browser: {} as PlaywrightMcpClient,
      sensitiveValues: ["Business"],
      action: "click",
    });

    assert.equal(resolved.mcpRef, "radio-business");
    assert.equal(resolved.descriptor.strategy, "role");
    assert.equal(resolved.descriptor.role, "radio");
    assert.equal(clicked.mcpRef, "tab-business");
    assert.equal(clicked.descriptor.role, "tab");
    assert.equal((await registry.list()).some(record => record.target.includes("Business")), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("resolves passenger increment controls within their labeled row and reuses a fresh ref", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "locator-resolver-"));
  try {
    const resolver = new LocatorResolver(new LocatorRegistry(path.join(directory, "registry.json")));
    const snapshot = [
      '- generic [ref=row-adults]:',
      '  - generic [ref=label-adults]: Adults',
      '  - tab "-" [disabled] [ref=minus-adults]',
      '  - textbox: "1"',
      '  - tab "+" [ref=plus-adults]',
      '- generic [ref=row-infants]:',
      '  - generic [ref=label-infants]: Infants',
      '  - tab "+" [ref=plus-infants]',
    ].join("\n");
    const input = {
      target: "Increase adults",
      pageKey: "passengers",
      snapshot,
      browser: {} as PlaywrightMcpClient,
    };

    const first = await resolver.resolve(input);
    const reused = await resolver.resolve(input);

    assert.equal(first.mcpRef, "plus-adults");
    assert.equal(first.descriptor.scope, "Adults");
    assert.equal(reused.mcpRef, "plus-adults");
    assert.equal(reused.reused, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("resolves the visible Guests and Cabin tile by its snapshot text alias", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "locator-resolver-"));
  try {
    const resolver = new LocatorResolver(new LocatorRegistry(path.join(directory, "registry.json")));
    const resolved = await resolver.resolve({
      target: "Guests & Cabin",
      pageKey: "flight-search",
      snapshot: [
        '- generic [ref=tile] [cursor=pointer]:',
        '  - generic [ref=label]: Guests and Cabin',
        '  - generic [ref=summary]: Add',
      ].join("\n"),
      browser: {} as PlaywrightMcpClient,
    });

    assert.equal(resolved.mcpRef, "label");
    assert.equal(resolved.descriptor.strategy, "text");
    assert.equal(resolved.descriptor.value, "Guests and Cabin");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
