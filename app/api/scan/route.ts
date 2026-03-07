import { cookies } from "next/headers";
import type { ScanConfig, ScanEvent, RunResult } from "@/src/lib/types";
import { fetchTestFiles } from "@/lib/github-fetcher";
import { extractLocatorsFromCode, analyzeLocators } from "@/lib/ai-analyzer";
import {
  createPlaywrightClient,
  getDOMSnapshot,
  testLocator,
  closeClient,
} from "@/lib/playwright-mcp-client";

function encode(event: ScanEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: Request) {
  const body = await req.json() as { config: ScanConfig };
  const { config } = body;

  // Read GitHub token from cookie (set during OAuth flow)
  const cookieStore = await cookies();
  const githubToken = cookieStore.get("gh_token")?.value;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: ScanEvent) => {
        controller.enqueue(new TextEncoder().encode(encode(event)));
      };

      let playwrightClient = null;

      try {
        // Validate inputs
        if (!config.repoUrl?.trim()) throw new Error("GitHub repository URL is required.");
        if (!config.websiteUrl?.trim()) throw new Error("Website URL is required.");
        if (!githubToken) throw new Error("GitHub is not connected. Please connect GitHub first.");
        if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured.");

        // Step 1: Fetch test files from GitHub
        emit({ type: "step", message: "Fetching test files from GitHub repository..." });
        const files = await fetchTestFiles(githubToken, config.repoUrl, config.branch || "main");

        if (files.length === 0) {
          throw new Error(
            "No test files found in the repository. Make sure the repo contains spec/test/page object files."
          );
        }

        emit({ type: "step", message: `Found ${files.length} test file(s). Extracting locators with AI...` });

        // Step 2: Extract locators from test code using Claude
        const rawLocators = await extractLocatorsFromCode(files, config.framework, config.language);

        if (rawLocators.length === 0) {
          throw new Error("No locators found in the test files.");
        }

        emit({ type: "step", message: `Extracted ${rawLocators.length} locator(s). Launching browser to crawl website...` });

        // Step 3: Start Playwright MCP and crawl the website
        playwrightClient = await createPlaywrightClient();
        const domSnapshot = await getDOMSnapshot(playwrightClient, config.websiteUrl);

        emit({ type: "step", message: `Website crawled. Testing each locator against the live DOM...` });

        // Test each locator against the live page
        const playwrightResults = await Promise.allSettled(
          rawLocators.map((l) => testLocator(playwrightClient!, l.selector, l.type))
        );

        const resolvedPwResults = playwrightResults
          .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof testLocator>>> => r.status === "fulfilled")
          .map((r) => r.value);

        emit({ type: "step", message: "Analyzing locators with AI — cross-referencing against DOM..." });

        // Step 4: Claude cross-references locators vs DOM
        const analyzedLocators = await analyzeLocators(rawLocators, domSnapshot, resolvedPwResults);

        const brokenCount = analyzedLocators.filter((l) => l.status === "broken").length;
        const workingCount = analyzedLocators.filter((l) => l.status === "working").length;
        const warningCount = analyzedLocators.filter((l) => l.status === "warning").length;
        const avgConfidence =
          analyzedLocators.length > 0
            ? Math.round(analyzedLocators.reduce((s, l) => s + l.confidence, 0) / analyzedLocators.length)
            : 0;

        const result: RunResult = {
          runId: `RUN-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
          confidence: avgConfidence,
          prUrl: "",
          summary: `Analyzed ${analyzedLocators.length} locators across ${files.length} test file(s). Found ${brokenCount} broken, ${warningCount} warnings, ${workingCount} working.`,
          changedFiles: files.map((f) => ({
            path: f.path,
            changes: analyzedLocators.filter((l) => l.file === f.path && l.status !== "working").length,
            summary: `${analyzedLocators.filter((l) => l.file === f.path && l.status === "broken").length} broken, ${analyzedLocators.filter((l) => l.file === f.path && l.status === "working").length} working`,
            status: "modified" as const,
          })),
          locators: analyzedLocators,
          totalLocators: analyzedLocators.length,
          brokenCount,
          workingCount,
        };

        emit({ type: "result", data: result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        emit({ type: "error", message });
      } finally {
        if (playwrightClient) await closeClient(playwrightClient);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
