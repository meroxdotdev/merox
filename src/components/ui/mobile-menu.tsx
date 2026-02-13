import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { NAV_LINKS } from '@/consts'
import { Sun, Moon, ExternalLink, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type Theme,
  getValidTheme,
  getStorageItem,
  applyTheme,
} from '@/lib/theme'

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const hasBeenOpenRef = useRef(false)

  // SSR guard — portal needs document.body
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync theme & reset menu after Astro view transitions
  useEffect(() => {
    const onSwap = () => {
      setIsOpen(false)
      const stored = getStorageItem('theme')
      setCurrentTheme(getValidTheme(stored))
    }
    onSwap() // init on mount
    document.addEventListener('astro:after-swap', onSwap)
    return () => document.removeEventListener('astro:after-swap', onSwap)
  }, [])

  // Lock body scroll while overlay is open
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

  // Auto-close when viewport reaches desktop breakpoint
  useEffect(() => {
    if (!isOpen) return

    const mq = window.matchMedia('(min-width: 768px)')

    if (mq.matches) {
      setIsOpen(false)
      return
    }

    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsOpen(false)
    }

    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [isOpen])

  // Focus management: move focus into overlay on open, return on close.
  // Only return focus if the menu has been opened at least once (avoids
  // stealing focus on initial mount).
  useEffect(() => {
    if (isOpen) {
      hasBeenOpenRef.current = true
      const id = setTimeout(() => closeRef.current?.focus(), 100)
      return () => clearTimeout(id)
    }

    if (hasBeenOpenRef.current) {
      triggerRef.current?.focus()
    }
  }, [isOpen])

  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const handleThemeChange = useCallback((theme: Theme) => {
    setCurrentTheme(theme)
    applyTheme(theme)
  }, [])

  // Navigate from menu link.
  // Same page → just close. Different page → navigate instantly via Astro.
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      // External links: let the browser handle them normally
      if (href.startsWith('http')) return

      // Already on this page — just close, skip navigation entirely
      const currentPath = window.location.pathname
      if (currentPath === href || currentPath === href.replace(/\/$/, '')) {
        e.preventDefault()
        close()
        return
      }

      // Different internal page: let the <a> navigate normally.
      // Astro view transitions handle the smooth page change.
      // Menu state is reset by the astro:after-swap listener above.
    },
    [close],
  )

  // Keyboard handler: Escape to close + focus trap (Tab / Shift+Tab)
  const handleOverlayKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        return
      }

      // Focus trap — keep Tab cycling within the overlay
      if (e.key === 'Tab') {
        const container = overlayRef.current
        if (!container) return

        const focusable = container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    [close],
  )

  /* ------------------------------------------------------------------ */
  /*  Overlay — portaled to document.body so it escapes header stacking  */
  /* ------------------------------------------------------------------ */
  const overlay = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className={cn(
        'fixed inset-0 z-[100] bg-background transition-[opacity,visibility] duration-150 ease-out md:hidden',
        isOpen ? 'visible opacity-100' : 'invisible opacity-0',
      )}
      onKeyDown={handleOverlayKeyDown}
    >
      {/* Close button — positioned to match the header trigger location */}
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-end px-4">
        <button
          ref={closeRef}
          onClick={close}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-foreground/5"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Menu content */}
      <nav className="flex h-[calc(100%-4rem)] flex-col justify-between px-8 pt-8 pb-12">
        {/* Navigation links */}
        <div className="flex flex-col gap-2">
          {NAV_LINKS.map((item, index) => {
            const isExternal = item.href.startsWith('http')
            const isInsideLink = item.label.toLowerCase() === 'inside'
            const showExternalIcon = isExternal || isInsideLink

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-4 py-4 transition-all duration-150 ease-out',
                  isOpen
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0',
                  isInsideLink
                    ? 'text-primary hover:bg-primary/5'
                    : 'text-foreground hover:bg-foreground/5',
                )}
                style={{
                  transitionDelay: isOpen ? `${50 + index * 40}ms` : '0ms',
                }}
              >
                <span className="text-3xl font-semibold tracking-tight">
                  {item.label}
                </span>
                {showExternalIcon && (
                  <ExternalLink
                    className="h-5 w-5 opacity-40 transition-opacity group-hover:opacity-80"
                    aria-hidden="true"
                  />
                )}
              </a>
            )
          })}
        </div>

        {/* Theme toggle */}
        <div
          className={cn(
            'transition-all duration-150 ease-out',
            isOpen
              ? 'translate-y-0 opacity-100'
              : 'translate-y-4 opacity-0',
          )}
          style={{
            transitionDelay: isOpen
              ? `${50 + NAV_LINKS.length * 40 + 40}ms`
              : '0ms',
          }}
        >
          <div className="h-px bg-border/60 mb-6" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Theme
            </span>
            <div className="flex gap-1 rounded-full bg-muted/40 p-1">
              {(['light', 'dark'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300',
                    currentTheme === theme
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-label={`Switch to ${theme} mode`}
                >
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  <span className="capitalize">{theme}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  )

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="md:hidden">
      {/* Trigger — stays in the header */}
      <button
        ref={triggerRef}
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-foreground/5"
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <div className="flex h-5 w-5 flex-col items-center justify-center gap-[5px]">
          <span className="block h-[1.5px] w-5 rounded-full bg-foreground" />
          <span className="block h-[1.5px] w-5 rounded-full bg-foreground" />
          <span className="block h-[1.5px] w-5 rounded-full bg-foreground" />
        </div>
      </button>

      {/* Overlay — portaled to body to escape header stacking context */}
      {mounted && createPortal(overlay, document.body)}
    </div>
  )
}

export default MobileMenu
