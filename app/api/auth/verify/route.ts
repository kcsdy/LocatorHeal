import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { refreshGitHubToken } from "@/lib/github";
import { clearAuthCookies } from "@/lib/auth-cookies";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const github_token = cookieStore.get("github_token")?.value;
    const github_user = cookieStore.get("github_user")?.value;
    const token_expires_at = cookieStore.get("token_expires_at")?.value;

    // Check if all required auth cookies exist
    if (!github_token || !github_user || !token_expires_at) {
      return NextResponse.json({
        authenticated: false,
        message: "No authentication data found",
      });
    }

    // Parse user data from cookie
    let user;
    try {
      user = JSON.parse(github_user);
    } catch (err) {
      console.error("Failed to parse github_user cookie", err);
      const res = NextResponse.json({
        authenticated: false,
        message: "Invalid authentication data",
      });
      return clearAuthCookies(res);
    }

    // Calculate token expiry
    const now = Date.now();
    const expiresAt = new Date(token_expires_at).getTime();
    const timeLeft = expiresAt - now;

    // If token already expired, clear cookies and return unauthenticated
    if (timeLeft <= 0) {
      const res = NextResponse.json({
        authenticated: false,
        message: "Token expired, please login again",
      });
      return clearAuthCookies(res);
    }

    // If token expiring within 1 hour, attempt to refresh
    if (timeLeft < 60 * 60 * 1000) {
      const refreshToken = cookieStore.get("github_refresh_token")?.value;

      if (refreshToken) {
        try {
          // Call GitHub to refresh the access token
          const newTokenData = await refreshGitHubToken(refreshToken);
          const expiresIn = newTokenData.expires_in || 3600; // Default to 1 hour if not provided

          // Create response with updated token info
          const res = NextResponse.json({
            authenticated: true,
            user: user,
            token_expires_in: expiresIn,
            refreshed: true,
          });

          // Update github_token cookie with new token
          res.cookies.set("github_token", newTokenData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: expiresIn,
          });

          // Update token_expires_at with new expiry time
          const newExpiryTime = new Date(
            Date.now() + expiresIn * 1000
          ).toISOString();
          res.cookies.set("token_expires_at", newExpiryTime, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          });

          return res;
        } catch (err) {
          console.error("Failed to refresh token:", err);
          // Refresh failed, but current token still valid
          // Return current token but warn frontend
          return NextResponse.json({
            authenticated: true,
            user: user,
            token_expires_in: Math.floor(timeLeft / 1000),
            warning: "Token refresh failed, using current token",
          });
        }
      }
    }

    // Token still valid and not expiring soon
    return NextResponse.json({
      authenticated: true,
      user: user,
      token_expires_in: Math.floor(timeLeft / 1000), // Convert ms to seconds
    });
  } catch (err) {
    console.error("Verify endpoint error:", err);
    return NextResponse.json(
      { authenticated: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
