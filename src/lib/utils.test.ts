import { describe, it, expect } from 'vitest'
import { ensureTrailingSlash } from './utils'

describe('ensureTrailingSlash', () => {
  it('should add trailing slash to simple paths', () => {
    expect(ensureTrailingSlash('/blog')).toBe('/blog/')
    expect(ensureTrailingSlash('/about')).toBe('/about/')
    expect(ensureTrailingSlash('/posts/article')).toBe('/posts/article/')
  })

  it('should not modify paths that already have trailing slash', () => {
    expect(ensureTrailingSlash('/blog/')).toBe('/blog/')
    expect(ensureTrailingSlash('/about/')).toBe('/about/')
  })

  it('should not modify external URLs', () => {
    expect(ensureTrailingSlash('https://example.com')).toBe('https://example.com')
    expect(ensureTrailingSlash('http://example.com')).toBe('http://example.com')
    expect(ensureTrailingSlash('https://example.com/path')).toBe('https://example.com/path')
  })

  it('should not modify anchor-only links', () => {
    expect(ensureTrailingSlash('#section')).toBe('#section')
    expect(ensureTrailingSlash('#top')).toBe('#top')
  })

  it('should not modify files with extensions', () => {
    expect(ensureTrailingSlash('/rss.xml')).toBe('/rss.xml')
    expect(ensureTrailingSlash('/image.png')).toBe('/image.png')
    expect(ensureTrailingSlash('/script.js')).toBe('/script.js')
  })

  it('should preserve query strings', () => {
    expect(ensureTrailingSlash('/search?q=test')).toBe('/search/?q=test')
    expect(ensureTrailingSlash('/blog?page=2')).toBe('/blog/?page=2')
  })

  it('should preserve hash fragments', () => {
    expect(ensureTrailingSlash('/blog#section')).toBe('/blog/#section')
    expect(ensureTrailingSlash('/about#top')).toBe('/about/#top')
  })

  it('should preserve both query strings and hash fragments', () => {
    expect(ensureTrailingSlash('/search?q=test#results')).toBe('/search/?q=test#results')
  })

  it('should handle empty strings', () => {
    expect(ensureTrailingSlash('')).toBe('')
  })

  it('should handle root path', () => {
    expect(ensureTrailingSlash('/')).toBe('/')
  })
})
