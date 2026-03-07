"use client";

import type { RunResult, LocatorResult } from "@/src/lib/types";

const STATUS_LABEL: Record<string, string> = {
  broken: "BROKEN",
  warning: "WARN",
  working: "OK",
};

const STATUS_CLASS: Record<string, string> = {
  broken: "locatorBroken",
  warning: "locatorWarn",
  working: "locatorOk",
};

function LocatorRow({ locator }: { locator: LocatorResult }) {
  return (
    <div className="locatorRow">
      <div className={`locatorBadge ${STATUS_CLASS[locator.status]}`}>
        {STATUS_LABEL[locator.status]}
      </div>
      <div className="locatorMain">
        <div className="locatorSelector">{locator.selector}</div>
        <div className="locatorMeta">
          {locator.file}:{locator.line} &middot; {locator.type}
        </div>
        <div className="locatorReason">{locator.reason}</div>
        {locator.suggestedFix && (
          <div className="locatorFix">
            Suggested fix: <code>{locator.suggestedFix}</code>
          </div>
        )}
      </div>
      <div className="locatorConfidence">{locator.confidence}%</div>
    </div>
  );
}

export default function Results({
  result,
  output,
  progressLog,
}: {
  result: RunResult | null;
  output: string;
  progressLog: string[];
}) {
  return (
    <section className="section" id="results">
      <div className="resultsHeader">
        <h2 style={{ margin: 0 }}>Results</h2>
        <div className="resultsMeta">
          {result ? (
            <>
              <span className="pill small">Run ID: {result.runId}</span>
              <span className="pill small">Confidence: {result.confidence}%</span>
            </>
          ) : (
            <span className="mutedSmall">Run a scan to see output here.</span>
          )}
        </div>
      </div>

      {/* Progress log shown while running */}
      {progressLog.length > 0 && !result && (
        <div className="progressLog">
          {progressLog.map((msg, i) => (
            <div key={i} className="progressStep">
              <span className="progressDot" />
              {msg}
            </div>
          ))}
          <div className="progressStep running">
            <span className="progressSpinner" />
            Working…
          </div>
        </div>
      )}

      {!result && progressLog.length === 0 && (
        <div className="emptyState">
          <div className="emptyIcon">📦</div>
          <div>
            <div className="emptyTitle">No results yet</div>
            <div className="emptyText">
              Paste a repo URL &amp; website URL, connect GitHub, and click <b>Run</b>.
            </div>
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="resultsGrid">
            <div className="card">
              <div className="cardTop">
                <div className="icon">🧾</div>
                <div>
                  <h3 style={{ margin: 0 }}>Summary</h3>
                  <p className="mutedP" style={{ marginTop: 6 }}>
                    {result.summary}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardTop">
                <div className="icon">✅</div>
                <div style={{ width: "100%" }}>
                  <h3 style={{ margin: 0 }}>Confidence score</h3>
                  <div className="bar" aria-label="confidence score">
                    <div className="barFill" style={{ width: `${result.confidence}%` }} />
                  </div>
                  <p className="mutedP" style={{ marginTop: 8 }}>
                    Higher confidence means selector matches were consistent across signals.
                  </p>
                </div>
              </div>
            </div>

            {result.prUrl && (
              <div className="card">
                <div className="cardTop">
                  <div className="icon">🔗</div>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {output.includes("Pull Request") ? "Pull request" : "Run link"}
                    </h3>
                    <p className="mutedP" style={{ marginTop: 6 }}>
                      <a className="link" href={result.prUrl} target="_blank" rel="noreferrer">
                        {result.prUrl}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Locator Analysis Table */}
          <div className="locatorSection">
            <div className="changedHeader">
              <h3 style={{ margin: 0 }}>Locator Analysis</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <span className="pill small locatorBroken">{result.brokenCount} broken</span>
                <span className="pill small locatorOk">{result.workingCount} working</span>
                <span className="pill small locatorWarn">
                  {result.totalLocators - result.brokenCount - result.workingCount} warnings
                </span>
              </div>
            </div>

            <div className="locatorList">
              {result.locators.length === 0 ? (
                <p className="mutedP" style={{ padding: "12px 0" }}>
                  No locators found.
                </p>
              ) : (
                result.locators.map((l, i) => <LocatorRow key={i} locator={l} />)
              )}
            </div>
          </div>

          <div className="changedFiles">
            <div className="changedHeader">
              <h3 style={{ margin: 0 }}>Scanned files</h3>
              <span className="pill small">{result.changedFiles.length} files</span>
            </div>
            <div className="fileList">
              {result.changedFiles.map((f) => (
                <div key={f.path} className="fileRow">
                  <div className={`fileBadge ${f.status}`}>{f.status}</div>
                  <div className="fileMain">
                    <div className="filePath">{f.path}</div>
                    <div className="fileSummary">{f.summary}</div>
                  </div>
                  <div className="fileDelta">{f.changes} issues</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
