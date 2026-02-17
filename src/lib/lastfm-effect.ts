/**
 * Last.fm card scratch effect
 * Provides interactive rotation animation on hover (desktop only)
 */

import { LASTFM_ANIMATION } from './constants'

/**
 * Initialize Last.fm card scratch effect
 */
export function initLastFmEffect(cardId: string): void {
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  // Check if device supports hover (mouse) - CSS Media Query Level 4 standard
  // On touch devices (which don't support hover), leave only automatic CSS animation
  const supportsHover = window.matchMedia('(hover: hover)').matches
  if (!supportsHover) return // On mobile/touch, only automatic animation

  const card = document.getElementById(cardId)
  if (!card) return

  // State management
  let isHovering = false
  let currentRotation = 0
  let angularVelocity = 0
  let lastMouseAngle = 0
  let lastMouseTime = 0
  let animationStartTime = performance.now()
  let animationFrameId: number | null = null
  let cachedRect: DOMRect | null = null
  let rectCacheTime = 0

  /**
   * Cleanup function to prevent memory leaks
   */
  function cleanup(): void {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    isHovering = false
    angularVelocity = 0
  }

  /**
   * Get bounding rect with cache for performance
   */
  function getCachedRect(): DOMRect {
    const now = performance.now()
    if (!cachedRect || now - rectCacheTime > LASTFM_ANIMATION.RECT_CACHE_DURATION) {
      cachedRect = card.getBoundingClientRect()
      rectCacheTime = now
    }
    return cachedRect
  }

  /**
   * Get current rotation from CSS time-based animation
   */
  function getCurrentAnimationRotation(): number {
    const elapsed = (performance.now() - animationStartTime) % LASTFM_ANIMATION.DURATION
    const progress = elapsed / LASTFM_ANIMATION.DURATION
    return progress * 360
  }

  /**
   * Calculate angle based on mouse position relative to card center
   */
  function getAngleFromCenter(x: number, y: number, rect: DOMRect): number {
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Calculate angle in radians
    const angle = Math.atan2(y - centerY, x - centerX)
    // Convert to degrees (0-360) and adjust to start from top
    return ((angle * 180) / Math.PI + 90 + 360) % 360
  }

  /**
   * Normalize angle to 0-360 range
   */
  function normalizeAngle(angle: number): number {
    return ((angle % 360) + 360) % 360
  }

  /**
   * Calculate angle difference between two angles (accounting for wraparound)
   */
  function angleDifference(a: number, b: number): number {
    let diff = normalizeAngle(a) - normalizeAngle(b)
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    return diff
  }

  /**
   * Animation with inertia and friction (simulates a real disc)
   */
  function animate(): void {
    if (!isHovering || !card.isConnected) {
      cleanup()
      return
    }

    // Apply angular velocity with friction
    if (Math.abs(angularVelocity) > LASTFM_ANIMATION.MIN_VELOCITY) {
      currentRotation += angularVelocity
      angularVelocity *= LASTFM_ANIMATION.FRICTION

      // Normalize rotation
      currentRotation = normalizeAngle(currentRotation)
      card.style.setProperty('--reflector-rotation', `${currentRotation}deg`)

      animationFrameId = requestAnimationFrame(animate)
    } else {
      // Stop animation when velocity becomes too small
      angularVelocity = 0
      animationFrameId = null
    }
  }

  /**
   * Event handler for mouse enter
   */
  function handleMouseEnter(e: MouseEvent): void {
    if (!card.isConnected) {
      cleanup()
      return
    }

    try {
      isHovering = true
      angularVelocity = 0

      // Get current rotation from CSS animation
      const animationRotation = getCurrentAnimationRotation()

      // Perfect synchronization - no jump
      currentRotation = normalizeAngle(animationRotation)
      card.style.setProperty('--reflector-rotation', `${currentRotation}deg`)

      // Initialize mouse tracking
      const rect = getCachedRect()
      lastMouseAngle = getAngleFromCenter(e.clientX, e.clientY, rect)
      lastMouseTime = performance.now()
    } catch (error) {
      console.warn('Error in handleMouseEnter:', error)
      cleanup()
    }
  }

  /**
   * Event handler for mouse move
   */
  function handleMouseMove(e: MouseEvent): void {
    if (!isHovering || !card.isConnected) return

    try {
      const rect = getCachedRect()
      const currentTime = performance.now()
      const timeDelta = currentTime - lastMouseTime

      // Skip if delta time is too small (prevent spam)
      if (timeDelta < 1) return

      // Calculate current mouse angle
      const currentMouseAngle = getAngleFromCenter(e.clientX, e.clientY, rect)

      // Calculate angle difference (direction and magnitude of movement)
      const angleDelta = angleDifference(currentMouseAngle, lastMouseAngle)

      // Calculate angular velocity based on mouse movement speed
      if (timeDelta > 0) {
        // Instantaneous velocity based on angular movement
        const instantVelocity = angleDelta / (timeDelta / LASTFM_ANIMATION.FRAME_RATE)

        // Apply velocity with sensitivity factor for natural scratch
        angularVelocity = instantVelocity * LASTFM_ANIMATION.SENSITIVITY

        // Update rotation immediately for instant feedback
        currentRotation = normalizeAngle(currentRotation + angleDelta)
        card.style.setProperty('--reflector-rotation', `${currentRotation}deg`)
      }

      // Update tracking
      lastMouseAngle = currentMouseAngle
      lastMouseTime = currentTime

      // Start inertia animation if not already running
      if (animationFrameId === null && Math.abs(angularVelocity) > LASTFM_ANIMATION.MIN_VELOCITY) {
        animationFrameId = requestAnimationFrame(animate)
      }
    } catch (error) {
      console.warn('Error in handleMouseMove:', error)
      cleanup()
    }
  }

  /**
   * Event handler for mouse leave
   */
  function handleMouseLeave(): void {
    if (!isHovering) return // Skip if not in hover state

    try {
      cleanup()

      // Reset animation time to continue from current position
      const normalizedRotation = normalizeAngle(currentRotation)
      const progress = normalizedRotation / 360
      animationStartTime = performance.now() - progress * LASTFM_ANIMATION.DURATION

      // Invalidate rect cache
      cachedRect = null
    } catch (error) {
      console.warn('Error in handleMouseLeave:', error)
      cleanup()
    }
  }

  // Add event listeners with cleanup
  card.addEventListener('mouseenter', handleMouseEnter, { passive: true })
  card.addEventListener('mousemove', handleMouseMove, { passive: true })
  card.addEventListener('mouseleave', handleMouseLeave, { passive: true })

  // Cleanup when page unloads or element is removed
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup)

    // Observe if element is removed from DOM
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        if (!card.isConnected) {
          cleanup()
          observer.disconnect()
        }
      })

      if (card.parentNode) {
        observer.observe(card.parentNode, { childList: true })
      }
    }
  }
}
