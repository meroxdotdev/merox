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

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
  html_url: string
  author: {
    login: string
    avatar_url: string
  } | null
}

const GITHUB_API_BASE = 'https://api.github.com'
const REQUEST_TIMEOUT_MS = 10000 // 10 seconds

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

/**
 * Fetches recent commits from GitHub API (public repos, no auth required)
 * @param owner - Repository owner (username or organization)
 * @param repo - Repository name
 * @param perPage - Number of commits to fetch (default: 5, max: 100)
 * @param retries - Number of retry attempts (default: 2)
 * @returns Array of commit data or empty array if fetch fails
 */
export async function fetchGitHubCommits(
  owner: string,
  repo: string,
  perPage: number = 5,
  retries: number = 2,
): Promise<GitHubCommit[]> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${Math.min(perPage, 100)}`
  
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'merox.dev/1.0',
  }

  // Add GitHub token if available (for higher rate limits)
  const githubToken = import.meta.env.GITHUB_TOKEN
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // If rate limited, wait before retry
        if ((response.status === 403 || response.status === 429) && attempt < retries) {
          const retryAfter = response.headers.get('Retry-After')
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : (attempt + 1) * 1000
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        
        if (import.meta.env.DEV) {
          if (response.status === 403 || response.status === 429) {
            console.warn(`GitHub API rate limit reached for ${owner}/${repo}. Consider setting GITHUB_TOKEN for higher rate limits.`)
          } else {
            console.warn(`GitHub API error for ${owner}/${repo}: ${response.status} ${response.statusText}`)
          }
        }
        return []
      }

      const data = await response.json()
      
      // Validate response is an array
      if (!Array.isArray(data)) {
        return []
      }

      return data as GitHubCommit[]
    } catch (error) {
      // On last attempt, return empty array
      if (attempt === retries) {
        if (import.meta.env.DEV && error instanceof Error && error.name !== 'AbortError') {
          console.warn(`Error fetching commits from ${owner}/${repo}:`, error.message)
        }
        return []
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 500))
    }
  }

  return []
}
