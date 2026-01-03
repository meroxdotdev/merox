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
          "group hidden md:flex items-center gap-2 rounded-full border border-border/40 bg-foreground/[0.03] px-3.5 py-1.5 text-sm text-foreground/50 transition-all hover:bg-foreground/[0.06] hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-ring/20 md:w-40 lg:w-56"
        )}
        title="Search (⌘K)"
        aria-label="Search blog posts"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-foreground/80" />
        <span className="flex-1 text-left truncate transition-colors group-hover:text-foreground/80">Search...</span>
        
        <kbd className="pointer-events-none hidden lg:flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-background/50 px-1.5 font-mono text-[10px] font-medium opacity-60 group-hover:opacity-100 transition-opacity">
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

