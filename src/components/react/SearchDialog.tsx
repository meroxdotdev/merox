import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, Loader2, X } from 'lucide-react'
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

/* ------------------------------------------------------------------ */
/*  Utility functions                                                  */
/* ------------------------------------------------------------------ */

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
  if (!query.trim() || query.length > 200) return
  try {
    const history = getSearchHistory()
    const normalizedQuery = query.trim().toLowerCase().slice(0, 200)
    const filtered = history.filter((q) => q.toLowerCase() !== normalizedQuery)
    const updated = [normalizedQuery, ...filtered].slice(0, SEARCH.MAX_SEARCH_HISTORY)
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        const history = getSearchHistory()
        const reduced = history.slice(0, Math.floor(SEARCH.MAX_SEARCH_HISTORY / 2))
        localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(reduced))
      } catch {
        // Silently ignore
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

/* ------------------------------------------------------------------ */
/*  SearchDialog component                                             */
/* ------------------------------------------------------------------ */

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
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLUListElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // SSR guard
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detect mobile viewport
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Close search on Astro page navigation
  useEffect(() => {
    const onSwap = () => onOpenChange(false)
    document.addEventListener('astro:after-swap', onSwap)
    return () => document.removeEventListener('astro:after-swap', onSwap)
  }, [onOpenChange])

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden'
    } else if (isMobile) {
      document.body.style.overflow = ''
    }
    return () => {
      if (isMobile) document.body.style.overflow = ''
    }
  }, [open, isMobile])

  /* -- Index loading ------------------------------------------------- */

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const loadSearchIndex = async () => {
      setIsLoadingIndex(true)
      setError(null)

      const cached = getCachedIndex()
      if (cached && cached.data.length > 0) {
        setSearchIndex(cached.data)
        const searchIdx = new Index({ tokenize: 'forward' })
        cached.data.forEach((item, idx) => {
          const searchableText = [
            item.title || '',
            item.description || '',
            (item.tags || []).join(' '),
          ].join(' ').toLowerCase()
          searchIdx.add(idx, searchableText)
        })
        if (!cancelled) {
          setIndex(searchIdx)
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
          const searchIdx = new Index({ tokenize: 'forward' })
          responseData.posts.forEach((item, idx) => {
            const searchableText = [
              item.title || '',
              item.description || '',
              (item.tags || []).join(' '),
            ].join(' ').toLowerCase()
            searchIdx.add(idx, searchableText)
          })
          if (!cancelled) {
            setIndex(searchIdx)
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error('Error loading search index:', err)
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

  /* -- Search logic -------------------------------------------------- */

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
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Search error:', err)
        }
        setError('Search error.')
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

  // Reset state when opened
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

  // Keyboard navigation (desktop uses global listener; mobile uses onKeyDown)
  const handleKeyNav = useCallback(
    (e: KeyboardEvent | React.KeyboardEvent) => {
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
    },
    [results, selectedIndex, displayedResults, query, onOpenChange],
  )

  // Desktop keyboard listener
  useEffect(() => {
    if (!open || isMobile) return

    const handler = (e: KeyboardEvent) => handleKeyNav(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, isMobile, handleKeyNav])

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement | undefined
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Focus trap for mobile overlay
  const handleMobileKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Delegate navigation keys
      handleKeyNav(e)

      // Focus trap
      if (e.key === 'Tab') {
        const container = overlayRef.current
        if (!container) return

        const focusable = container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [handleKeyNav],
  )

  /* -- Shared UI helpers --------------------------------------------- */

  const highlightText = (text: string, q: string) => {
    if (!q.trim() || !text || q.length > 100) return text
    try {
      const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (escapedQuery.length > 100) return text
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))
      return parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary font-medium">
            {part}
          </mark>
        ) : (
          part
        ),
      )
    } catch {
      return text
    }
  }

  const hasMoreResults = results.length > displayedResults
  const visibleResults = results.slice(0, displayedResults)

  /* ------------------------------------------------------------------ */
  /*  Shared search UI (used by both mobile and desktop)                 */
  /* ------------------------------------------------------------------ */
  const searchInput = (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
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
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )

  const searchResults = (
    <div className="p-4">
      {/* Screen reader status */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoadingIndex && 'Loading...'}
        {isLoading && 'Searching...'}
        {!isLoading && !isLoadingIndex && query.trim() && results.length > 0 && `${results.length} results`}
        {!isLoading && !isLoadingIndex && query.trim() && results.length === 0 && 'No results'}
      </div>

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
                      onClick={() => {
                        if (query.trim()) saveSearchHistory(query)
                        onOpenChange(false)
                      }}
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
          No results for &ldquo;{query}&rdquo;
        </div>
      )}

      {visibleResults.length > 0 && (
        <ul ref={resultsRef} className="space-y-1">
          {visibleResults.map((result, idx) => (
            <li key={result.id}>
              <a
                href={result.url}
                onClick={(e) => {
                  if (result.url && !result.url.startsWith('/')) {
                    e.preventDefault()
                    return
                  }
                  if (query.trim()) saveSearchHistory(query)
                  onOpenChange(false)
                }}
                className={cn(
                  'block p-3 rounded-md hover:bg-muted transition-colors',
                  idx === selectedIndex && 'bg-muted',
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
  )

  /* ------------------------------------------------------------------ */
  /*  Mobile: full-page overlay (portaled to body)                      */
  /* ------------------------------------------------------------------ */
  if (isMobile && mounted) {
    const mobileOverlay = (
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className={cn(
          'fixed inset-0 z-[100] bg-background transition-[opacity,visibility] duration-150 ease-out',
          open ? 'visible opacity-100' : 'invisible opacity-0',
        )}
        onKeyDown={handleMobileKeyDown}
      >
        {/* Header bar with close button */}
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <span className="text-sm font-medium text-muted-foreground">Search</span>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-foreground/5"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4">
          <div className="bg-muted/40 rounded-xl">
            {searchInput}
          </div>
        </div>

        {/* Results */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto h-[calc(100%-8rem)] mt-4">
          {searchResults}
        </div>
      </div>
    )

    return createPortal(mobileOverlay, document.body)
  }

  /* ------------------------------------------------------------------ */
  /*  Desktop: Radix Dialog (existing behavior)                         */
  /* ------------------------------------------------------------------ */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-visible top-16 translate-y-0 h-auto max-h-[calc(100vh-5rem)] flex flex-col rounded-lg border-0 bg-transparent shadow-none [&>button]:hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300">
        <DialogDescription className="sr-only">
          Search blog posts
        </DialogDescription>

        {/* Search box */}
        <div className="relative z-10 px-4">
          <div className="relative bg-background border border-border rounded-lg shadow-lg">
            {searchInput}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute -right-12 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-10 h-10 rounded-md hover:bg-muted/50 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Results */}
        {(visibleResults.length > 0 || !query.trim()) && (
          <div ref={scrollContainerRef} className="relative z-10 mt-2 mx-4 max-h-[60vh] overflow-y-auto rounded-lg bg-background border border-border shadow-lg">
            {searchResults}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SearchDialog
