'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useBlogPage } from '@/hooks/useBlogPage'

interface MousePosition {
  x: number
  y: number
}

/**
 * Component that displays mouse coordinates with X/Y axis lines
 * Only visible when mouse is over the page, hidden on individual blog posts
 */
export default function MouseCoordinates() {
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const isBlogPost = useBlogPage()

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }

    updateWindowSize()
    window.addEventListener('resize', updateWindowSize)

    return () => window.removeEventListener('resize', updateWindowSize)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // Don't render on individual blog posts
  if (isBlogPost) {
    return null
  }

  // Calculate tooltip position to avoid going off-screen
  const TOOLTIP_OFFSET = 15
  const TOOLTIP_WIDTH = 80
  const TOOLTIP_HEIGHT = 50

  let tooltipX = mousePos.x + TOOLTIP_OFFSET
  let tooltipY = mousePos.y + TOOLTIP_OFFSET

  if (tooltipX + TOOLTIP_WIDTH > windowSize.width) {
    tooltipX = mousePos.x - TOOLTIP_WIDTH - TOOLTIP_OFFSET
  }

  if (tooltipY + TOOLTIP_HEIGHT > windowSize.height) {
    tooltipY = mousePos.y - TOOLTIP_HEIGHT - TOOLTIP_OFFSET
  }

  return (
    <>
      {/* X Axis Line (Horizontal) */}
      <motion.div
        className="fixed left-0 right-0 pointer-events-none z-[60]"
        style={{
          top: mousePos.y,
          opacity: isVisible ? 0.3 : 0,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.3 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="h-px bg-primary/40 w-full" />
      </motion.div>

      {/* Y Axis Line (Vertical) */}
      <motion.div
        className="fixed top-0 bottom-0 pointer-events-none z-[60]"
        style={{
          left: mousePos.x,
          opacity: isVisible ? 0.3 : 0,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.3 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="w-px bg-primary/40 h-full" />
      </motion.div>

      {/* Center Point (Intersection) */}
      <motion.div
        className="fixed pointer-events-none z-[60]"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          opacity: isVisible ? 1 : 0,
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        <div className="w-1.5 h-1.5 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
      </motion.div>

      {/* Coordinates Display */}
      <motion.div
        className="fixed pointer-events-none z-[60] font-mono text-xs"
        style={{
          left: tooltipX,
          top: tooltipY,
          opacity: isVisible ? 1 : 0,
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.8,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        <div className="bg-background/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 shadow-lg">
          <div className="text-foreground/90">
            <span className="text-primary">X:</span>{' '}
            <span className="font-semibold">{mousePos.x}</span>
          </div>
          <div className="text-foreground/90">
            <span className="text-primary">Y:</span>{' '}
            <span className="font-semibold">{mousePos.y}</span>
          </div>
        </div>
      </motion.div>
    </>
  )
}
