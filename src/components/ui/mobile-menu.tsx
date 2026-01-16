import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAV_LINKS } from '@/consts'
import { Menu, ExternalLink, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DEFAULT_PALETTE,
  THEMES,
  type Theme,
  getValidTheme,
  getStorageItem,
  applyPalette as applyPaletteUtil,
  applyTheme as applyThemeUtil,
} from '@/lib/theme'

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')

  useEffect(() => {
    const handleViewTransitionStart = () => {
      setIsOpen(false)
    }
    document.addEventListener('astro:before-swap', handleViewTransitionStart)
    return () => {
      document.removeEventListener('astro:before-swap', handleViewTransitionStart)
    }
  }, [])

  useEffect(() => {
    // Initialize theme and palette
    const storedTheme = getStorageItem('theme')
    setCurrentTheme(getValidTheme(storedTheme))
    // Always use default blue palette
    applyPaletteUtil(DEFAULT_PALETTE)
  }, [])

  useEffect(() => {
    // Restore after navigation
    const handleAfterSwap = () => {
      const storedTheme = getStorageItem('theme')
      setCurrentTheme(getValidTheme(storedTheme))
      // Always use default blue palette
      applyPaletteUtil(DEFAULT_PALETTE)
    }
    
    // Listen for changes from other components
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

  const isExternalLink = (href: string) => {
    return href.startsWith('http')
  }

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme)
    applyThemeUtil(theme)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-foreground/5 size-9" title="Menu">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl border-border/40 min-w-[240px] p-2 rounded-2xl shadow-2xl">
        <div className="flex flex-col gap-1">
          {NAV_LINKS.map((item) => {
            const isExternal = isExternalLink(item.href)
            const isInsideLink = item.label.toLowerCase() === 'inside'
            return (
              <DropdownMenuItem key={item.href} asChild>
                <a
                  href={item.href}
                  target={isExternal ? '_blank' : '_self'}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3 text-base font-medium transition-all rounded-xl",
                    isInsideLink 
                      ? "bg-primary/5 text-primary" 
                      : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <span>{item.label}</span>
                  {isExternal && (
                    <ExternalLink className="h-4 w-4 opacity-50" aria-hidden="true" />
                  )}
                </a>
              </DropdownMenuItem>
            )
          })}
        </div>
        
        <DropdownMenuSeparator className="my-2 bg-border/40" />
        
        <div className="p-2">
          <div className="px-2 mb-2">
            <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.1em]">
              Appearance
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/20 rounded-xl">
            {THEMES.map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all",
                  currentTheme === theme
                    ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/20"
                    : "bg-transparent text-foreground/50 hover:bg-foreground/5 hover:text-foreground/70"
                )}
                aria-label={`Switch to ${theme} theme`}
                aria-pressed={currentTheme === theme}
              >
                {theme === 'dark' ? (
                  <Moon className="h-3.5 w-3.5" />
                ) : (
                  <Sun className="h-3.5 w-3.5" />
                )}
                <span className="capitalize">{theme}</span>
              </button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MobileMenu
