/**
 * Carousel functionality for insights carousel
 * Provides keyboard navigation, touch swipe, and button controls
 */

import { CAROUSEL } from './constants'

interface CarouselOptions {
  trackId: string
  prevBtnId: string
  nextBtnId: string
  slideSelector: string
  slideCount: number
}

/**
 * Initialize carousel with all interactions
 */
export function initCarousel({
  trackId,
  prevBtnId,
  nextBtnId,
  slideSelector,
  slideCount,
}: CarouselOptions): void {
  const track = document.getElementById(trackId)
  const prevBtn = document.getElementById(prevBtnId) as HTMLButtonElement | null
  const nextBtn = document.getElementById(nextBtnId) as HTMLButtonElement | null

  if (!track || !prevBtn || !nextBtn) return

  const slides = track.querySelectorAll<HTMLElement>(slideSelector)
  let current = 0
  let touchStartX = 0
  let touchEndX = 0

  /**
   * Navigate to a specific slide
   */
  function goTo(index: number, direction: 'prev' | 'next' = 'next'): void {
    if (!track || !prevBtn || !nextBtn) return

    const prevIndex = current
    current = (index + slideCount) % slideCount

    // Update slides with smooth transition
    slides.forEach((el, i) => {
      const visible = i === current
      el.setAttribute('data-visible', visible ? 'true' : 'false')
      el.setAttribute('aria-hidden', String(!visible))
      el.toggleAttribute('hidden', !visible)

      // Add direction class for animation
      if (visible && i !== prevIndex) {
        el.setAttribute('data-direction', direction)
      }
    })

    // Update button states
    prevBtn.disabled = current === 0
    nextBtn.disabled = current === slideCount - 1

    // Announce change to screen readers
    const currentSlide = slides[current]
    if (currentSlide) {
      const title = currentSlide.querySelector('.insight-slide-title')?.textContent || ''
      track.setAttribute('aria-label', `Showing insight ${current + 1} of ${slideCount}: ${title}`)
    }
  }

  /**
   * Handle swipe gesture
   */
  function handleSwipe(): void {
    const diff = touchStartX - touchEndX
    if (Math.abs(diff) > CAROUSEL.SWIPE_THRESHOLD) {
      if (diff > 0 && current < slideCount - 1) {
        // Swipe left - next
        goTo(current + 1, 'next')
      } else if (diff < 0 && current > 0) {
        // Swipe right - previous
        goTo(current - 1, 'prev')
      }
    }
  }

  // Initialize
  goTo(0)

  // Button clicks
  prevBtn.addEventListener('click', () => goTo(current - 1, 'prev'))
  nextBtn.addEventListener('click', () => goTo(current + 1, 'next'))

  // Keyboard navigation (Arrow keys, Home, End)
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && current > 0) {
      e.preventDefault()
      goTo(current - 1, 'prev')
      prevBtn.focus()
    } else if (e.key === 'ArrowRight' && current < slideCount - 1) {
      e.preventDefault()
      goTo(current + 1, 'next')
      nextBtn.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      goTo(0, 'prev')
    } else if (e.key === 'End') {
      e.preventDefault()
      goTo(slideCount - 1, 'next')
    }
  })

  // Touch swipe support
  track.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX
    },
    { passive: true }
  )

  track.addEventListener(
    'touchend',
    (e) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipe()
    },
    { passive: true }
  )
}
