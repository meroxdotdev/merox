'use client'

import { useTimeInfo } from '@/hooks/useTimeInfo'

export default function TimeInfoPanel() {
  const timeInfo = useTimeInfo()

  return (
    <div className="fixed bottom-4 right-4 pointer-events-none z-[60] font-mono text-[10px] leading-relaxed">
      <div className="text-foreground/80 space-y-1 text-right">
        <div className="flex items-center gap-2 justify-end">
          <span className="text-primary/60 font-semibold">$</span>
          <span className="text-muted-foreground/70">UTC:</span>
          <span className="text-foreground/90 font-semibold">{timeInfo.utc}</span>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-muted-foreground/70">LOCAL:</span>
          <span className="text-foreground/90 font-semibold">{timeInfo.local}</span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-primary/60 font-semibold">$</span>
          <span className="text-muted-foreground/70">UNIX:</span>
          <span className="text-foreground/90 font-semibold">{timeInfo.unix}</span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-primary/60 font-semibold">$</span>
          <span className="text-muted-foreground/70">ZONE:</span>
          <span className="text-foreground/90 font-semibold">{timeInfo.zone}</span>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-muted-foreground/70">STATUS:</span>
          <span className="text-primary/90 font-semibold">{timeInfo.status}</span>
        </div>
      </div>
    </div>
  )
}
