import { useEffect, useState } from 'react'

const isClient = typeof window !== 'undefined'

/**
 * Hook to detect if current page is an individual blog post
 * Returns true for /blog/post-name, false for /blog or /blog/page-number
 * Safe for SSR - returns false on server
 */
export function useBlogPage(): boolean {
  const [isBlogPost, setIsBlogPost] = useState(false)

  useEffect(() => {
    if (!isClient) return

    const checkPathname = () => {
      const pathname = window.location.pathname
      const normalizedPath = pathname.replace(/\/$/, '')
      const pathParts = normalizedPath.split('/').filter(Boolean)

      if (pathParts.length > 1 && pathParts[0] === 'blog') {
        const secondPart = pathParts[1]
        // If second part is a number, it's pagination - not a blog post
        // If second part is not a number, it's a blog post
        setIsBlogPost(!/^\d+$/.test(secondPart))
      } else {
        setIsBlogPost(false)
      }
    }

    checkPathname()

    const handleLocationChange = () => {
      checkPathname()
    }

    window.addEventListener('popstate', handleLocationChange)
    document.addEventListener('astro:page-load', checkPathname)
    document.addEventListener('astro:after-swap', checkPathname)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      document.removeEventListener('astro:page-load', checkPathname)
      document.removeEventListener('astro:after-swap', checkPathname)
    }
  }, [])

  return isBlogPost
}
