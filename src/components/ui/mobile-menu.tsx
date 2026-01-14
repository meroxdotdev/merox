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
import { Menu, ExternalLink, Palette, Sun, Moon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COLOR_PALETTES,
  DEFAULT_PALETTE,
  THEMES,
  type PaletteId,
  type Theme,
  getValidPalette,
  getValidTheme,
  getStorageItem,
  applyPalette as applyPaletteUtil,
  applyTheme as applyThemeUtil,
} from '@/lib/theme'

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPalette, setCurrentPalette] = useState<PaletteId>(DEFAULT_PALETTE)
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
    const storedPalette = getStorageItem('color-palette')
    setCurrentTheme(getValidTheme(storedTheme))
    setCurrentPalette(getValidPalette(storedPalette))
  }, [])

  useEffect(() => {
    // Restore after navigation
    const handleAfterSwap = () => {
      const storedTheme = getStorageItem('theme')
      const storedPalette = getStorageItem('color-palette')
      setCurrentTheme(getValidTheme(storedTheme))
      setCurrentPalette(getValidPalette(storedPalette))
    }
    
    // Listen for changes from other components
    const handleThemeChange = (e: CustomEvent<{ theme: Theme }>) => {
      setCurrentTheme(e.detail.theme)
    }
    
    const handlePaletteChange = (e: CustomEvent<{ palette: PaletteId }>) => {
      setCurrentPalette(e.detail.palette)
    }
    
    document.addEventListener('astro:after-swap', handleAfterSwap)
    window.addEventListener('theme-change', handleThemeChange as EventListener)
    window.addEventListener('palette-change', handlePaletteChange as EventListener)
    
    return () => {
      document.removeEventListener('astro:after-swap', handleAfterSwap)
      window.removeEventListener('theme-change', handleThemeChange as EventListener)
      window.removeEventListener('palette-change', handlePaletteChange as EventListener)
    }
  }, [])

  const isExternalLink = (href: string) => {
    return href.startsWith('http')
  }

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme)
    applyThemeUtil(theme)
  }

  const handlePaletteChange = (palette: PaletteId) => {
    setCurrentPalette(palette)
    applyPaletteUtil(palette)
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
          
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all",
                  currentTheme === theme
                    ? "bg-popover text-popover-foreground shadow-lg ring-1 ring-border/50"
                    : "bg-muted/30 text-foreground/60 hover:bg-muted/40"
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
          
          <div className="grid grid-cols-4 gap-2 mt-2">
            {COLOR_PALETTES.map((palette) => (
              <button
                key={palette.id}
                onClick={() => handlePaletteChange(palette.id)}
                className={cn(
                  "relative flex items-center justify-center aspect-square rounded-full transition-all group",
                  currentPalette === palette.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "hover:scale-110"
                )}
                title={palette.name}
                aria-label={`Select ${palette.name} color palette`}
                aria-pressed={currentPalette === palette.id}
              >
                <div
                  className="size-full rounded-full border border-black/5 dark:border-white/5 shadow-inner"
                  style={{ backgroundColor: palette.color }}
                  aria-hidden="true"
                />
                {currentPalette === palette.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white mix-blend-difference" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MobileMenu
