import { cookies } from "next/headers";

/**
 * Get GitHub access token from the HTTP-only cookie (server-side only)
 */
export async function getGitHubToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("github_token")?.value || null;
}

/**
 * Get authenticated GitHub user info from cookie (for client-side display)
 */
export async function getGitHubUserInfo(): Promise<{ login: string; avatar_url: string } | null> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("github_user")?.value;
  if (!userCookie) return null;
  try {
    return JSON.parse(userCookie);
  } catch {
    return null;
  }
}

/**
 * Clear GitHub auth cookies (logout)
 */
export async function clearGitHubAuth() {
  const cookieStore = await cookies();
  cookieStore.delete("github_token");
  cookieStore.delete("github_user");
}