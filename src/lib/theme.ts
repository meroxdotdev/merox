/**
 * Theme and color palette configuration
 * Single source of truth for theme-related constants
 */

export const COLOR_PALETTES = [
  { id: 'blue', name: 'Blue', color: 'hsl(214 95% 52%)' },
  { id: 'green', name: 'Green', color: 'hsl(142 76% 36%)' },
  { id: 'purple', name: 'Purple', color: 'hsl(262 83% 58%)' },
  { id: 'orange', name: 'Orange', color: 'hsl(25 95% 53%)' },
  { id: 'rose', name: 'Rose', color: 'hsl(346 77% 50%)' },
  { id: 'cyan', name: 'Cyan', color: 'hsl(188 94% 43%)' },
  { id: 'teal', name: 'Teal', color: 'hsl(173 80% 40%)' },
] as const

export type PaletteId = (typeof COLOR_PALETTES)[number]['id']

export const DEFAULT_PALETTE: PaletteId = 'blue'

export const VALID_PALETTE_IDS = COLOR_PALETTES.map((p) => p.id) as readonly PaletteId[]

export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

/**
 * Storage keys for theme preferences
 */
export const STORAGE_KEYS = {
  THEME: 'theme',
  COLOR_PALETTE: 'color-palette',
} as const

/**
 * Safely get an item from localStorage with error handling
 */
export function getStorageItem(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
    return null
  }
}

/**
 * Safely set an item in localStorage with error handling
 */
export function setStorageItem(key: string, value: string): boolean {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
      return true
    }
    return false
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
    return false
  }
}

/**
 * Validate and get a valid palette ID from storage or default
 */
export function getValidPalette(stored: string | null): PaletteId {
  if (stored && VALID_PALETTE_IDS.includes(stored as PaletteId)) {
    return stored as PaletteId
  }
  return DEFAULT_PALETTE
}

/**
 * Validate and get a valid theme from storage or system preference
 */
export function getValidTheme(stored: string | null): Theme {
  if (stored && THEMES.includes(stored as Theme)) {
    return stored as Theme
  }
  // Fallback to system preference
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return 'light'
}

/**
 * Apply palette to document element
 */
export function applyPalette(palette: PaletteId): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-palette', palette)
  setStorageItem(STORAGE_KEYS.COLOR_PALETTE, palette)
  
  // Dispatch custom event to notify other components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('palette-change', { detail: { palette } }))
  }
}

/**
 * Apply theme to document element
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  
  const element = document.documentElement
  
  // Disable transitions during theme change for instant switch
  element.classList.add('[&_*]:transition-none')
  element.setAttribute('data-theme', theme)
  // Force a reflow to ensure the class is applied
  window.getComputedStyle(element).getPropertyValue('opacity')
  
  // Re-enable transitions after the change
  requestAnimationFrame(() => {
    element.classList.remove('[&_*]:transition-none')
  })
  
  setStorageItem(STORAGE_KEYS.THEME, theme)
  
  // Dispatch custom event to notify other components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }))
  }
}

