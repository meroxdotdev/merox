import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, FileText, Calendar, Hash } from 'lucide-react'
import { Index } from 'flexsearch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onOpenChange }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchIndex, setSearchIndex] = useState<SearchResult[]>([])
  const [index, setIndex] = useState<Index | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Initialize search index on mount
  useEffect(() => {
    const loadSearchIndex = async () => {
      try {
        const response = await fetch('/api/search-index.json')
        if (!response.ok) throw new Error('Failed to load search index')
        const data: SearchResult[] = await response.json()
        setSearchIndex(data)

        // Create FlexSearch index
        const searchIndex = new Index({
          tokenize: 'forward',
        })

        // Index all fields
        data.forEach((item, idx) => {
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

        setIndex(searchIndex)
      } catch (error) {
        console.error('Error loading search index:', error)
      }
    }

    loadSearchIndex()
  }, [])

  // Perform search
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!index || !searchQuery.trim()) {
        setResults([])
        setSelectedIndex(0)
        return
      }

      setIsLoading(true)
      const normalizedQuery = searchQuery.toLowerCase().trim()

      try {
        const searchResults = index.search(normalizedQuery, {
          limit: 10,
        })

        const matchedResults = searchResults
          .map((idx: number | string) => searchIndex[Number(idx)])
          .filter(Boolean) as SearchResult[]

        // Sort by relevance (title matches first, then description, then content)
        const sortedResults = matchedResults.sort((a: SearchResult, b: SearchResult) => {
          const aTitleMatch = a.title.toLowerCase().includes(normalizedQuery)
          const bTitleMatch = b.title.toLowerCase().includes(normalizedQuery)
          if (aTitleMatch && !bTitleMatch) return -1
          if (!aTitleMatch && bTitleMatch) return 1

          const aDescMatch = a.description
            .toLowerCase()
            .includes(normalizedQuery)
          const bDescMatch = b.description
            .toLowerCase()
            .includes(normalizedQuery)
          if (aDescMatch && !bDescMatch) return -1
          if (!aDescMatch && bDescMatch) return 1

          return 0
        })

        setResults(sortedResults)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
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
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev,
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === 'Enter' && results[selectedIndex]?.url) {
        e.preventDefault()
        const url = results[selectedIndex].url
        if (url) {
          window.location.href = url
          onOpenChange(false)
        }
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex, onOpenChange])

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
            className="bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-2xl p-0 gap-0">
        <DialogDescription className="sr-only">
          Search blog posts by title, description, tags, or content
        </DialogDescription>
        <div className="flex items-center border-b px-4">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Search blog posts"
          />
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div
          ref={resultsRef}
          className="max-h-[60vh] overflow-y-auto px-2 py-2"
        >
          {query.trim() && results.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try different keywords or check your spelling
              </p>
            </div>
          )}

          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Start typing to search posts...
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Search by title, description, tags, or content
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((result, idx) => (
                <a
                  key={result.id}
                  href={result.url}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex flex-col gap-2 rounded-md p-3 transition-colors',
                    'hover:bg-muted focus:bg-muted focus:outline-none',
                    idx === selectedIndex && 'bg-muted',
                  )}
                  aria-label={`Go to ${result.title}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm leading-tight">
                      {highlightText(result.title, query)}
                    </h3>
                    <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(result.date)}</span>
                    </div>
                  </div>

                  {result.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {highlightText(result.description, query)}
                    </p>
                  )}

                  {result.tags && result.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {result.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          <Hash className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                      {result.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{result.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  ↑↓
                </kbd>{' '}
                to navigate
              </span>
              <span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  ↵
                </kbd>{' '}
                to select
              </span>
              <span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  esc
                </kbd>{' '}
                to close
              </span>
            </div>
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SearchDialog

