export interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  homepage: string | null
  topics: string[]
  default_branch: string
}

const GITHUB_API_BASE = 'https://api.github.com'

/**
 * Fetches repository data from GitHub API (public repos, no auth required)
 * @param owner - Repository owner (username or organization)
 * @param repo - Repository name
 * @returns Repository data or null if fetch fails
 */
export async function fetchGitHubRepo(
  owner: string,
  repo: string,
): Promise<GitHubRepo | null> {
  try {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as GitHubRepo
  } catch {
    return null
  }
}

/**
 * Fetches multiple repositories from GitHub API in parallel
 * @param repos - Array of repository objects with owner and repo properties
 * @returns Array of repository data (null for failed fetches)
 */
export async function fetchMultipleRepos(
  repos: Array<{ owner: string; repo: string }>,
): Promise<Array<GitHubRepo | null>> {
  const promises = repos.map(({ owner, repo }) =>
    fetchGitHubRepo(owner, repo),
  )
  return Promise.all(promises)
}
