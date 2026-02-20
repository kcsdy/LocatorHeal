import { NextResponse } from "next/server";
import { exchangeCodeForToken, fetchGitHubUser } from "@/lib/github";

// Receives the OAuth callback from GitHub.
// Steps:
// 1. Validate the `state` parameter against the cookie
// 2. Exchange the `code` for an access token by calling GitHub API
// 3. Fetch authenticated user data
// 4. Store the token securely (HTTP-only cookie)
// 5. Redirect to homepage

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Check for user denying authorization
    if (error) {
      const errorDescription = url.searchParams.get("error_description") || error;
      console.error("OAuth error from GitHub:", errorDescription);
      return NextResponse.redirect(
        new URL(`/?oauth_error=${encodeURIComponent(errorDescription)}`, url.origin)
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state parameter" },
        { status: 400 }
      );
    }

    // Validate state against the cookie to prevent CSRF
    const storedState = (await req.headers).get("cookie")?.split("; ").find((c) =>
      c.startsWith("oauth_state=")
    )?.substring("oauth_state=".length);

    // Parse cookies manually
    const cookies = req.headers.get("cookie") || "";
    const cookieMap = new Map<string, string>();
    cookies.split("; ").forEach((cookie) => {
      const [key, value] = cookie.split("=");
      if (key && value) cookieMap.set(key, decodeURIComponent(value));
    });
    const storedStateCookie = cookieMap.get("oauth_state");

    if (!storedStateCookie || storedStateCookie !== state) {
      console.error("State mismatch or missing state cookie", {
        stored: storedStateCookie,
        received: state,
      });
      return NextResponse.json({ error: "State validation failed (CSRF)" }, { status: 403 });
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code, state);

    if (!tokenData.access_token) {
      return NextResponse.json(
        { error: "Failed to obtain access token" },
        { status: 500 }
      );
    }

    // Fetch user profile
    const user = await fetchGitHubUser(tokenData.access_token);

    // Store token in HTTP-only cookie
    const res = NextResponse.redirect(new URL("/", url.origin));
    res.cookies.set("github_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Optionally store basic user info in a separate cookie for client-side display
    res.cookies.set(
      "github_user",
      JSON.stringify({ login: user.login, avatar_url: user.avatar_url }),
      {
        httpOnly: false, // Allow client to read for display
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    );

    // Clear the state cookie
    res.cookies.delete("oauth_state");

    console.log(`OAuth success for user: ${user.login}`);
    return res;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("OAuth callback error:", errorMessage);
    return NextResponse.redirect(
      new URL(`/?oauth_error=${encodeURIComponent(errorMessage)}`, new URL(req.url).origin)
    );
  }
}
