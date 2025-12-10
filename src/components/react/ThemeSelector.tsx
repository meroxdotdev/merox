import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Palette, Sun, Moon, Check } from 'lucide-react'
import {
  COLOR_PALETTES,
  DEFAULT_PALETTE,
  type PaletteId,
  type Theme,
  THEMES,
  getValidPalette,
  getValidTheme,
  getStorageItem,
  applyPalette as applyPaletteUtil,
  applyTheme as applyThemeUtil,
} from '@/lib/theme'

interface ThemeSelectorProps {
  className?: string
}

export default function ThemeSelector({ className }: ThemeSelectorProps = {}) {
  const [currentPalette, setCurrentPalette] = useState<PaletteId>(DEFAULT_PALETTE)
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')
  const [isOpen, setIsOpen] = useState(false)

  const initializeTheme = useCallback(() => {
    const storedTheme = getStorageItem('theme')
    const theme = getValidTheme(storedTheme)
    setCurrentTheme(theme)
    applyThemeUtil(theme)
  }, [])

  const initializePalette = useCallback(() => {
    const stored = getStorageItem('color-palette')
    const palette = getValidPalette(stored)
    setCurrentPalette(palette)
    applyPaletteUtil(palette)
  }, [])

  useEffect(() => {
    initializeTheme()
    initializePalette()
  }, [initializeTheme, initializePalette])

  useEffect(() => {
    // Close menu on navigation start
    const handleBeforeSwap = () => {
      setIsOpen(false)
    }
    document.addEventListener('astro:before-swap', handleBeforeSwap)
    return () => {
      document.removeEventListener('astro:before-swap', handleBeforeSwap)
    }
  }, [])

  useEffect(() => {
    // Restore after navigation
    const handleAfterSwap = () => {
      initializeTheme()
      initializePalette()
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
  }, [initializeTheme, initializePalette])

  const handleThemeChange = useCallback((theme: Theme) => {
    setCurrentTheme(theme)
    applyThemeUtil(theme)
  }, [])

  const handlePaletteChange = useCallback((palette: PaletteId) => {
    setCurrentPalette(palette)
    applyPaletteUtil(palette)
  }, [])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="Theme & appearance"
          className={className || "size-9 border md:border-0 md:bg-transparent md:hover:bg-muted md:-my-2 md:-me-2 md:size-8"}
          aria-label="Theme & appearance"
        >
          {currentTheme === 'dark' ? (
            <Moon className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
          ) : (
            <Sun className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
          )}
          <span className="sr-only">Theme & appearance</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background min-w-[180px] p-1.5">
        {/* Theme Mode Section */}
        <div className="px-2 py-1.5 mb-1">
          <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">
            Mode
          </span>
        </div>
        <div className="px-1 mb-1">
          {THEMES.map((theme) => (
            <DropdownMenuItem
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className="flex items-center justify-between cursor-pointer px-2 py-1.5 text-sm"
            >
              <div className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <Moon className="size-3.5" />
                ) : (
                  <Sun className="size-3.5" />
                )}
                <span className="capitalize">{theme}</span>
              </div>
              {currentTheme === theme && (
                <Check className="size-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className="my-1" />

        {/* Color Palette Section */}
        <div className="px-2 py-1.5 mb-1">
          <div className="flex items-center gap-1.5">
            <Palette className="h-3 w-3 text-foreground/40" />
            <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">
              Palette
            </span>
          </div>
        </div>
        <div className="px-1">
          {COLOR_PALETTES.map((palette) => (
            <DropdownMenuItem
              key={palette.id}
              onClick={() => handlePaletteChange(palette.id)}
              className="flex items-center justify-between cursor-pointer px-2 py-1.5 text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="size-3 rounded-full border border-border/50 flex-shrink-0"
                  style={{ backgroundColor: palette.color }}
                  aria-hidden="true"
                />
                <span className="capitalize">{palette.name}</span>
              </div>
              {currentPalette === palette.id && (
                <Check className="size-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

