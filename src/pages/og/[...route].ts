import { OGImageRoute } from 'astro-og-canvas'

// Content pages (blog posts, etc.)
const contentPages = import.meta.glob('/src/content/**/*.{md,mdx}', { eager: true })
const contentPagesMap = Object.entries(contentPages).reduce((acc, [path, page]) => {
  const newPath = path.replace('/src/content', '')
  return { ...acc, [newPath]: page }
}, {})

// Static pages configuration (tunes, projects, etc.)
// These need to match the structure expected by getImageOptions
const staticPages = {
  '/tunes': {
    frontmatter: {
      title: 'Tunes',
      description: 'Recently played tracks from Last.fm',
    },
  },
  '/projects': {
    frontmatter: {
      title: 'Projects',
      description: 'Open source projects and repositories',
    },
  },
}

// Merge content pages and static pages
const allPages = {
  ...contentPagesMap,
  ...staticPages,
}

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'route',
  pages: allPages,
  getImageOptions: (_path, page) => ({
    title: page.frontmatter.title || page.frontmatter.name || '',
    description: page.frontmatter.description || '',
    logo: {
      path: './public/static/logo.png',
      size: [80, 80],
    },
    font: {
      title: {
        // Use Geist (sans-serif) to match site design, not Geist Mono
        families: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Use Medium weight (500) to match site headings (font-medium)
        weight: 'Medium',
        size: 48,
        // Foreground color from dark mode theme: hsl(210 20% 85%) ≈ rgb(204, 211, 220)
        // Using white for better contrast on dark background
        color: [255, 255, 255],
      },
      description: {
        // Use Geist for description to match site typography
        families: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Normal weight (400) for body text
        weight: 'Normal',
        size: 28,
        // Muted foreground from dark mode theme: hsl(210 15% 65%) ≈ rgb(155, 163, 175)
        color: [155, 163, 175],
      },
    },
    // Load both fonts for fallback support
    fonts: [
      './public/fonts/GeistVF.woff2',
      './public/fonts/GeistMonoVF.woff2',
    ],
    // Subtle gradient background matching dark mode theme
    // Base: hsl(210 20% 10%) ≈ rgb(20, 26, 33)
    // Slightly lighter variant for gradient: hsl(210 20% 12%) ≈ rgb(24, 30, 37)
    // Creates a subtle depth effect
    bgGradient: [
      [20, 26, 33], // Dark blue-gray base
      [24, 30, 37], // Slightly lighter for subtle gradient
    ],
    // Add a subtle accent border with primary color (blue) from dark mode theme
    // Primary color: hsl(214 95% 62%) ≈ rgb(77, 144, 255)
    border: {
      color: [77, 144, 255], // Primary blue accent
      width: 4,
    },
    padding: 80,
  }),
})