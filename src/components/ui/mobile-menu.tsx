import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAV_LINKS } from '@/consts'
import { Menu, Sun, Moon, ExternalLink } from 'lucide-react'
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

  useEffect(() => {
    const initTheme = () => {
      const stored = getStorageItem('theme')
      setCurrentTheme(getValidTheme(stored))
    }
    initTheme()
    document.addEventListener('astro:after-swap', initTheme)
    return () => document.removeEventListener('astro:after-swap', initTheme)
  }, [])

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme)
    applyTheme(theme)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden rounded-full h-9 w-9"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        sideOffset={8}
        className="min-w-[200px] p-2 rounded-xl bg-background border shadow-lg"
      >
        <div className="flex flex-col gap-1">
          {NAV_LINKS.map((item) => {
            const isExternal = item.href.startsWith('http')
            const isInsideLink = item.label.toLowerCase() === 'inside'
            // Treat "Inside" as external link (always show external icon)
            const showExternalIcon = isExternal || isInsideLink
            
            return (
              <DropdownMenuItem key={item.href} asChild>
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isInsideLink
                      ? "text-primary hover:bg-primary/5"
                      : "hover:bg-accent"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <span>{item.label}</span>
                  {showExternalIcon && (
                    <ExternalLink className="h-3.5 w-3.5 opacity-60 shrink-0" aria-hidden="true" />
                  )}
                </a>
              </DropdownMenuItem>
            )
          })}
        </div>
        
        <div className="h-px bg-border my-2" />
        
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
          {(['light', 'dark'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={cn(
                "flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all",
                currentTheme === theme ? "bg-background shadow-sm" : "opacity-50 hover:opacity-100"
              )}
            >
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              <span className="capitalize">{theme}</span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MobileMenu