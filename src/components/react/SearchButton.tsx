import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import SearchDialog from './SearchDialog'
import { ErrorBoundary } from './ErrorBoundary'

const SearchButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable
      
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
        className={cn(
          "group hidden md:flex items-center justify-between gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-muted hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background md:w-48 lg:w-64 md:-my-1"
        )}
        title="Search (⌘K)"
        aria-label="Search blog posts"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-foreground" />
          <span className="truncate transition-colors group-hover:text-foreground">Search...</span>
          <span className="sr-only">Search</span>
        </div>
        
        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 hidden md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Mobile only icon-button version - hidden on md and up */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="size-9 md:hidden"
        title="Search (⌘K)"
        aria-label="Search blog posts"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
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

