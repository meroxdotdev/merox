'use client'

import { useBrowserInfo } from '@/hooks/useBrowserInfo'

export default function BrowserInfoPanel() {
  const browserInfo = useBrowserInfo()

  return (
    <div className="fixed bottom-4 left-4 pointer-events-none z-[60] font-mono text-[10px] leading-relaxed">
      <div className="text-foreground/80 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-primary/60 font-semibold">$</span>
          <span className="text-muted-foreground/70">Client:</span>
          <span className="text-foreground/90 font-semibold">{browserInfo.client}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-primary/60 font-semibold">$</span>
          <span className="text-muted-foreground/70">VIEWPORT:</span>
          <span className="text-foreground/90 font-semibold">{browserInfo.viewport}</span>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-muted-foreground/70">SCREEN:</span>
          <span className="text-foreground/90 font-semibold">{browserInfo.screen}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary/60 font-semibold">$</span>
          <span className="text-muted-foreground/70">DEPTH:</span>
          <span className="text-primary/90 font-semibold">{browserInfo.depth}</span>
        </div>
      </div>
    </div>
  )
}
