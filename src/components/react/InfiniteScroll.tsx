import React from 'react'

interface InfiniteScrollProps {
  children: React.ReactNode
  duration?: number
  direction?: 'normal' | 'reverse'
  showFade?: boolean
  className?: string
}

export function InfiniteScroll({
  children,
  duration = 40000,
  direction = 'normal',
  showFade = true,
  className = '',
}: InfiniteScrollProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showFade && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />
        </>
      )}
      <div
        className="flex w-max animate-scroll items-center gap-0"
        style={{
          animationDuration: `${duration}ms`,
          animationDirection: direction,
          willChange: 'transform',
        }}
      >
        {/* Duplicăm conținutul de 3 ori pentru loop perfect seamless */}
        {children}
        {children}
        {children}
      </div>
    </div>
  )
}