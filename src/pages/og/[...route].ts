import { OGImageRoute } from 'astro-og-canvas'

const pages = import.meta.glob('/src/content/**/*.{md,mdx}', { eager: true })

const newPages = Object.entries(pages).reduce((acc, [path, page]) => {
  const newPath = path.replace('/src/content', '')
  return { ...acc, [newPath]: page }
}, {})

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'route',
  pages: newPages,
  getImageOptions: (_path, page) => ({
    title: page.frontmatter.title || page.frontmatter.name || '',
    description: page.frontmatter.description || '',
    logo: {
      path: './public/static/logo.png',
      size: [80, 80],
    },
    font: {
      title: {
        families: ['Geist Mono'],
        weight: 'Bold',
        size: 48, // Redus de la 60
        color: [255, 255, 255],
      },
      description: {
        families: ['Geist Mono'],
        weight: 'Normal',
        size: 28, // Redus de la 36
        color: [156, 163, 175],
      },
    },
    fonts: ['./public/fonts/GeistMonoVF.woff2'],
    bgGradient: [[24, 24, 27]],
    padding: 80,
  }),
})