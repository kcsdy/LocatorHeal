import type { RunResult, ScanConfig } from "./types";

export function mockRun(config: ScanConfig): RunResult {
  const confidence =
    config.feature === "Auto-heal Locators"
      ? 86
      : config.feature === "Locator Audit Report"
      ? 92
      : 78;

  const writeAllowed = config.writeAccess && config.output.includes("Pull Request");
  const prUrl = writeAllowed
    ? "https://github.com/org/repo/pull/42"
    : "https://github.com/org/repo/actions/runs/123456789";

  return {
    runId: `RUN-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
    confidence,
    prUrl,
    summary:
      config.feature === "Auto-heal Locators"
        ? "Updated fragile locators with resilient strategies and added fallback selectors."
        : config.feature === "Locator Audit Report"
        ? "Generated locator health report with flaky hotspot pages and selector risk scoring."
        : "Scanned Page Objects and generated a coverage map of referenced pages/components.",
    changedFiles:
      config.feature === "Locator Audit Report"
        ? [
            { path: "reports/locator-audit.json", changes: 1, summary: "New audit report.", status: "added" },
            { path: "reports/locator-audit.html", changes: 1, summary: "HTML report output.", status: "added" },
          ]
        : [
            { path: "pages/LoginPage.ts", changes: 4, summary: "Healed selectors for login flow.", status: "modified" },
            { path: "pages/DashboardPage.ts", changes: 2, summary: "Replaced brittle XPath with safer fallback.", status: "modified" },
            { path: "healing/locator-map.json", changes: 1, summary: "Saved locator mapping metadata.", status: "added" },
          ],
  };
}
