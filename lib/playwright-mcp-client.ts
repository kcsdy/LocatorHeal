/**
 * Playwright MCP client — spawns a headless Playwright MCP server as a subprocess
 * and uses it to crawl a website and test locators against the live DOM.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface LocatorTestResult {
  selector: string;
  found: boolean;
  matchCount: number;
  elementInfo?: string;
}

export interface DOMSnapshot {
  raw: string;
  url: string;
}

export async function createPlaywrightClient(): Promise<Client> {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["@playwright/mcp@latest", "--headless"],
  });

  const client = new Client({ name: "locatorheal", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

export async function getDOMSnapshot(client: Client, url: string): Promise<DOMSnapshot> {
  // Navigate to the page
  await client.callTool({
    name: "browser_navigate",
    arguments: { url },
  });

  // Get accessibility snapshot (structured DOM with all elements and attributes)
  const snapshotResult = await client.callTool({
    name: "browser_snapshot",
    arguments: {},
  });

  const contentItems = snapshotResult.content as { type: string; text?: string }[] | undefined;
  const raw = contentItems?.map((c) => (c.type === "text" ? c.text : "")).join("\n") ?? "";

  return { raw, url };
}

export async function testLocator(
  client: Client,
  selector: string,
  type: string
): Promise<LocatorTestResult> {
  try {
    // Use evaluate to test if selector exists in the DOM
    const result = await client.callTool({
      name: "browser_evaluate",
      arguments: {
        expression: buildEvaluateExpression(selector, type),
      },
    });

    const resultItems = result.content as { type: string; text?: string }[] | undefined;
    const text = resultItems?.map((c) => (c.type === "text" ? c.text : "")).join("") ?? "";

    const parsed = JSON.parse(text) as { found: boolean; count: number; info?: string };
    return {
      selector,
      found: parsed.found,
      matchCount: parsed.count,
      elementInfo: parsed.info,
    };
  } catch {
    // If evaluate fails, try a basic snapshot-based check
    return { selector, found: false, matchCount: 0 };
  }
}

function buildEvaluateExpression(selector: string, type: string): string {
  if (type === "xpath") {
    return `
      (() => {
        try {
          const result = document.evaluate(${JSON.stringify(selector)}, document, null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          const count = result.snapshotLength;
          const info = count > 0 ? result.snapshotItem(0)?.tagName + (result.snapshotItem(0)?.id ? '#' + result.snapshotItem(0).id : '') : undefined;
          return JSON.stringify({ found: count > 0, count, info });
        } catch(e) { return JSON.stringify({ found: false, count: 0 }); }
      })()
    `;
  }
  // CSS selector
  return `
    (() => {
      try {
        const els = document.querySelectorAll(${JSON.stringify(selector)});
        const count = els.length;
        const first = els[0];
        const info = first ? first.tagName.toLowerCase() + (first.id ? '#' + first.id : '') + (first.className ? '.' + first.className.split(' ')[0] : '') : undefined;
        return JSON.stringify({ found: count > 0, count, info });
      } catch(e) { return JSON.stringify({ found: false, count: 0 }); }
    })()
  `;
}

export async function closeClient(client: Client): Promise<void> {
  try {
    await client.close();
  } catch {
    // ignore cleanup errors
  }
}
