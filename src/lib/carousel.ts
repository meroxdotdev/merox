/**
 * Carousel functionality for insights carousel
 * Uses event delegation for button clicks so it works regardless of script load order.
 * Provides keyboard navigation, touch swipe, and button controls
 */

import { CAROUSEL } from './constants'

export interface CarouselOptions {
  trackId: string
  prevBtnId: string
  nextBtnId: string
  slideSelector: string
  /** Fallback when track has no data-slide-count; prefer reading from DOM */
  slideCount?: number
}

function applySlideState(
  track: HTMLElement,
  slides: NodeListOf<HTMLElement>,
  prevBtn: HTMLButtonElement | null,
  nextBtn: HTMLButtonElement | null,
  currentIndex: number,
  slideCount: number,
  direction: 'prev' | 'next' = 'next'
): void {
  slides.forEach((el, i) => {
    const visible = i === currentIndex
    el.setAttribute('data-visible', visible ? 'true' : 'false')
    el.setAttribute('aria-hidden', String(!visible))
    el.toggleAttribute('hidden', !visible)
    if (visible) {
      el.setAttribute('data-direction', direction)
    }
  })
  track.dataset.currentIndex = String(currentIndex)
  if (prevBtn) prevBtn.disabled = currentIndex === 0
  if (nextBtn) nextBtn.disabled = currentIndex === slideCount - 1
  const currentSlide = slides[currentIndex]
  if (currentSlide) {
    const title = currentSlide.querySelector('.insight-slide-title')?.textContent || ''
    track.setAttribute('aria-label', `Showing insight ${currentIndex + 1} of ${slideCount}: ${title}`)
  }
}

/**
 * Initialize carousel: attach event listeners to buttons and track
 */
export function initCarousel({
  trackId,
  prevBtnId,
  nextBtnId,
  slideSelector,
  slideCount = 0,
}: CarouselOptions): void {
  const fallbackCount = slideCount

  function setupCarousel(): void {
    const track = document.getElementById(trackId)
    const prevBtn = document.getElementById(prevBtnId) as HTMLButtonElement | null
    const nextBtn = document.getElementById(nextBtnId) as HTMLButtonElement | null
    
    if (!track || !prevBtn || !nextBtn) return

    const slides = track.querySelectorAll<HTMLElement>(slideSelector)
    const count = parseInt(track.dataset.slideCount ?? String(fallbackCount), 10)
    if (slides.length === 0 || count <= 1) return

    // Sync initial state
    const current = parseInt(track.dataset.currentIndex ?? '0', 10)
    applySlideState(track, slides, prevBtn, nextBtn, current, count, 'next')

    // Button click handlers
    prevBtn.addEventListener('click', () => {
      const cur = parseInt(track.dataset.currentIndex ?? '0', 10)
      if (cur > 0) {
        applySlideState(track, slides, prevBtn, nextBtn, cur - 1, count, 'prev')
      }
    })

    nextBtn.addEventListener('click', () => {
      const cur = parseInt(track.dataset.currentIndex ?? '0', 10)
      if (cur < count - 1) {
        applySlideState(track, slides, prevBtn, nextBtn, cur + 1, count, 'next')
      }
    })

    // Keyboard navigation
    track.addEventListener('keydown', (e) => {
      const cur = parseInt(track.dataset.currentIndex ?? '0', 10)
      if (e.key === 'ArrowLeft' && cur > 0) {
        e.preventDefault()
        applySlideState(track, slides, prevBtn, nextBtn, cur - 1, count, 'prev')
        prevBtn.focus()
      } else if (e.key === 'ArrowRight' && cur < count - 1) {
        e.preventDefault()
        applySlideState(track, slides, prevBtn, nextBtn, cur + 1, count, 'next')
        nextBtn.focus()
      } else if (e.key === 'Home') {
        e.preventDefault()
        applySlideState(track, slides, prevBtn, nextBtn, 0, count, 'prev')
      } else if (e.key === 'End') {
        e.preventDefault()
        applySlideState(track, slides, prevBtn, nextBtn, count - 1, count, 'next')
      }
    })

    // Touch swipe
    let touchStartX = 0
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX
    }, { passive: true })
    
    track.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX
      const diff = touchStartX - touchEndX
      if (Math.abs(diff) > CAROUSEL.SWIPE_THRESHOLD) {
        const cur = parseInt(track.dataset.currentIndex ?? '0', 10)
        if (diff > 0 && cur < count - 1) {
          applySlideState(track, slides, prevBtn, nextBtn, cur + 1, count, 'next')
        } else if (diff < 0 && cur > 0) {
          applySlideState(track, slides, prevBtn, nextBtn, cur - 1, count, 'prev')
        }
      }
    }, { passive: true })
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCarousel)
  } else {
    setupCarousel()
  }
}
