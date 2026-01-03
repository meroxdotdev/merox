import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, FileText, Calendar, Hash, Clock, AlertCircle, ChevronDown, X } from 'lucide-react'
import { Index } from 'flexsearch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { PERFORMANCE, SEARCH } from '@/lib/constants'

interface SearchResult {
  id: string
  title: string
  description: string
  date: string
  tags: string[]
  authors: string[]
  url: string
  content: string
}

interface SearchIndexMetadata {
  count: number
  latestPostDate: string
  generatedAt: string
}

interface SearchIndexResponse {
  posts: SearchResult[]
  metadata: SearchIndexMetadata
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// LocalStorage keys
const STORAGE_KEYS = {
  SEARCH_INDEX: 'search_index',
  SEARCH_INDEX_METADATA: 'search_index_metadata',
  SEARCH_INDEX_VERSION: 'search_index_version',
  SEARCH_HISTORY: 'search_history',
} as const

// Use constants from lib
const INDEX_VERSION = SEARCH.CACHE_VERSION


// Calculate relevance score
function calculateRelevanceScore(
  result: SearchResult,
  query: string,
  queryLower: string,
): number {
  let score = 0
  const titleLower = result.title.toLowerCase()
  const descLower = result.description.toLowerCase()
  const contentLower = result.content.toLowerCase()
  const tagsLower = (result.tags || []).join(' ').toLowerCase()

  // Exact title match (highest priority)
  if (titleLower === queryLower) {
    score += 1000
  } else if (titleLower.startsWith(queryLower)) {
    score += 500
  } else if (titleLower.includes(queryLower)) {
    score += 300
  }

  // Title word matches
  const titleWords = titleLower.split(/\s+/)
  const queryWords = queryLower.split(/\s+/)
  queryWords.forEach((qWord) => {
    titleWords.forEach((tWord) => {
      if (tWord === qWord) score += 50
      else if (tWord.startsWith(qWord)) score += 30
      else if (tWord.includes(qWord)) score += 10
    })
  })

  // Description match
  if (descLower.includes(queryLower)) {
    score += 100
  }
  queryWords.forEach((qWord) => {
    if (descLower.includes(qWord)) score += 20
  })

  // Tag matches
  queryWords.forEach((qWord) => {
    if (tagsLower.includes(qWord)) score += 40
  })

  // Content match (lower priority)
  if (contentLower.includes(queryLower)) {
    score += 10
  }
  queryWords.forEach((qWord) => {
    const matches = (contentLower.match(new RegExp(qWord, 'g')) || []).length
    score += matches * 2
  })

  // Recency boost (newer posts get slight boost)
  try {
    const postDate = new Date(result.date)
    const now = new Date()
    const daysSince = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < 30) score += 5
    else if (daysSince < 90) score += 2
  } catch {
    // Ignore date errors
  }

  return score
}

// Get search history from localStorage
function getSearchHistory(): string[] {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

// Clear search history
function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY)
  } catch {
    // Ignore errors
  }
}

// Save search to history
function saveSearchHistory(query: string): void {
  if (!query.trim()) return
  try {
    const history = getSearchHistory()
    const normalizedQuery = query.trim().toLowerCase()
    // Remove if exists and add to front
    const filtered = history.filter((q) => q.toLowerCase() !== normalizedQuery)
    const updated = [normalizedQuery, ...filtered].slice(0, SEARCH.MAX_SEARCH_HISTORY)
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated))
  } catch {
    // Ignore localStorage errors
  }
}

// Get cached search index
function getCachedIndex(): { data: SearchResult[]; metadata: SearchIndexMetadata; version: string } | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.SEARCH_INDEX)
    const cachedMetadata = localStorage.getItem(STORAGE_KEYS.SEARCH_INDEX_METADATA)
    const version = localStorage.getItem(STORAGE_KEYS.SEARCH_INDEX_VERSION)
    if (cached && cachedMetadata && version === INDEX_VERSION) {
      return {
        data: JSON.parse(cached),
        metadata: JSON.parse(cachedMetadata),
        version,
      }
    }
  } catch {
    // Ignore errors
  }
  return null
}

// Cache search index with metadata
function cacheIndex(data: SearchResult[], metadata: SearchIndexMetadata): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SEARCH_INDEX, JSON.stringify(data))
    localStorage.setItem(STORAGE_KEYS.SEARCH_INDEX_METADATA, JSON.stringify(metadata))
    localStorage.setItem(STORAGE_KEYS.SEARCH_INDEX_VERSION, INDEX_VERSION)
  } catch {
    // Ignore localStorage errors (quota exceeded, etc.)
  }
}

// Check if cached index is stale by comparing metadata
function isCacheStale(cachedMetadata: SearchIndexMetadata, newMetadata: SearchIndexMetadata): boolean {
  // Invalidate if post count changed
  if (cachedMetadata.count !== newMetadata.count) return true
  
  // Invalidate if latest post date changed (new post published)
  if (cachedMetadata.latestPostDate !== newMetadata.latestPostDate) return true
  
  // Invalidate if cache is older than TTL
  const cacheAge = Date.now() - new Date(cachedMetadata.generatedAt).getTime()
  if (cacheAge > SEARCH.CACHE_TTL) return true
  
  return false
}

// Extract content snippet around search terms
function extractSnippet(content: string, query: string, maxLength: number = SEARCH.SNIPPET_MAX_LENGTH): string {
  if (!content || content.length === 0) {
    return ''
  }
  
  if (!query || query.trim().length === 0) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }
  
  const queryLower = query.toLowerCase()
  const contentLower = content.toLowerCase()
  const index = contentLower.indexOf(queryLower)
  
  if (index === -1) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }
  
  const start = Math.max(0, index - SEARCH.SNIPPET_CONTEXT_LENGTH)
  const end = Math.min(content.length, index + query.length + maxLength - SEARCH.SNIPPET_CONTEXT_LENGTH)
  let snippet = content.substring(start, end)
  
  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'
  
  return snippet
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onOpenChange }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingIndex, setIsLoadingIndex] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchIndex, setSearchIndex] = useState<SearchResult[]>([])
  const [index, setIndex] = useState<Index | null>(null)
  const [displayedResults, setDisplayedResults] = useState(10)
  const [recentPosts, setRecentPosts] = useState<SearchResult[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLUListElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const listboxId = 'search-results-listbox'

  // Load search index (with caching)
  useEffect(() => {
    if (!open) return

    let cancelled = false

    const loadSearchIndex = async () => {
      setIsLoadingIndex(true)
      setError(null)

      // Check cache first and use it if available
      const cached = getCachedIndex()
      if (cached && cached.data.length > 0) {
        // Use cached data immediately for fast initial load
        setSearchIndex(cached.data)
        
        // Create FlexSearch index from cached data
        const searchIndex = new Index({
          tokenize: 'forward',
        })

        cached.data.forEach((item, idx) => {
          const searchableText = [
            item.title || '',
            item.description || '',
            (item.tags || []).join(' '),
            item.content || '',
          ]
            .join(' ')
            .toLowerCase()
          searchIndex.add(idx, searchableText)
        })

        if (!cancelled) {
          setIndex(searchIndex)
          setRecentPosts(cached.data.slice(0, SEARCH.MAX_RECENT_POSTS))
          setIsLoadingIndex(false)
        }
      }

      // Always fetch latest to check for updates (in background)
      // Use cache: 'reload' to bypass cache but allow revalidation
      try {
        const response = await fetch('/api/search-index.json', {
          cache: 'reload', // Bypass cache to check for updates
        })
        if (!response.ok) throw new Error('Failed to load search index')
        const responseData: SearchIndexResponse = await response.json()
        
        if (cancelled) return

        // Check if cache is stale
        const shouldUpdate =
          !cached ||
          !cached.metadata ||
          isCacheStale(cached.metadata, responseData.metadata)

        if (shouldUpdate) {
          // Update cache and index with fresh data
          cacheIndex(responseData.posts, responseData.metadata)
          
          setSearchIndex(responseData.posts)
          setRecentPosts(responseData.posts.slice(0, SEARCH.MAX_RECENT_POSTS))

          // Create FlexSearch index
          const searchIndex = new Index({
            tokenize: 'forward',
          })

          // Index all fields
          responseData.posts.forEach((item, idx) => {
            const searchableText = [
              item.title || '',
              item.description || '',
              (item.tags || []).join(' '),
              item.content || '',
            ]
              .join(' ')
              .toLowerCase()
            searchIndex.add(idx, searchableText)
          })

          if (!cancelled) {
            setIndex(searchIndex)
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading search index:', error)
          // Only show error if we don't have cached data
          if (!cached || !cached.data.length) {
            setError('Failed to load search index. Please try again later.')
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoadingIndex(false)
        }
      }
    }

    // Only load if index hasn't been loaded yet
    if (!index) {
      loadSearchIndex()
    } else if (recentPosts.length === 0 && searchIndex.length > 0) {
      setRecentPosts(searchIndex.slice(0, SEARCH.MAX_RECENT_POSTS))
    }

    return () => {
      cancelled = true
    }
  }, [open, index, searchIndex.length, recentPosts.length])

  // Perform search with fuzzy matching and improved relevance
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!index || !searchQuery.trim()) {
        setResults([])
        setSelectedIndex(0)
        setDisplayedResults(SEARCH.INITIAL_DISPLAY_RESULTS)
        return
      }

      setIsLoading(true)
      setError(null)
      const normalizedQuery = searchQuery.toLowerCase().trim()

      try {
        // Save to search history
        saveSearchHistory(searchQuery)

        // First try exact search
        let searchResults = index.search(normalizedQuery, {
          limit: SEARCH.MAX_SEARCH_RESULTS,
        })

        // If no results, try fuzzy matching
        if (searchResults.length === 0 && normalizedQuery.length > 2) {
          // Try searching with each word separately
          const words = normalizedQuery.split(/\s+/)
          const wordResults = new Set<number>()
          
          words.forEach((word) => {
            if (word.length > 2) {
              const wordSearch = index.search(word, { limit: 20 })
              wordSearch.forEach((idx) => wordResults.add(Number(idx)))
            }
          })
          
          searchResults = Array.from(wordResults)
        }

        const matchedResults = searchResults
          .map((idx: number | string) => searchIndex[Number(idx)])
          .filter(Boolean) as SearchResult[]

        // Calculate relevance scores and sort
        const scoredResults = matchedResults.map((result) => ({
          result,
          score: calculateRelevanceScore(result, searchQuery, normalizedQuery),
        }))

        // Sort by score (descending)
        scoredResults.sort((a, b) => b.score - a.score)

        // Extract results
        const sortedResults = scoredResults.map((item) => item.result)

        setResults(sortedResults)
        setSelectedIndex(0)
        setDisplayedResults(SEARCH.INITIAL_DISPLAY_RESULTS)
      } catch (error) {
        console.error('Search error:', error)
        setError('An error occurred while searching. Please try again.')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [index, searchIndex],
  )

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(0)
      setDisplayedResults(SEARCH.INITIAL_DISPLAY_RESULTS)
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, PERFORMANCE.SEARCH_DEBOUNCE)

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  // Focus input when dialog opens and reset scroll position
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
        // Reset scroll position to top when dialog opens
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0
        }
      }, PERFORMANCE.FOCUS_DELAY)
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setDisplayedResults(SEARCH.INITIAL_DISPLAY_RESULTS)
      setError(null)
      setSearchHistory(getSearchHistory())
    }
  }, [open])

  // Reset scroll position when query changes (new search)
  useEffect(() => {
    if (scrollContainerRef.current && query.trim()) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0
        }
      }, PERFORMANCE.SCROLL_RESET_DELAY)
      return () => clearTimeout(timeoutId)
    }
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const maxIndex = Math.min(displayedResults - 1, results.length - 1)
        setSelectedIndex((prev) =>
          prev < maxIndex ? prev + 1 : prev,
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === 'Enter' && results[selectedIndex]?.url) {
        e.preventDefault()
        const url = results[selectedIndex].url
        if (url) {
          // Use proper navigation that preserves browser history
          window.location.href = url
          onOpenChange(false)
        }
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex, onOpenChange, displayedResults])

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as
        | HTMLElement
        | undefined
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [selectedIndex])

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim() || !text) return text

    try {
      // Escape special regex characters in query
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary font-medium"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )
    } catch (error) {
      // Fallback to plain text if regex fails
      return text
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString // Return original if invalid date
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch (error) {
      return dateString // Return original on error
    }
  }

  const hasMoreResults = results.length > displayedResults
  const visibleResults = results.slice(0, displayedResults)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-lg md:max-w-2xl p-0 gap-0 overflow-hidden top-0 sm:top-[10%] translate-y-0 h-[100dvh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-none sm:rounded-lg data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0">
        <DialogDescription className="sr-only">
          Search blog posts by title, description, tags, or content
        </DialogDescription>
        {/* Live region for screen readers */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {isLoadingIndex && 'Loading search index...'}
          {isLoading && 'Searching...'}
          {!isLoading && !isLoadingIndex && query.trim() && results.length > 0 && `${results.length} result${results.length !== 1 ? 's' : ''} found`}
          {!isLoading && !isLoadingIndex && query.trim() && results.length === 0 && 'No results found'}
          {selectedIndex >= 0 && results[selectedIndex] && `Selected: ${results[selectedIndex].title}`}
        </div>
        <div className="flex shrink-0 items-center border-b border-border/50 px-4 pt-safe relative bg-muted/20">
          <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search posts, tags, or content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-16 sm:h-14 w-full bg-transparent py-4 sm:py-3 pr-12 sm:pr-0 text-base sm:text-sm outline-none border-0 shadow-none [appearance:none] placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-0"
            aria-label="Search blog posts"
            aria-expanded={results.length > 0}
            aria-controls={listboxId}
            aria-activedescendant={results.length > 0 && selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
            role="combobox"
            aria-autocomplete="list"
          />
          <div className="flex items-center gap-2">
            {isLoading && (
              <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin text-muted-foreground shrink-0" />
            )}
            {query && !isLoading && (
              <button
                onClick={() => setQuery('')}
                className="rounded-full p-1 hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {/* Close button for mobile - positioned in header */}
            <button
              onClick={() => onOpenChange(false)}
              className="sm:hidden rounded-lg p-2 opacity-70 transition-opacity active:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex shrink-0 items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive mx-4 mt-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6 [-webkit-overflow-scrolling:touch]"
        >
          {/* Loading skeleton */}
          {isLoadingIndex && (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-3 w-full bg-muted rounded mb-1" />
                  <div className="h-3 w-2/3 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {/* No query - show suggestions */}
          {!query.trim() && !isLoadingIndex && (
            <div className="space-y-8 py-2">
              {/* Recent searches */}
              {searchHistory.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center justify-between px-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Recent Searches
                    </h3>
                    <button
                      onClick={() => {
                        clearSearchHistory()
                        setSearchHistory([])
                      }}
                      className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-1">
                    {searchHistory.slice(0, SEARCH.MAX_DISPLAYED_SEARCH_HISTORY).map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(term)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent posts */}
              {recentPosts.length > 0 && (
                <div>
                  <h3 className="mb-4 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Latest Content
                  </h3>
                  <ul className="space-y-2">
                    {recentPosts.map((post) => (
                      <li key={post.id}>
                        <a
                          href={post.url}
                          onClick={() => onOpenChange(false)}
                          className="group flex flex-col gap-1 rounded-xl border border-transparent p-3 transition-all hover:bg-muted/50 hover:border-border/50 active:bg-muted"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight">
                              {post.title}
                            </h4>
                            <span className="shrink-0 text-[10px] font-medium text-muted-foreground tabular-nums">
                              {formatDate(post.date)}
                            </span>
                          </div>
                          {post.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {post.description}
                            </p>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Links / Suggestions */}
              {recentPosts.length === 0 && searchHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-muted/50 p-4">
                    <Search className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Search Merox.dev</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-[280px]">
                    Find articles, tutorials, and insights about infrastructure, security, and Linux.
                  </p>
                  
                  <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-sm">
                    {['Docker', 'Kubernetes', 'HPC', 'Linux', 'Security', 'Ansible'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background p-2.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {query.trim() && results.length === 0 && !isLoading && !isLoadingIndex && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted/50 p-4">
                <FileText className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="text-base font-medium text-foreground">
                No results for &quot;{query}&quot;
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try searching for something else or check your spelling.
              </p>
            </div>
          )}

          {/* Results */}
          {visibleResults.length > 0 && (
            <ul
              ref={resultsRef}
              id={listboxId}
              role="listbox"
              aria-label="Search results"
              className="space-y-2"
            >
              {visibleResults.map((result, idx) => (
                <li
                  key={result.id}
                  id={`result-${idx}`}
                  role="option"
                  aria-selected={idx === selectedIndex}
                >
                  <a
                    href={result.url}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      'group flex flex-col gap-2 rounded-xl border border-transparent p-4 transition-all',
                      'hover:bg-muted/50 hover:border-border/50 active:bg-muted',
                      idx === selectedIndex ? 'bg-muted border-border/80 ring-1 ring-border/50 shadow-sm' : 'bg-transparent',
                    )}
                    aria-label={`Go to ${result.title}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-semibold text-sm sm:text-base leading-snug transition-colors",
                          idx === selectedIndex ? "text-primary" : "text-foreground group-hover:text-primary"
                        )}>
                          {highlightText(result.title, query)}
                        </h3>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-tight tabular-nums">
                        {formatDate(result.date)}
                      </div>
                    </div>

                    {result.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {highlightText(result.description, query)}
                      </p>
                    )}

                    {/* Content snippet - only show if description doesn't contain query */}
                    {result.content && 
                     (!result.description || !result.description.toLowerCase().includes(query.toLowerCase())) && (
                      <p className="text-xs text-muted-foreground/60 line-clamp-1 leading-relaxed mt-1">
                        {highlightText(extractSnippet(result.content, query, SEARCH.SNIPPET_MAX_LENGTH - SEARCH.SNIPPET_CONTEXT_LENGTH), query)}
                      </p>
                    )}

                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {result.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors group-hover:bg-muted"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Load more button */}
          {hasMoreResults && (
            <div className="mt-8 mb-4 flex justify-center pb-safe">
              <button
                onClick={() => setDisplayedResults((prev) => Math.min(prev + SEARCH.LOAD_MORE_INCREMENT, results.length))}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2 text-xs font-semibold text-foreground transition-all hover:bg-muted hover:border-border/80 shadow-sm"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                View {results.length - displayedResults} more results
              </button>
            </div>
          )}
          
          <div className="h-2" aria-hidden="true" />
        </div>

        {/* Footer shortcuts - only visible on desktop with results */}
        <div className="hidden sm:flex shrink-0 items-center justify-between border-t border-border/40 bg-muted/10 px-6 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center justify-center rounded border bg-background px-1.5 font-sans shadow-sm">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center justify-center rounded border bg-background px-1.5 font-sans shadow-sm">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center justify-center rounded border bg-background px-1.5 font-sans shadow-sm">
                esc
              </kbd>
              Close
            </span>
          </div>
          {results.length > 0 && (
            <div className="text-muted-foreground/60 tabular-nums">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SearchDialog
