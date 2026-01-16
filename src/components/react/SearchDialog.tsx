import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, FileText, Clock, X } from 'lucide-react'
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

const STORAGE_KEYS = {
  SEARCH_INDEX: 'search_index',
  SEARCH_INDEX_METADATA: 'search_index_metadata',
  SEARCH_INDEX_VERSION: 'search_index_version',
  SEARCH_HISTORY: 'search_history',
} as const

const INDEX_VERSION = SEARCH.CACHE_VERSION

function calculateRelevanceScore(
  result: SearchResult,
  query: string,
  queryLower: string,
): number {
  let score = 0
  const titleLower = result.title.toLowerCase()
  const descLower = result.description.toLowerCase()
  const tagsLower = (result.tags || []).join(' ').toLowerCase()

  if (titleLower === queryLower) {
    score += 100
  } else if (titleLower.startsWith(queryLower)) {
    score += 50
  } else if (titleLower.includes(queryLower)) {
    score += 30
  }

  const queryWords = queryLower.split(/\s+/)
  queryWords.forEach((qWord) => {
    if (titleLower.includes(qWord)) score += 10
    if (descLower.includes(qWord)) score += 5
    if (tagsLower.includes(qWord)) score += 15
  })

  return score
}

function getSearchHistory(): string[] {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY)
    if (!history) return []
    const parsed = JSON.parse(history)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to get search history:', error)
    }
    return []
  }
}

function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to clear search history:', error)
    }
  }
}

function saveSearchHistory(query: string): void {
  if (!query.trim() || query.length > 200) return // Limit query length
  try {
    const history = getSearchHistory()
    const normalizedQuery = query.trim().toLowerCase().slice(0, 200) // Sanitize length
    const filtered = history.filter((q) => q.toLowerCase() !== normalizedQuery)
    const updated = [normalizedQuery, ...filtered].slice(0, SEARCH.MAX_SEARCH_HISTORY)
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated))
  } catch (error) {
    // Handle quota exceeded or other storage errors
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Try to clear old history and retry
      try {
        const history = getSearchHistory()
        const reduced = history.slice(0, Math.floor(SEARCH.MAX_SEARCH_HISTORY / 2))
        localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(reduced))
      } catch {
        // If still fails, silently ignore
      }
    } else if (import.meta.env.DEV) {
      console.warn('Failed to save search history:', error)
    }
  }
}

function getCachedIndex(): { data: SearchResult[]; metadata: SearchIndexMetadata; version: string } | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.SEARCH_INDEX)
    const cachedMetadata = localStorage.getItem(STORAGE_KEYS.SEARCH_INDEX_METADATA)
    const version = localStorage.getItem(STORAGE_KEYS.SEARCH_INDEX_VERSION)
    if (cached && cachedMetadata && version === INDEX_VERSION) {
      const data = JSON.parse(cached)
      const metadata = JSON.parse(cachedMetadata)
      // Validate structure
      if (Array.isArray(data) && metadata && typeof metadata.count === 'number') {
        return { data, metadata, version }
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to get cached index:', error)
    }
  }
  return null
}

function cacheIndex(data: SearchResult[], metadata: SearchIndexMetadata): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SEARCH_INDEX, JSON.stringify(data))
    localStorage.setItem(STORAGE_KEYS.SEARCH_INDEX_METADATA, JSON.stringify(metadata))
    localStorage.setItem(STORAGE_KEYS.SEARCH_INDEX_VERSION, INDEX_VERSION)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Clear cache if quota exceeded
      try {
        localStorage.removeItem(STORAGE_KEYS.SEARCH_INDEX)
        localStorage.removeItem(STORAGE_KEYS.SEARCH_INDEX_METADATA)
        localStorage.removeItem(STORAGE_KEYS.SEARCH_INDEX_VERSION)
      } catch {
        // Ignore cleanup errors
      }
    }
    if (import.meta.env.DEV) {
      console.warn('Failed to cache index:', error)
    }
  }
}

function isCacheStale(cachedMetadata: SearchIndexMetadata, newMetadata: SearchIndexMetadata): boolean {
  if (cachedMetadata.count !== newMetadata.count) return true
  if (cachedMetadata.latestPostDate !== newMetadata.latestPostDate) return true
  const cacheAge = Date.now() - new Date(cachedMetadata.generatedAt).getTime()
  if (cacheAge > SEARCH.CACHE_TTL) return true
  return false
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

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const loadSearchIndex = async () => {
      setIsLoadingIndex(true)
      setError(null)

      const cached = getCachedIndex()
      if (cached && cached.data.length > 0) {
        setSearchIndex(cached.data)
        const searchIndex = new Index({ tokenize: 'forward' })
        cached.data.forEach((item, idx) => {
          const searchableText = [
            item.title || '',
            item.description || '',
            (item.tags || []).join(' '),
          ].join(' ').toLowerCase()
          searchIndex.add(idx, searchableText)
        })
        if (!cancelled) {
          setIndex(searchIndex)
          setRecentPosts(cached.data.slice(0, SEARCH.MAX_RECENT_POSTS))
          setIsLoadingIndex(false)
        }
      }

      try {
        const response = await fetch('/api/search-index.json', { cache: 'reload' })
        if (!response.ok) throw new Error('Failed to load search index')
        const responseData: SearchIndexResponse = await response.json()
        if (cancelled) return

        const shouldUpdate = !cached || !cached.metadata || isCacheStale(cached.metadata, responseData.metadata)
        if (shouldUpdate) {
          cacheIndex(responseData.posts, responseData.metadata)
          setSearchIndex(responseData.posts)
          setRecentPosts(responseData.posts.slice(0, SEARCH.MAX_RECENT_POSTS))
          const searchIndex = new Index({ tokenize: 'forward' })
          responseData.posts.forEach((item, idx) => {
            const searchableText = [
              item.title || '',
              item.description || '',
              (item.tags || []).join(' '),
            ].join(' ').toLowerCase()
            searchIndex.add(idx, searchableText)
          })
          if (!cancelled) {
            setIndex(searchIndex)
          }
        }
      } catch (error) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error('Error loading search index:', error)
          }
          if (!cached || !cached.data.length) {
            setError('Failed to load search index.')
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoadingIndex(false)
        }
      }
    }

    if (!index) {
      loadSearchIndex()
    } else if (recentPosts.length === 0 && searchIndex.length > 0) {
      setRecentPosts(searchIndex.slice(0, SEARCH.MAX_RECENT_POSTS))
    }

    return () => {
      cancelled = true
    }
  }, [open, index, searchIndex.length, recentPosts.length])

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
        let searchResults = index.search(normalizedQuery, { limit: SEARCH.MAX_SEARCH_RESULTS })

        if (searchResults.length === 0 && normalizedQuery.length > 2) {
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

        const scoredResults = matchedResults.map((result) => ({
          result,
          score: calculateRelevanceScore(result, searchQuery, normalizedQuery),
        }))

        scoredResults.sort((a, b) => b.score - a.score)
        const sortedResults = scoredResults.map((item) => item.result)

        setResults(sortedResults)
        setSelectedIndex(0)
        setDisplayedResults(SEARCH.INITIAL_DISPLAY_RESULTS)
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Search error:', error)
        }
        setError('Search error.')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [index, searchIndex],
  )

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

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
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

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const maxIndex = Math.min(displayedResults - 1, results.length - 1)
        setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === 'Enter' && results[selectedIndex]?.url) {
        e.preventDefault()
        const url = results[selectedIndex].url
        // Validate URL is safe (relative path)
        if (url && url.startsWith('/') && !url.startsWith('//')) {
          if (query.trim()) {
            saveSearchHistory(query)
          }
          window.location.href = url
          onOpenChange(false)
        }
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex, onOpenChange, displayedResults, query])

  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement | undefined
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const highlightText = (text: string, query: string) => {
    if (!query.trim() || !text || query.length > 100) return text // Limit query length
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Limit regex complexity
      if (escapedQuery.length > 100) return text
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary font-medium">
            {part}
          </mark>
        ) : (
          part
        ),
      )
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Highlight error:', error)
      }
      return text
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  const hasMoreResults = results.length > displayedResults
  const visibleResults = results.slice(0, displayedResults)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-visible top-16 translate-y-0 h-auto max-h-[calc(100vh-5rem)] flex flex-col rounded-lg border-0 bg-transparent shadow-none [&>button]:hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300">
        <DialogDescription className="sr-only">
          Search blog posts
        </DialogDescription>

        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {isLoadingIndex && 'Loading...'}
          {isLoading && 'Searching...'}
          {!isLoading && !isLoadingIndex && query.trim() && results.length > 0 && `${results.length} results`}
          {!isLoading && !isLoadingIndex && query.trim() && results.length === 0 && 'No results'}
        </div>

        {/* Search Box - Ghost/Blowfish style */}
        <div className="relative z-10 px-4">
          <div className="relative bg-background border border-border rounded-lg shadow-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search articles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-12 bg-transparent border-0 rounded-lg text-base outline-none focus:ring-2 focus:ring-primary/20 focus:ring-inset placeholder:text-muted-foreground/60"
              aria-label="Search"
            />
            {query && !isLoading && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="Clear"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute -right-12 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-10 h-10 rounded-md hover:bg-muted/50 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Results Container - Normal background */}
        {(visibleResults.length > 0 || !query.trim()) && (
          <div 
            ref={scrollContainerRef}
            className="relative z-10 mt-2 mx-4 max-h-[60vh] overflow-y-auto rounded-lg bg-background border border-border shadow-lg"
          >
            <div className="p-4">
              {isLoadingIndex && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              )}

              {!query.trim() && !isLoadingIndex && (
                <div className="space-y-6">
                  {searchHistory.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase">Recent</h3>
                        <button
                          onClick={() => {
                            clearSearchHistory()
                            setSearchHistory([])
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.slice(0, 6).map((term, idx) => (
                          <button
                            key={idx}
                            onClick={() => setQuery(term)}
                            className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted whitespace-nowrap transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentPosts.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-medium text-muted-foreground uppercase">Recent Posts</h3>
                      <ul className="space-y-1">
                        {recentPosts.map((post) => (
                          <li key={post.id}>
                            <a
                              href={post.url}
                              onClick={() => onOpenChange(false)}
                              className="block py-2 text-sm hover:text-primary transition-colors"
                            >
                              {post.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {query.trim() && results.length === 0 && !isLoading && !isLoadingIndex && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No results for "{query}"
                </div>
              )}

              {visibleResults.length > 0 && (
                <ul ref={resultsRef} className="space-y-1">
                  {visibleResults.map((result, idx) => (
                    <li key={result.id}>
                      <a
                        href={result.url}
                        onClick={(e) => {
                          // Validate URL is safe before navigation
                          if (result.url && !result.url.startsWith('/')) {
                            e.preventDefault()
                            return
                          }
                          if (query.trim()) {
                            saveSearchHistory(query)
                          }
                          onOpenChange(false)
                        }}
                        className={cn(
                          'block p-3 rounded-md hover:bg-muted transition-colors',
                          idx === selectedIndex && 'bg-muted'
                        )}
                      >
                        <div className="text-sm font-medium mb-1">
                          {highlightText(result.title, query)}
                        </div>
                        {result.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {highlightText(result.description, query)}
                          </div>
                        )}
                        {result.tags && result.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] text-muted-foreground">
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

              {hasMoreResults && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setDisplayedResults((prev) => Math.min(prev + SEARCH.LOAD_MORE_INCREMENT, results.length))}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Load more ({results.length - displayedResults})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SearchDialog
