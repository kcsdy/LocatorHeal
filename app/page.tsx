"use client";

import { useState, useEffect } from "react";
import OAuthModal from "@/src/components/OAuthModal";
import RunCard from "@/src/components/RunCard";
import Results from "@/src/components/Results";
import { mockRun } from "@/src/lib/mock";
import type { RunResult, ScanConfig } from "@/src/lib/types";

export default function Home() {
  const year = new Date().getFullYear();

  const [oauthOpen, setOauthOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [mounted, setMounted] = useState(false);

  const [writeAccess, setWriteAccess] = useState(true);

  const [config, setConfig] = useState<ScanConfig>({
    repoUrl: "",
    feature: "Auto-heal Locators",
    branch: "main",
    output: "Create Pull Request (recommended)",
    framework: "Auto-detect",
    language: "TypeScript",
    writeAccess: true,
  });

  // Check if user is already authenticated on mount
  useEffect(() => {
    setMounted(true);
    // Check if github_user cookie exists
    const userCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("github_user="))
      ?.substring("github_user=".length);

    if (userCookie) {
      try {
        const user = JSON.parse(decodeURIComponent(userCookie));
        if (user.login) {
          setConnected(true);
          console.log("User already authenticated:", user.login);
        }
      } catch (err) {
        console.error("Failed to parse github_user cookie:", err);
      }
    }
  }, []);

  function openOAuth() {
    setOauthOpen(true);
  }

  async function disconnect() {
    // Clear cookies by calling logout endpoint
    await fetch("/api/auth/logout");
    setConnected(false);
    setResult(null);
  }

  function authorizeMock() {
    // Redirect to backend OAuth start endpoint which will initiate the
    // GitHub OAuth flow. We include the selected writeAccess flag so the
    // server can request appropriate scopes.
    const param = writeAccess ? "1" : "0";
    const url = `/api/auth/start?writeAccess=${param}`;
    // close modal before navigation
    setOauthOpen(false);
    window.location.href = url;
  }

  function runMock() {
    if (!connected) {
      openOAuth();
      return;
    }
    if (!config.repoUrl.trim()) return;

    setRunning(true);
    setResult(null);

    window.setTimeout(() => {
      const res = mockRun({ ...config, writeAccess });
      setResult(res);
      setRunning(false);
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 900);
  }

  return (
    <div className="wrap">
      <OAuthModal
        open={oauthOpen}
        writeAccess={writeAccess}
        onToggleWriteAccess={setWriteAccess}
        onClose={() => setOauthOpen(false)}
        onAuthorize={authorizeMock}
      />

      <header className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden="true" />
          <div className="brandText">LocatorHeal</div>
        </div>

        <nav className="nav">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <a href="#docs">Docs</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <div className="actions">
          {connected ? (
            <button className="btn" type="button" onClick={disconnect}>
              Connected ✓ (Disconnect)
            </button>
          ) : (
            <button className="btn ghost" type="button" onClick={openOAuth}>
              Sign in
            </button>
          )}
          <button className="btn primary" type="button" onClick={openOAuth}>
            {connected ? "Manage GitHub" : "Connect GitHub"}
          </button>
        </div>
      </header>

      <main className="hero">
        <section className="panel heroLeft">
          <div className="kicker">
            <span className="dot" aria-hidden="true" />
            Works with Page Object Model frameworks
          </div>

          <h1>Auto-heal broken locators from your GitHub repo.</h1>

          <p className="lead">
            Paste your repository link, scan your pages, and automatically repair fragile selectors.
            Generate a reviewable pull request or export a healing report on demand.
          </p>

          <div className="cta">
            <button className="btn primary" type="button" onClick={openOAuth}>
              Connect GitHub Repo
            </button>
            <button className="btn" type="button" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
              See how it works
            </button>
          </div>

          <div className="mini">
            <span>✅ PR-based changes</span>
            <span>🔍 Locator audit</span>
            <span>🧩 POM discovery</span>
            <span>🛡️ Read-only by default</span>
          </div>
        </section>

        <aside className="panel heroRight">
          <RunCard
            connected={connected}
            isRunning={running}
            config={config}
            onChange={(patch) => setConfig((c) => ({ ...c, ...patch }))}
            onRun={runMock}
            onConnect={openOAuth}
          />
        </aside>
      </main>

      <Results result={result} output={config.output} />

      <section id="how" className="section">
        <h2>How it works</h2>
        <div className="grid3">
          <div className="card">
            <div className="icon">1</div>
            <h3>Connect repo</h3>
            <p>Paste a GitHub link or sign in to browse repositories.</p>
          </div>

          <div className="card">
            <div className="icon">2</div>
            <h3>Scan pages</h3>
            <p>Detect Page Objects, locators, and usage across test flows.</p>
          </div>

          <div className="card">
            <div className="icon">3</div>
            <h3>Heal safely</h3>
            <p>Generate a PR or patch with resilient selector updates and confidence scoring.</p>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <h2>Features built for test teams</h2>
        <div className="grid3">
          <div className="card">
            <div className="icon">⚡</div>
            <h3>Auto-heal locators</h3>
            <p>Replace brittle selectors with safer strategies (css/xpath/aria/text).</p>
          </div>

          <div className="card">
            <div className="icon">🧠</div>
            <h3>Confidence scoring</h3>
            <p>Every change includes a confidence score and "why this is safer" reasoning.</p>
          </div>

          <div className="card">
            <div className="icon">🔁</div>
            <h3>Flake insights</h3>
            <p>Track recurring breakages and highlight fragile pages/components.</p>
          </div>
        </div>
      </section>

      <section id="security" className="section">
        <h2>Security & controls</h2>
        <div className="strip">
          <div className="pill">Read-only by default</div>
          <div className="pill">Optional PR write access</div>
          <div className="pill">Secrets never stored</div>
          <div className="pill">Isolated scan workers</div>
          <div className="pill">Audit logs</div>
        </div>
      </section>

      <footer className="footer">
        <div>© {year} LocatorHeal. All rights reserved.</div>
        <div className="footerLinks">
          <a id="docs" href="#docs">Docs</a>
          <a id="pricing" href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
