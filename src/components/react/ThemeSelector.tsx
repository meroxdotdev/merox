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
import { cn } from '@/lib/utils'
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
          variant="ghost"
          size="icon"
          title="Theme & appearance"
          className={cn(
            "size-9 rounded-full transition-all duration-200 hover:bg-foreground/5",
            className
          )}
          aria-label="Theme & appearance"
        >
          {currentTheme === 'dark' ? (
            <Moon className="h-[1.1rem] w-[1.1rem] transition-all" aria-hidden="true" />
          ) : (
            <Sun className="h-[1.1rem] w-[1.1rem] transition-all" aria-hidden="true" />
          )}
          <span className="sr-only">Theme & appearance</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-popover/95 backdrop-blur-xl border-border/40 min-w-[220px] p-3 rounded-2xl shadow-2xl"
      >
        {/* Theme Mode Section */}
        <div className="mb-4">
          <div className="px-2 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.1em]">
              Appearance
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/30 rounded-xl">
            {THEMES.map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={cn(
                  "flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  currentTheme === theme
                    ? "bg-popover text-popover-foreground shadow-sm ring-1 ring-border/50"
                    : "text-foreground/50 hover:text-foreground hover:bg-muted/20"
                )}
                aria-label={`Switch to ${theme} theme`}
                aria-pressed={currentTheme === theme}
              >
                {theme === 'dark' ? (
                  <Moon className="size-3.5" />
                ) : (
                  <Sun className="size-3.5" />
                )}
                <span className="capitalize">{theme}</span>
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className="mb-4 bg-border/40" />

        {/* Color Palette Section */}
        <div>
          <div className="px-2 mb-3 flex items-center gap-1.5">
            <Palette className="h-3 w-3 text-foreground/30" />
            <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.1em]">
              Accent Color
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2 px-1">
            {COLOR_PALETTES.map((palette) => (
              <button
                key={palette.id}
                onClick={() => handlePaletteChange(palette.id)}
                className={cn(
                  "group relative flex items-center justify-center aspect-square rounded-full transition-all duration-300",
                  currentPalette === palette.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                    : "hover:scale-110"
                )}
                title={palette.name}
                aria-label={`Select ${palette.name} color palette`}
                aria-pressed={currentPalette === palette.id}
              >
                <div
                  className="size-full rounded-full border border-black/5 dark:border-white/5 shadow-inner transition-transform group-hover:scale-90"
                  style={{ backgroundColor: palette.color }}
                  aria-hidden="true"
                />
                {currentPalette === palette.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white mix-blend-difference" />
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

