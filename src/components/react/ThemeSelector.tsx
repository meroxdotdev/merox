import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DEFAULT_PALETTE,
  type Theme,
  getValidTheme,
  getStorageItem,
  applyPalette as applyPaletteUtil,
  applyTheme as applyThemeUtil,
} from '@/lib/theme'

interface ThemeSelectorProps {
  className?: string
}

export default function ThemeSelector({ className }: ThemeSelectorProps = {}) {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')

  const initializeTheme = useCallback(() => {
    const storedTheme = getStorageItem('theme')
    const theme = getValidTheme(storedTheme)
    setCurrentTheme(theme)
    applyThemeUtil(theme)
  }, [])

  const initializePalette = useCallback(() => {
    // Always reset palette to blue (default)
    applyPaletteUtil(DEFAULT_PALETTE)
  }, [])

  useEffect(() => {
    initializeTheme()
    initializePalette()
  }, [initializeTheme, initializePalette])

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
    
    document.addEventListener('astro:after-swap', handleAfterSwap)
    window.addEventListener('theme-change', handleThemeChange as EventListener)
    
    return () => {
      document.removeEventListener('astro:after-swap', handleAfterSwap)
      window.removeEventListener('theme-change', handleThemeChange as EventListener)
    }
  }, [initializeTheme, initializePalette])

  const handleToggle = useCallback(() => {
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark'
    setCurrentTheme(newTheme)
    applyThemeUtil(newTheme)
  }, [currentTheme])

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Toggle theme"
      onClick={handleToggle}
      className={cn(
        "-my-2 -me-2 size-8",
        className
      )}
      aria-label="Toggle theme"
    >
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="size-4 hidden dark:block" aria-hidden="true" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

