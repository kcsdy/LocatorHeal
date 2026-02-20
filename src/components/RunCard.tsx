"use client";

import type { ScanConfig } from "@/src/lib/types";

export default function RunCard({
  connected,
  isRunning,
  config,
  onChange,
  onRun,
  onConnect,
}: {
  connected: boolean;
  isRunning: boolean;
  config: ScanConfig;
  onChange: (patch: Partial<ScanConfig>) => void;
  onRun: () => void;
  onConnect: () => void;
}) {
  return (
    <div className="runCard">
      <div className="runHeader">
        <div>
          <p className="runTitle">Run a Scan</p>
          <p className="runSub">Provide a GitHub repo URL, choose a feature, and run.</p>
        </div>
        <div className={`statusPill ${connected ? "ok" : "warn"}`}>
          {connected ? "GitHub: Connected" : "GitHub: Not connected"}
        </div>
      </div>

      <label htmlFor="repo">GitHub repository URL</label>
      <input
        id="repo"
        placeholder="https://github.com/org/repo"
        value={config.repoUrl}
        onChange={(e) => onChange({ repoUrl: e.target.value })}
      />

      <div className="row">
        <div>
          <label htmlFor="feature">Feature</label>
          <select id="feature" value={config.feature} onChange={(e) => onChange({ feature: e.target.value })}>
            <option>Auto-heal Locators</option>
            <option>Locator Audit Report</option>
            <option>POM Coverage Scan</option>
          </select>
        </div>

        <div>
          <label htmlFor="branch">Branch</label>
          <select id="branch" value={config.branch} onChange={(e) => onChange({ branch: e.target.value })}>
            <option>main</option>
            <option>develop</option>
            <option>custom…</option>
          </select>
        </div>
      </div>

      <div className="row">
        <div>
          <label htmlFor="framework">Framework detected</label>
          <select id="framework" value={config.framework} onChange={(e) => onChange({ framework: e.target.value })}>
            <option>Auto-detect</option>
            <option>Selenium</option>
            <option>Playwright</option>
            <option>Cypress</option>
          </select>
        </div>

        <div>
          <label htmlFor="language">Language</label>
          <select id="language" value={config.language} onChange={(e) => onChange({ language: e.target.value })}>
            <option>TypeScript</option>
            <option>JavaScript</option>
            <option>Java</option>
            <option>Python</option>
            <option>C#</option>
          </select>
        </div>
      </div>

      <label htmlFor="output">Output</label>
      <select id="output" value={config.output} onChange={(e) => onChange({ output: e.target.value })}>
        <option>Create Pull Request (recommended)</option>
        <option>Patch File (diff)</option>
        <option>Report Only (no changes)</option>
      </select>

      <div className="runActions">
        <button className="btn primary" type="button" onClick={onRun} disabled={!config.repoUrl.trim() || isRunning}>
          {isRunning ? "Running…" : "Run"}
        </button>
        <button className="btn" type="button" onClick={onConnect}>
          {connected ? "Manage GitHub" : "Connect GitHub"}
        </button>
      </div>

      {!connected && (
        <div className="hint" style={{ marginTop: 10 }}>
          You're not connected.{" "}
          <button className="linkBtn" type="button" onClick={onConnect}>
            Connect GitHub
          </button>{" "}
          to run scans.
        </div>
      )}
    </div>
  );
}
