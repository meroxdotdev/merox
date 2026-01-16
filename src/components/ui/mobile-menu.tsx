import { useState, useEffect, useCallback } from 'react'
import { NAV_LINKS } from '@/consts'
import { Menu, X, ExternalLink, Sun, Moon } from 'lucide-react'
import { cn, ensureTrailingSlash } from '@/lib/utils'
import {
  type Theme,
  getValidTheme,
  getStorageItem,
  applyTheme,
} from '@/lib/theme'

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')

  // Initialize theme
  useEffect(() => {
    const storedTheme = getStorageItem('theme')
    setCurrentTheme(getValidTheme(storedTheme))
  }, [])

  // Close menu when Astro view transition starts
  useEffect(() => {
    const handleViewTransitionStart = () => {
      if (isOpen) setIsOpen(false)
    }
    document.addEventListener('astro:before-swap', handleViewTransitionStart)
    return () => document.removeEventListener('astro:before-swap', handleViewTransitionStart)
  }, [isOpen])

  // Listen for theme changes from other components
  useEffect(() => {
    const handleAfterSwap = () => {
      const storedTheme = getStorageItem('theme')
      setCurrentTheme(getValidTheme(storedTheme))
    }
    
    const handleThemeChange = (e: CustomEvent<{ theme: Theme }>) => {
      setCurrentTheme(e.detail.theme)
    }
    
    document.addEventListener('astro:after-swap', handleAfterSwap)
    window.addEventListener('theme-change', handleThemeChange as EventListener)
    
    return () => {
      document.removeEventListener('astro:after-swap', handleAfterSwap)
      window.removeEventListener('theme-change', handleThemeChange as EventListener)
    }
  }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const isExternalLink = (href: string) => href.startsWith('http')

  const handleThemeToggle = useCallback(() => {
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark'
    setCurrentTheme(newTheme)
    applyTheme(newTheme)
  }, [currentTheme])

  const handleLinkClick = useCallback(() => {
    // Close menu immediately - CSS transitions handle the smooth animation
    // Astro's view transitions will handle the page transition smoothly
    setIsOpen(false)
  }, [])

  // Stagger delay for menu items
  const getDelay = (index: number) => isOpen ? `${index * 50}ms` : '0ms'

  return (
    <>
      {/* Menu Toggle Button - Fixed wrapper to prevent layout shift */}
      <div 
        className="md:hidden flex-shrink-0 flex items-center justify-center"
        style={{ 
          width: '36px',
          height: '36px',
          minWidth: '36px',
          minHeight: '36px'
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-full h-full flex items-center justify-center rounded-full hover:bg-foreground/5",
            !isOpen && "transition-colors duration-200"
          )}
          aria-label="Open menu"
          aria-expanded={isOpen}
          style={{ 
            visibility: isOpen ? 'hidden' : 'visible',
            pointerEvents: isOpen ? 'none' : 'auto'
          }}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Fullscreen Menu Overlay - Apple Style */}
      <div
        className={cn(
          "fixed inset-0 z-[9999] md:hidden",
          "flex flex-col bg-background",
          "transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        )}
        style={{ height: '100dvh' }}
        aria-hidden={!isOpen}
      >
        {/* Close Button - Same position as burger menu in header */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-10 flex items-center justify-center size-9 rounded-full hover:bg-foreground/5 transition-colors duration-200"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-6 py-8 pt-16">
          <ul className="space-y-1">
            {NAV_LINKS.map((item, index) => {
              const isExternal = isExternalLink(item.href)
              return (
                <li 
                  key={item.href}
                  className={cn(
                    "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    isOpen 
                      ? "opacity-100 translate-x-0" 
                      : "opacity-0 -translate-x-3"
                  )}
                  style={{ transitionDelay: getDelay(index) }}
                >
                  <a
                    href={isExternal ? item.href : ensureTrailingSlash(item.href)}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    data-internal-link={!isExternal ? 'true' : undefined}
                    onClick={handleLinkClick}
                    className="flex items-center justify-between py-4 text-2xl font-semibold text-foreground hover:text-primary transition-colors duration-200"
                  >
                    <span>{item.label}</span>
                    {isExternal && (
                      <ExternalLink className="h-5 w-5 opacity-40" aria-hidden="true" />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer - Theme Toggle */}
        <div 
          className={cn(
            "flex-shrink-0 px-6 py-6 border-t border-border/40",
            "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isOpen 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-2"
          )}
          style={{ transitionDelay: getDelay(NAV_LINKS.length) }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground/50 uppercase tracking-wider">
              Appearance
            </span>
            <button
              onClick={handleThemeToggle}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground transition-colors duration-200"
              aria-label={currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {currentTheme === 'dark' ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span className="text-sm font-medium">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span className="text-sm font-medium">Light</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileMenu
