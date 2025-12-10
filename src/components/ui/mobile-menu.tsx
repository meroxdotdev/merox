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
        <Button variant="outline" size="icon" className="md:hidden" title="Menu">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background">
        {NAV_LINKS.map((item) => {
          const isExternal = isExternalLink(item.href)
          const isInsideLink = item.label.toLowerCase() === 'inside'
          return (
            <DropdownMenuItem key={item.href} asChild>
              <a
                href={item.href}
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className={`w-full text-lg font-medium capitalize flex items-center gap-2 ${
                  isInsideLink ? 'text-primary hover:text-primary/80' : isExternal ? 'text-primary/90 hover:text-primary' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span>{item.label}</span>
                {isExternal && (
                  <ExternalLink className={`h-4 w-4 opacity-80 flex-shrink-0 ${isInsideLink ? 'text-primary' : ''}`} aria-hidden="true" />
                )}
              </a>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        {/* Theme Mode */}
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-1.5 mb-2 px-2">
            <span className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
              Mode
            </span>
          </div>
          <div className="space-y-1">
            {THEMES.map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`
                  w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs
                  transition-colors
                  ${
                    currentTheme === theme
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/60 hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                {theme === 'dark' ? (
                  <Moon className="h-3 w-3" />
                ) : (
                  <Sun className="h-3 w-3" />
                )}
                <span className="capitalize">{theme}</span>
                {currentTheme === theme && (
                  <Check className="h-3 w-3 ml-auto text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
        <DropdownMenuSeparator />
        {/* Color Palette */}
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-1.5 mb-2 px-2">
            <Palette className="h-3 w-3 text-foreground/40" />
            <span className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
              Palette
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {COLOR_PALETTES.map((palette) => (
              <button
                key={palette.id}
                onClick={() => handlePaletteChange(palette.id)}
                className={`
                  flex items-center gap-1.5 px-2 py-1.5 rounded text-xs
                  transition-colors
                  ${
                    currentPalette === palette.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/60 hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <div
                  className="size-2.5 rounded-full border border-border/40 flex-shrink-0"
                  style={{ backgroundColor: palette.color }}
                  aria-hidden="true"
                />
                <span className="capitalize">{palette.name}</span>
                {currentPalette === palette.id && (
                  <Check className="h-3 w-3 ml-auto text-primary" />
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
