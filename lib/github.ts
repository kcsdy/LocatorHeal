/**
 * GitHub OAuth utilities
 */

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  state: string
): Promise<TokenResponse> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GitHub OAuth credentials");
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      state,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  return data as TokenResponse;
}

/**
 * Fetch authenticated user profile from GitHub
 */
export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub user: ${response.statusText}`);
  }

  return response.json() as Promise<GitHubUser>;
}
