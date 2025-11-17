import React, { useMemo } from 'react'

interface InfiniteScrollProps {
  children: React.ReactNode
  duration?: number
  direction?: 'normal' | 'reverse'
  showFade?: boolean
  className?: string
}

export const InfiniteScroll = React.memo(function InfiniteScroll({
  children,
  duration = 40000,
  direction = 'normal',
  showFade = true,
  className = '',
}: InfiniteScrollProps) {
  // Memoize the style object to prevent unnecessary re-renders
  const scrollStyle = useMemo(
    () => ({
      animationDuration: `${duration}ms`,
      animationDirection: direction,
    }),
    [duration, direction]
  )

  // Memoize fade gradients to prevent re-renders
  const fadeGradients = useMemo(
    () =>
      showFade ? (
        <>
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />
        </>
      ) : null,
    [showFade]
  )

  // Memoize duplicated children to prevent recreation on every render
  const duplicatedChildren = useMemo(
    () => (
      <>
        {children}
        {children}
        {children}
      </>
    ),
    [children]
  )

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {fadeGradients}
      <div
        className="flex w-max animate-scroll items-center gap-0"
        style={scrollStyle}
      >
        {duplicatedChildren}
      </div>
    </div>
  )
})