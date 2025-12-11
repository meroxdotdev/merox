'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion'
import { cn } from '@/lib/utils'

interface InfiniteScrollProps {
  className?: string
  duration?: number
  direction?: 'normal' | 'reverse'
  showFade?: boolean
  children: React.ReactNode
  pauseOnHover?: boolean
}

/**
 * InfiniteScroll Component
 * 
 * Creates a smooth infinite scrolling animation using Framer Motion.
 * Supports pause on hover, bidirectional scrolling, and accessibility features.
 * 
 * @example
 * <InfiniteScroll duration={15000} direction="normal" pauseOnHover>
 *   {items}
 * </InfiniteScroll>
 */

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
  // Motion value for smooth transform animation
  const x = useMotionValue(0)
  
  // Refs for animation state management
  const animationFrameRef = useRef<number | undefined>(undefined)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const pauseStartTimeRef = useRef<number | null>(null)
  const pausedPositionRef = useRef<number | null>(null)

  /**
   * Calculates and updates the content width.
   * Uses requestAnimationFrame for optimal performance.
   */
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

  /**
   * Sets up ResizeObserver and window resize listener for responsive width updates.
   * Properly cleans up all observers and listeners on unmount.
   */
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

  /**
   * Initializes animation when content width is available.
   * Resets animation state when content width or direction changes.
   */
  useEffect(() => {
    if (!contentWidth) return

    const startX = direction === 'normal' ? 0 : -contentWidth
    x.set(startX)
    startTimeRef.current = null // Will be set on first animation frame
    pauseStartTimeRef.current = null
  }, [contentWidth, direction, x])

  /**
   * Handles pause/resume state changes.
   * Adjusts animation timing to prevent visual jumps when pausing/resuming.
   */
  useEffect(() => {
    if (!contentWidth || startTimeRef.current === null) return

    if (isPaused) {
      // When pausing, store the current position and pause time
      if (pauseStartTimeRef.current === null) {
        pausedPositionRef.current = x.get()
        pauseStartTimeRef.current = performance.now()
      }
    } else {
      // When resuming, adjust the start time to account for pause duration
      // This ensures the animation continues smoothly from where it paused
      if (pauseStartTimeRef.current !== null) {
        const pauseDuration = performance.now() - pauseStartTimeRef.current
        startTimeRef.current += pauseDuration
        pauseStartTimeRef.current = null
        pausedPositionRef.current = null
      }
    }
  }, [isPaused, contentWidth, x])

  /**
   * Main animation loop using Framer Motion's useAnimationFrame.
   * Calculates position based on elapsed time and handles infinite looping.
   */
  useAnimationFrame(() => {
    if (!contentWidth) return

    const now = performance.now()

    // Initialize start time on first frame
    if (startTimeRef.current === null) {
      startTimeRef.current = now
      return
    }

    // If paused, don't update position (maintain current position)
    if (isPaused) {
      return
    }

    // Calculate elapsed time (the pause effect already adjusted startTimeRef)
    const elapsed = now - startTimeRef.current

    // Calculate progress (modulo to handle infinite loop)
    const progress = (elapsed % duration) / duration

    // Calculate position
    const startX = direction === 'normal' ? 0 : -contentWidth
    const endX = direction === 'normal' ? -contentWidth : 0
    const totalDistance = Math.abs(endX - startX)

    // Calculate current X position within one cycle
    const currentDistance = progress * totalDistance
    const currentX = direction === 'normal'
      ? startX - currentDistance
      : startX + currentDistance

    x.set(currentX)
  })

  /**
   * Handles mouse enter event to pause animation on hover.
   */
  const handleMouseEnter = useCallback(() => {
    if (!pauseOnHover || !contentWidth) return
    setIsPaused(true)
  }, [pauseOnHover, contentWidth])

  /**
   * Handles mouse leave event to resume animation.
   */
  const handleMouseLeave = useCallback(() => {
    if (!pauseOnHover || !contentWidth) return
    setIsPaused(false)
  }, [pauseOnHover, contentWidth])

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
          style={{ 
            x,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
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
