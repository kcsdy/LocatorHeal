import { NextResponse } from "next/server";
import crypto from "crypto";

// Initiates GitHub OAuth flow.
// Steps:
// 1. Generate a secure random `state` value
// 2. Store `state` in an HTTP-only cookie (short lived)
// 3. Redirect the browser to GitHub's /login/oauth/authorize with the state

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const writeAccess = url.searchParams.get("writeAccess") === "1";

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "Missing GITHUB_CLIENT_ID env" }, { status: 500 });
    }

    // Build a callback URL. If GITHUB_REDIRECT_URI is set use it, otherwise
    // default to the current origin + our callback path.
    const redirectUri = process.env.GITHUB_REDIRECT_URI || `${url.origin}/api/auth/callback`;

    // Create a secure random state value
    const state = crypto.randomBytes(24).toString("hex");

    // Choose scopes. NOTE: creating PRs requires `repo` scope. For read-only
    // scans you may use narrower scopes; adjust as needed.
    const scope = writeAccess ? "repo" : "read:user";

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      allow_signup: "false",
    });

    const authorizeUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    const res = NextResponse.redirect(authorizeUrl);

    // Store state in an HTTP-only cookie so we can validate it in the callback.
    // Keep it short-lived (e.g. 5 minutes).
    res.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: "Failed to start OAuth" }, { status: 500 });
  }
}
