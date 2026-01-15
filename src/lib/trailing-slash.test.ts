import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { globSync } from 'glob'

/**
 * Test to catch hardcoded links in MDX files that are missing trailing slashes.
 * This prevents 301 redirects on GitHub Pages which can cause performance issues.
 */
describe('MDX trailing slash validation', () => {
  it('should have trailing slashes on all internal /blog/ links', async () => {
    const mdxFiles = globSync('src/content/blog/**/*.mdx')
    const violations: Array<{ file: string; line: number; link: string }> = []

    for (const file of mdxFiles) {
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      lines.forEach((line, index) => {
        // Match internal /blog/ links without trailing slash
        // Matches patterns like: [text](/blog/article-name) or (https://merox.dev/blog/article-name)
        const regex = /\[([^\]]*)\]\((\/blog\/[^/\s)]+)\)/g
        let match

        while ((match = regex.exec(line)) !== null) {
          const link = match[2]
          // Check if it's not a file with extension and doesn't already have trailing slash
          if (!link.endsWith('/') && !/\.[a-z]+$/i.test(link)) {
            violations.push({
              file,
              line: index + 1,
              link,
            })
          }
        }

        // Also check for direct URL patterns like (https://merox.dev/blog/article-name)
        const urlRegex = /\(https:\/\/merox\.dev\/blog\/([^/\s)]+)\)/g
        while ((match = urlRegex.exec(line)) !== null) {
          const link = match[0].slice(1, -1) // Remove parentheses
          if (!link.endsWith('/') && !/\.[a-z]+$/i.test(link)) {
            violations.push({
              file,
              line: index + 1,
              link,
            })
          }
        }
      })
    }

    if (violations.length > 0) {
      const errorMessage = violations
        .map((v) => `  ${v.file}:${v.line} - ${v.link}`)
        .join('\n')
      throw new Error(
        `Found ${violations.length} internal /blog/ link(s) without trailing slash:\n${errorMessage}\n\nPlease add trailing slashes to avoid 301 redirects on GitHub Pages.`
      )
    }
  })

  it('should have trailing slashes on all internal /posts/ links (if any)', async () => {
    const mdxFiles = globSync('src/content/blog/**/*.mdx')
    const violations: Array<{ file: string; line: number; link: string }> = []

    for (const file of mdxFiles) {
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      lines.forEach((line, index) => {
        // Match internal /posts/ links without trailing slash
        const regex = /\[([^\]]*)\]\((\/posts\/[^/\s)]+)\)/g
        let match

        while ((match = regex.exec(line)) !== null) {
          const link = match[2]
          if (!link.endsWith('/') && !/\.[a-z]+$/i.test(link)) {
            violations.push({
              file,
              line: index + 1,
              link,
            })
          }
        }
      })
    }

    if (violations.length > 0) {
      const errorMessage = violations
        .map((v) => `  ${v.file}:${v.line} - ${v.link}`)
        .join('\n')
      throw new Error(
        `Found ${violations.length} internal /posts/ link(s) without trailing slash:\n${errorMessage}\n\nPlease add trailing slashes to avoid 301 redirects on GitHub Pages.`
      )
    }
  })
})
