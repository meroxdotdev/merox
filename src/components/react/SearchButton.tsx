import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchDialog from './SearchDialog'
import { ErrorBoundary } from './ErrorBoundary'

const SearchButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isInput) {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <ErrorBoundary>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-3.5 py-1.5 text-sm text-foreground/70 hover:bg-muted/40 hover:border-border/60 hover:text-foreground transition-all duration-200 w-40 lg:w-56"
        title="Search (⌘K)"
        aria-label="Search"
        aria-expanded={isOpen}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">Search...</span>
        <kbd className="pointer-events-none hidden lg:flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-background/80 px-1.5 font-mono text-[10px] font-medium opacity-60">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="md:hidden rounded-full h-9 w-9"
        title="Search (⌘K)"
        aria-label="Search"
        aria-expanded={isOpen}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </Button>

      <ErrorBoundary>
        <SearchDialog open={isOpen} onOpenChange={setIsOpen} />
      </ErrorBoundary>
    </ErrorBoundary>
  )
}

export default SearchButton
