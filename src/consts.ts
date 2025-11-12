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
export const ANALYTICS = {
  google: 'G-RXSCNFY5WZ', // 👈 Înlocuiește cu ID-ul tău real de la Google Analytics
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