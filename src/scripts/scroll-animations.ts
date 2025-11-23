/**
 * Scroll-triggered animations for homepage sections
 * Uses Intersection Observer for performance
 * Optimized for mobile with better visibility cues
 */

let observer: IntersectionObserver | null = null
let initTimeout: ReturnType<typeof setTimeout> | null = null
const observedElements = new WeakSet<Element>()

function cleanup() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (initTimeout) {
    clearTimeout(initTimeout)
    initTimeout = null
  }
  // Reset animation classes for re-initialization
  document.querySelectorAll('.scroll-animate').forEach((el) => {
    if (!observedElements.has(el)) {
      el.classList.remove('scroll-animate', 'animate-in')
    }
  })
}

export function initScrollAnimations() {
  // Respect user's motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    cleanup()
    return
  }

  cleanup() // Clean up any existing observer first

  // Use more generous rootMargin on mobile to show content earlier
  const isMobile = window.innerWidth < 640
  const observerOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: isMobile ? '200px 0px -100px 0px' : '0px 0px -50px 0px',
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
        observer?.unobserve(entry.target)
      }
    })
  }, observerOptions)

  // Observe experience timeline items (individual items only)
  const experienceItems = document.querySelectorAll(
    'section:has([class*="space-y-6"]) > div[class*="space-y"] > div'
  )
  experienceItems.forEach((item, index) => {
    // On mobile, make first item visible immediately to indicate content below
    if (isMobile && index === 0) {
      // First item visible immediately - no animation needed
      return
    }
    item.classList.add('scroll-animate')
    ;(item as HTMLElement).style.setProperty('--delay', `${index * 0.1}s`)
    observedElements.add(item)
    observer?.observe(item)
  })

  // Observe Skills section - find the actual Skills component container
  const skillsSection = document.querySelector('section:has([class*="Skills"])')
  if (skillsSection) {
    const skillsContainer = Array.from(skillsSection.children).find(
      (el) => el.tagName !== 'DIV' || !el.querySelector('h2')
    )
    if (skillsContainer && skillsContainer !== skillsSection.querySelector('div.mb-6')) {
      skillsContainer.classList.add('scroll-animate')
      observedElements.add(skillsContainer)
      observer?.observe(skillsContainer)
    }
  }

  // Observe blog post cards
  const blogCards = document.querySelectorAll('article.group')
  blogCards.forEach((card, index) => {
    card.classList.add('scroll-animate')
    ;(card as HTMLElement).style.setProperty('--delay', `${index * 0.15}s`)
    observedElements.add(card)
    observer?.observe(card)
  })
}

export function debouncedInitScrollAnimations() {
  if (initTimeout) {
    clearTimeout(initTimeout)
  }
  initTimeout = setTimeout(initScrollAnimations, 50)
}

// Cleanup function for Astro view transitions
export function cleanupScrollAnimations() {
  cleanup()
}

