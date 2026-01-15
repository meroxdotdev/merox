import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function calculateWordCountFromHtml(
  html: string | null | undefined,
): number {
  if (!html) return 0
  const textOnly = html.replace(/<[^>]+>/g, '')
  return textOnly.split(/\s+/).filter(Boolean).length
}

export function readingTime(wordCount: number): string {
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200))
  return `${readingTimeMinutes} min read`
}

export function getHeadingMargin(depth: number): string {
  const margins: Record<number, string> = {
    3: 'ml-4',
    4: 'ml-8',
    5: 'ml-12',
    6: 'ml-16',
  }
  return margins[depth] || ''
}

/**
 * Get the appropriate badge variant, custom classes, and tooltip for a tag
 * @param tag - The tag name
 * @returns Object with variant, className, and optional tooltip for styling
 */
export function getTagVariant(tag: string): {
  variant: 'default' | 'muted' | 'destructive' | 'outline'
  className?: string
  tooltip?: string
} {
  const normalizedTag = tag.toLowerCase().trim()

  switch (normalizedTag) {
    case 'experimental':
      return {
        variant: 'default',
        // Option 1: Amber/Gold (recommended - elegant and professional)
        className: 'bg-amber-500 border-amber-500/50 text-white hover:!bg-amber-500 hover:!text-white dark:bg-amber-600 dark:border-amber-600/50 dark:hover:!bg-amber-600',
        
        // Option 2: Yellow muted (more subtle, less vibrant)
        // className: 'bg-yellow-500/80 hover:bg-yellow-500 border-yellow-500/40 text-white dark:bg-yellow-600/70 dark:hover:bg-yellow-600 dark:border-yellow-600/40',
        
        // Option 3: Orange muted (less aggressive than original)
        // className: 'bg-orange-500/80 hover:bg-orange-500 border-orange-500/40 text-white dark:bg-orange-600/70 dark:hover:bg-orange-600 dark:border-orange-600/40',
        
        // tooltip: 'This content is experimental and may not follow best practices or require modifications',
      }
    // You can add more special tags here in the future
    // case 'featured':
    //   return {
    //     variant: 'default',
    //     className: 'bg-blue-500/90 hover:bg-blue-500 border-blue-500/50 text-white',
    //     tooltip: 'Featured content',
    //   }
    default:
      return {
        variant: 'muted',
      }
  }
}

/**
 * Ensures that internal URLs have a trailing slash to avoid 301 redirects on GitHub Pages.
 * Does not modify external URLs, anchor-only links, or files with extensions.
 * @param href - The URL to process
 * @returns The URL with a trailing slash if needed
 */
export function ensureTrailingSlash(href: string): string {
  // Don't modify empty strings, external URLs, or anchor-only links
  if (!href || href.startsWith('http') || href.startsWith('#')) {
    return href
  }

  // Handle query strings and hash fragments
  const queryIndex = href.indexOf('?')
  const hashIndex = href.indexOf('#')
  
  let pathPart = href
  let queryPart = ''
  let hashPart = ''

  // Extract query string and hash if present
  if (queryIndex !== -1 && (hashIndex === -1 || queryIndex < hashIndex)) {
    pathPart = href.substring(0, queryIndex)
    const rest = href.substring(queryIndex)
    if (hashIndex !== -1 && hashIndex > queryIndex) {
      queryPart = href.substring(queryIndex, hashIndex)
      hashPart = href.substring(hashIndex)
    } else {
      queryPart = rest
    }
  } else if (hashIndex !== -1) {
    pathPart = href.substring(0, hashIndex)
    hashPart = href.substring(hashIndex)
  }

  // Don't add trailing slash to files with extensions
  if (pathPart.endsWith('/') || /\.[a-z]+$/i.test(pathPart)) {
    return href
  }

  // Add trailing slash to the path part
  return `${pathPart}/${queryPart}${hashPart}`
}