import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'Merox',
  description:
    'System Administrator with cybersecurity background and expertise in Linux, Networking, and Security. I focus on practical solutions and sharing knowledge gained through hands-on experience in enterprise environments.',
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

// Disqus Comments
// Get your shortname from https://disqus.com/admin/settings/general/
// Set it as an environment variable: PUBLIC_DISQUS_SHORTNAME=your-shortname
export const DISQUS = {
  shortname: import.meta.env.PUBLIC_DISQUS_SHORTNAME || '',
}

// Brevo Newsletter
// Get your API key from https://app.brevo.com/settings/keys/api
// Set it as an environment variable: BREVO_API_KEY=your-api-key
// Optional: Set BREVO_LIST_ID to automatically add subscribers to a specific list
// Optional: Set BREVO_TEMPLATE_ID for double opt-in confirmation email (default: 5)
export const BREVO = {
  apiKey: import.meta.env.BREVO_API_KEY || '',
  listId: import.meta.env.BREVO_LIST_ID || '',
  templateId: import.meta.env.BREVO_TEMPLATE_ID || '5',
}

export const NAV_LINKS: SocialLink[] = [

  {
    href: '/blog',
    label: 'Blog',
  },

  {
    href: '/about',
    label: 'About',
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