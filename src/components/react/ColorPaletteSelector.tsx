import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Palette, Check } from 'lucide-react'
import {
  COLOR_PALETTES,
  DEFAULT_PALETTE,
  type PaletteId,
  getValidPalette,
  getStorageItem,
  applyPalette as applyPaletteUtil,
} from '@/lib/theme'

interface ColorPaletteSelectorProps {
  className?: string
}

export default function ColorPaletteSelector({ className }: ColorPaletteSelectorProps = {}) {
  const [currentPalette, setCurrentPalette] = useState<PaletteId>(DEFAULT_PALETTE)
  const [isOpen, setIsOpen] = useState(false)

  const initializePalette = useCallback(() => {
    const stored = getStorageItem('color-palette')
    const palette = getValidPalette(stored)
    setCurrentPalette(palette)
    applyPaletteUtil(palette)
  }, [])

  useEffect(() => {
    initializePalette()
  }, [initializePalette])

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
    // Restore palette after navigation
    const handleAfterSwap = () => {
      initializePalette()
    }
    
    // Listen for palette changes from other components (e.g., mobile menu)
    const handlePaletteChange = (e: CustomEvent<{ palette: PaletteId }>) => {
      setCurrentPalette(e.detail.palette)
    }
    
    document.addEventListener('astro:after-swap', handleAfterSwap)
    window.addEventListener('palette-change', handlePaletteChange as EventListener)
    
    return () => {
      document.removeEventListener('astro:after-swap', handleAfterSwap)
      window.removeEventListener('palette-change', handlePaletteChange as EventListener)
    }
  }, [initializePalette])

  const handlePaletteChange = useCallback((palette: PaletteId) => {
    setCurrentPalette(palette)
    applyPaletteUtil(palette)
    setIsOpen(false)
  }, [])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Color palette"
          className={className || "-my-2 -me-2 size-8"}
        >
          <Palette className="size-4" />
          <span className="sr-only">Color palette</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background min-w-[160px] p-1.5">
        <div className="px-2 py-1.5 mb-1">
          <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">
            Palette
          </span>
        </div>
        <DropdownMenuSeparator className="my-1" />
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

