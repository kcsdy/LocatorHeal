/**
 * AI-powered locator analysis using Claude API.
 * Two-step process:
 *   1. Extract locators from test code
 *   2. Cross-reference locators against live DOM snapshot
 */

import Anthropic from "@anthropic-ai/sdk";
import type { LocatorResult } from "@/src/lib/types";
import type { RepoFile } from "./github-fetcher";
import type { DOMSnapshot, LocatorTestResult } from "./playwright-mcp-client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface RawLocator {
  selector: string;
  type: "css" | "xpath" | "id" | "data-testid" | "text" | "other";
  file: string;
  line: number;
}

export async function extractLocatorsFromCode(
  files: RepoFile[],
  framework: string,
  language: string
): Promise<RawLocator[]> {
  // Truncate large files to stay within token limits
  const truncated = files.map((f) => ({
    path: f.path,
    content: f.content.slice(0, 4000),
  }));

  const fileBlock = truncated
    .map((f) => `=== ${f.path} ===\n${f.content}`)
    .join("\n\n");

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a test automation expert. Analyze these ${framework} test files written in ${language} and extract ALL locators/selectors used to find UI elements.

${fileBlock}

Return a JSON array of locator objects. Each object must have:
- selector: the exact selector string (e.g. "#login-btn", "//button[@id='submit']", "[data-testid='form']")
- type: one of "css", "xpath", "id", "data-testid", "text", "other"
- file: the file path
- line: approximate line number (1 if unknown)

Rules:
- Include CSS selectors, XPath expressions, IDs, data-testid attributes, text-based selectors
- For Playwright: getByRole, getByText, getByTestId etc → extract the underlying selector value
- For Selenium: By.id(), By.cssSelector(), By.xpath() etc → extract the value
- For Cypress: cy.get(), cy.contains() etc → extract the value
- Deduplicate identical selectors from the same file
- Only return the JSON array, no other text`,
      },
    ],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Extract JSON from the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]) as RawLocator[];
  } catch {
    return [];
  }
}

export async function analyzeLocators(
  rawLocators: RawLocator[],
  domSnapshot: DOMSnapshot,
  playwrightResults: LocatorTestResult[]
): Promise<LocatorResult[]> {
  if (rawLocators.length === 0) return [];

  // Build a map of playwright results for quick lookup
  const pwMap = new Map(playwrightResults.map((r) => [r.selector, r]));

  // Build input for Claude
  const locatorList = rawLocators
    .map((l, i) => {
      const pw = pwMap.get(l.selector);
      const status = pw ? (pw.found ? "FOUND" : "NOT FOUND") : "NOT TESTED";
      return `${i + 1}. selector="${l.selector}" type=${l.type} file=${l.file}:${l.line} playwright=${status}${pw?.elementInfo ? ` matchedElement=${pw.elementInfo}` : ""}`;
    })
    .join("\n");

  // Trim DOM snapshot to avoid token overload
  const domTrimmed = domSnapshot.raw.slice(0, 8000);

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are a senior QA engineer specializing in test automation. You have:

1. A list of locators from a test framework with their Playwright validation results
2. The live DOM snapshot of the website being tested

Your job is to analyze each locator and return a detailed health assessment.

## Locators from test framework:
${locatorList}

## Live website DOM snapshot (from ${domSnapshot.url}):
${domTrimmed}

For each locator, return a JSON object with:
- selector: exact selector string (unchanged)
- type: unchanged
- file: unchanged
- line: unchanged
- status: "broken" | "working" | "warning"
  - broken: NOT FOUND and no reasonable match in DOM
  - working: FOUND or clearly present in DOM
  - warning: FOUND but fragile (e.g. brittle XPath, position-based, uses dynamic classes)
- confidence: 0-100 (how confident you are in your assessment)
- suggestedFix: if broken or warning, suggest a better selector based on the DOM (omit if working and not fragile)
- reason: 1-2 sentence explanation of your assessment

Return ONLY a JSON array of these objects, no other text.`,
      },
    ],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    // Fallback: return raw locators with unknown status
    return rawLocators.map((l) => ({
      ...l,
      status: "warning" as const,
      confidence: 50,
      reason: "Could not analyze — AI response was malformed.",
    }));
  }

  try {
    return JSON.parse(jsonMatch[0]) as LocatorResult[];
  } catch {
    return rawLocators.map((l) => ({
      ...l,
      status: "warning" as const,
      confidence: 50,
      reason: "Could not parse analysis results.",
    }));
  }
}
