'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { cn } from '@/lib/utils'

interface InfiniteScrollProps {
  className?: string
  duration?: number
  direction?: 'normal' | 'reverse'
  showFade?: boolean
  children: React.ReactNode
  pauseOnHover?: boolean
}

export function InfiniteScroll({
  className,
  duration = 15000,
  direction = 'normal',
  showFade = true,
  children,
  pauseOnHover = true,
}: InfiniteScrollProps) {
  const [contentWidth, setContentWidth] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()
  const elapsedTimeRef = useRef(0)
  const lastTimeRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Optimized width calculation with proper cleanup
  const updateWidth = useCallback(() => {
    const content = contentRef.current
    if (!content) return

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const width = content.offsetWidth
      if (width > 0) {
        setContentWidth((prevWidth) => {
          // Only update if width actually changed to prevent unnecessary re-renders
          return prevWidth !== width ? width : prevWidth
        })
      }
    })
  }, [])

  // Setup ResizeObserver and window resize listener
  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    // Initial width calculation
    updateWidth()

    // Use ResizeObserver for better performance
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      try {
        resizeObserverRef.current = new window.ResizeObserver(() => {
          updateWidth()
        })
        resizeObserverRef.current.observe(content)
      } catch (error) {
        // Fallback for browsers that don't support ResizeObserver
        if (import.meta.env.DEV) {
          console.warn('ResizeObserver error, using window resize fallback', error)
        }
      }
    }

    // Fallback for older browsers
    window.addEventListener('resize', updateWidth, { passive: true })

    return () => {
      // Cleanup ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
      // Cleanup window listener
      window.removeEventListener('resize', updateWidth)
      // Cleanup animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [updateWidth])

  // Animation effect - only runs when contentWidth is available
  useEffect(() => {
    if (!contentWidth) return

    const startX = direction === 'normal' ? 0 : -contentWidth
    const endX = direction === 'normal' ? -contentWidth : 0

    if (!isPaused) {
      const remainingDuration = duration - elapsedTimeRef.current
      const progress = elapsedTimeRef.current / duration
      const currentX =
        direction === 'normal'
          ? startX + (endX - startX) * progress
          : endX + (startX - endX) * (1 - progress)

      controls.set({ x: currentX })
      controls.start({
        x: endX,
        transition: {
          duration: remainingDuration / 1000,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
          repeatDelay: 0,
        },
      })

      lastTimeRef.current = Date.now()
    }
  }, [controls, direction, duration, contentWidth, isPaused])

  const handleMouseEnter = useCallback(() => {
    if (!pauseOnHover) return

    const currentTime = Date.now()
    const deltaTime = currentTime - lastTimeRef.current
    elapsedTimeRef.current = (elapsedTimeRef.current + deltaTime) % duration

    setIsPaused(true)
    controls.stop()
  }, [pauseOnHover, duration, controls])

  const handleMouseLeave = useCallback(() => {
    if (!pauseOnHover) return
    lastTimeRef.current = Date.now()
    setIsPaused(false)
  }, [pauseOnHover])

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // If reduced motion is preferred, don't animate
  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          'relative flex shrink-0 flex-col gap-4 overflow-x-auto py-3 sm:py-2 sm:gap-2',
          className,
        )}
      >
        <div className="flex shrink-0">{children}</div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 flex-col gap-4 overflow-hidden py-3 sm:py-2 sm:gap-2',
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={
        showFade
          ? {
              maskImage:
                'linear-gradient(to right, transparent 0%, black 80px, black calc(100% - 80px), transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 80px, black calc(100% - 80px), transparent 100%)',
            }
          : undefined
      }
    >
      <div className="flex">
        <motion.div
          ref={scrollerRef}
          className="flex shrink-0"
          animate={controls}
          style={{ willChange: 'transform' }}
        >
          <div ref={contentRef} className="flex shrink-0">
            {children}
          </div>
          <div className="flex shrink-0" aria-hidden="true">
            {children}
          </div>
          <div className="flex shrink-0" aria-hidden="true">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
