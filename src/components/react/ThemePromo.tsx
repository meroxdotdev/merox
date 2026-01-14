import React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Info, Check, Github, BookOpen, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemePromoProps {
  className?: string
}

const ThemePromo: React.FC<ThemePromoProps> = ({ className }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="About this theme"
          className={cn(
            "rounded-md transition-all duration-200 hover:bg-foreground/5 text-muted-foreground hover:text-foreground",
            className
          )}
          aria-label="About this theme"
        >
          <Info className="h-3 w-3 transition-all" aria-hidden="true" />
          <span className="sr-only">About this theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        side="top"
        sideOffset={8}
        className="bg-popover/95 backdrop-blur-xl border-border/40 w-80 p-5 rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground mb-1">
            merox-erudite
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A batteries-included Astro blogging theme with newsletter, comments, analytics, and more.
          </p>
        </div>

        {/* Features List */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>Newsletter integration (Brevo)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>Comments (Giscus)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>Analytics support</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>SEO enhancements</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
          <a
            href="https://astro.build/themes/details/merox-erudite/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Get theme on Astro</span>
          </a>
          <a
            href="https://github.com/meroxdotdev/merox-erudite"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md border border-border/60 bg-background text-foreground text-sm font-medium transition-all duration-200 hover:bg-muted/50 hover:border-border active:scale-[0.98]"
          >
            <Github className="w-4 h-4" />
            <span>View on GitHub</span>
          </a>
          <a
            href="https://merox.dev/blog/merox-erudite-theme"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md border border-border/60 bg-background text-foreground text-sm font-medium transition-all duration-200 hover:bg-muted/50 hover:border-border active:scale-[0.98]"
          >
            <BookOpen className="w-4 h-4" />
            <span>Learn more</span>
          </a>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ThemePromo

