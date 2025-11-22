/**
 * Scroll-triggered animations for homepage sections
 * Uses Intersection Observer for performance
 */

export function initScrollAnimations() {
  // Respect user's motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  // Observe all sections
  const sections = document.querySelectorAll('section[class*="mt-"]')
  sections.forEach((section) => {
    section.classList.add('scroll-animate')
    observer.observe(section)
  })

  // Observe experience timeline items
  const experienceItems = document.querySelectorAll('[class*="experience"] > div > div')
  experienceItems.forEach((item, index) => {
    item.classList.add('scroll-animate')
    ;(item as HTMLElement).style.setProperty('--delay', `${index * 0.1}s`)
    observer.observe(item)
  })

  // Observe blog post cards
  const blogCards = document.querySelectorAll('article.group')
  blogCards.forEach((card, index) => {
    card.classList.add('scroll-animate')
    ;(card as HTMLElement).style.setProperty('--delay', `${index * 0.15}s`)
    observer.observe(card)
  })
}

// Export for use in Astro pages
export { initScrollAnimations }

