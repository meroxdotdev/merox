import { OGImageRoute } from 'astro-og-canvas'

// Content pages (blog posts, etc.)
const contentPages = import.meta.glob('/src/content/**/*.{md,mdx}', { eager: true })
const allPages = Object.entries(contentPages).reduce((acc, [path, page]) => {
  const newPath = path.replace('/src/content', '')
  return { ...acc, [newPath]: page }
}, {})

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
    // Background from dark mode theme: hsl(210 20% 10%) ≈ rgb(20, 26, 33)
    bgGradient: [[20, 26, 33]],
    padding: 80,
  }),
})