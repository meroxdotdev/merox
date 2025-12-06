import React, { useState, useEffect } from 'react'
import { Palette, ChevronRight, X, Check, Github, BookOpen } from 'lucide-react'

const ThemePromo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const promo = document.getElementById('theme-promo')
      if (promo && !promo.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleOutsideClick)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div
      id="theme-promo"
      className="fixed right-6 bottom-6 z-[60] hidden xl:block"
      aria-label="Theme information"
    >
      {/* Collapsed Button - Only show when card is closed */}
      {!isOpen && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(true)
          }}
          className="group flex items-center gap-2 px-4 py-3 rounded-lg border border-border/60 bg-background/90 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50"
          aria-label="Learn about this theme"
          aria-expanded={false}
        >
          <Palette className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            Try this theme
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all" />
        </button>
      )}

      {/* Expanded Card */}
      {isOpen && (
        <div
          className="w-80 rounded-lg border border-border/60 bg-background/95 backdrop-blur-md shadow-xl mb-3 overflow-hidden animate-in slide-in-from-bottom-2"
        >
          <div className="p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  merox-erudite
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A batteries-included Astro blogging theme with newsletter, comments, analytics, and more.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
                className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Features List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Newsletter integration (Brevo)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Comments (Disqus)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Analytics support</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>SEO enhancements</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              <a
                href="https://github.com/meroxdotdev/merox-erudite"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
              >
                <Github className="w-4 h-4" />
                <span>View on GitHub</span>
              </a>
              <a
                href="https://merox.dev/blog/merox-erudite-theme"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md border border-border/60 bg-background text-foreground text-sm font-medium transition-all duration-200 hover:bg-muted/50 hover:border-border active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4" />
                <span>Learn more</span>
              </a>
            </div>

            {/* Footer Note */}
            <p className="text-[10px] text-muted-foreground/70 text-center pt-2 border-t border-border/30">
              Forked from <a href="https://github.com/jktrn/astro-erudite" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">astro-erudite</a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemePromo

