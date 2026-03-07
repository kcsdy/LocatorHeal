/**
 * GitHub REST API helpers for fetching test files from a repository.
 */

const TEST_FILE_PATTERNS = [
  /\.spec\.(ts|js|py|java|cs)$/i,
  /\.test\.(ts|js|py|java|cs)$/i,
  /Page\.(ts|js|py|java|cs)$/i,
  /\.page\.(ts|js|py|java|cs)$/i,
  /\/pages\//i,
  /\/pageobjects\//i,
  /\/page-objects\//i,
  /\/pom\//i,
  /\/selectors\//i,
  /\/locators\//i,
  /\/fixtures\//i,
  /cypress\/e2e\//i,
  /playwright\/tests\//i,
  /selenium\//i,
];

export interface RepoFile {
  path: string;
  content: string;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: match[1], repo: match[2] };
}

function isTestFile(path: string): boolean {
  return TEST_FILE_PATTERNS.some((pattern) => pattern.test(path));
}

export async function fetchRepoTree(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<string[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch repo tree: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as { tree: { path: string; type: string }[]; truncated: boolean };

  return data.tree
    .filter((item) => item.type === "blob" && isTestFile(item.path))
    .map((item) => item.path)
    .slice(0, 50); // cap at 50 files to avoid token overload
}

export async function fetchFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as { content: string; encoding: string };

  if (data.encoding !== "base64") {
    throw new Error(`Unexpected encoding for ${path}: ${data.encoding}`);
  }

  return Buffer.from(data.content, "base64").toString("utf-8");
}

export async function fetchTestFiles(
  token: string,
  repoUrl: string,
  branch: string
): Promise<RepoFile[]> {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const paths = await fetchRepoTree(token, owner, repo, branch);

  const files = await Promise.allSettled(
    paths.map(async (path) => ({
      path,
      content: await fetchFileContent(token, owner, repo, path),
    }))
  );

  return files
    .filter((r): r is PromiseFulfilledResult<RepoFile> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((f) => f.content.trim().length > 0);
}
