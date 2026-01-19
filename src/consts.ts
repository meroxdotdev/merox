import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'Merox',
  description:
    'merox.dev - System Administrator and Cybersecurity Engineer sharing practical guides on Linux, Kubernetes, homelab infrastructure, and security. Learn from hands-on experience in enterprise environments.',
  href: 'https://merox.dev',
  author: 'merox',
  locale: 'en-US',
  featuredPostCount: 2,
  postsPerPage: 6,
}

// Google Analytics
// Configure via environment variable: PUBLIC_GOOGLE_ANALYTICS_ID
export const ANALYTICS = {
  google: import.meta.env.PUBLIC_GOOGLE_ANALYTICS_ID || '',
}

// Umami Analytics
// Configure via environment variable: PUBLIC_UMAMI_WEBSITE_ID
export const UMAMI = {
  websiteId: import.meta.env.PUBLIC_UMAMI_WEBSITE_ID || '',
}

// Giscus Comments (GitHub Discussions)
// Setup: https://giscus.app
// 1. Enable Discussions on your GitHub repository
// 2. Install the Giscus app: https://github.com/apps/giscus
// 3. Configure at https://giscus.app and copy the values below
export const GISCUS = {
  repo: import.meta.env.PUBLIC_GISCUS_REPO || '', // e.g., 'username/repo'
  repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID || '',
  category: import.meta.env.PUBLIC_GISCUS_CATEGORY || 'Blog Comments',
  categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID || '',
}

export const NAV_LINKS: SocialLink[] = [

  {
    href: '/blog/',
    label: 'Blog',
  },

  {
    href: '/projects/',
    label: 'Projects',
  },

  {
    href: '/about/',
    label: 'About',
  },

  {
    href: '/tunes/',
    label: 'Tunes',
  },

  {
    href: 'https://inside.merox.dev',
    label: 'Inside',
  },

]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/meroxdotdev',
    label: 'GitHub',
  },
  {
    href: 'https://www.linkedin.com/in/robert-melcher-92a1a9157?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app',
    label: 'LinkedIn',
  },
  {
    href: 'mailto:hello@merox.dev',
    label: 'Email',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}