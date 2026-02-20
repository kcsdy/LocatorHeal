"use client";

import type { RunResult } from "@/src/lib/types";

export default function Results({ result, output }: { result: RunResult | null; output: string }) {
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

      {!result ? (
        <div className="emptyState">
          <div className="emptyIcon">📦</div>
          <div>
            <div className="emptyTitle">No results yet</div>
            <div className="emptyText">
              Paste a repo URL, connect GitHub, and click <b>Run</b>.
            </div>
          </div>
        </div>
      ) : (
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

            <div className="card">
              <div className="cardTop">
                <div className="icon">🔗</div>
                <div>
                  <h3 style={{ margin: 0 }}>{output.includes("Pull Request") ? "Pull request" : "Run link"}</h3>
                  <p className="mutedP" style={{ marginTop: 6 }}>
                    <a className="link" href={result.prUrl} target="_blank" rel="noreferrer">
                      {result.prUrl}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="changedFiles">
            <div className="changedHeader">
              <h3 style={{ margin: 0 }}>Changed files</h3>
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
                  <div className="fileDelta">{f.changes} changes</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
