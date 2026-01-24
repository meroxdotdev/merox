# Merox.dev

Personal blog and portfolio website for Robert Melcher (merox), sharing insights on system administration, cybersecurity, homelab infrastructure, and Kubernetes.

**Live Site:** [merox.dev](https://merox.dev)

## About

Merox.dev is a static blog built with [Astro](https://astro.build/) that showcases technical writing, projects, and professional experience. The site focuses on practical guides for Linux-based technologies, Kubernetes, homelab infrastructure, and security topics.

### Author

**Robert Melcher** (@merox)
- **Role:** HPC System Administrator at Forvia
- **Background:** Former Cybersecurity Engineer
- **Expertise:** Linux, Kubernetes, networking, security, infrastructure automation
- **Location:** Based in Europe

## Features

### Content & Writing
- **MDX Blog Posts** - Rich content authoring with component support
- **Math Rendering** - LaTeX math equations via KaTeX
- **Code Highlighting** - Enhanced code blocks with Expressive Code
- **Subposts** - Multi-part series support for long-form content
- **Tags & Categories** - Organized content discovery
- **Author Profiles** - Multi-author support with dedicated author pages

### User Experience
- **Dark/Light Theme** - System preference detection with manual toggle
- **Search Functionality** - Full-text search powered by FlexSearch
- **View Transitions** - Smooth SPA-like navigation
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Accessibility** - Semantic HTML and ARIA labels throughout

### Interactive Features
- **Post Reactions** - Emoji reactions (like, love, fire, celebrate, clap) stored in Cloudflare KV
- **Giscus Comments** - GitHub Discussions-based commenting system
- **RSS Feed** - Automatic feed generation at `/rss.xml`
- **Sitemap** - Auto-generated XML sitemap for SEO

### Analytics & SEO
- **Google Analytics** - Optional integration via environment variables
- **Umami Analytics** - Privacy-focused analytics option
- **Open Graph** - Rich social media previews
- **Structured Data** - JSON-LD schemas for Person, Organization, and WebSite
- **IndexNow API** - Search engine indexing support

### Pages
- **Home** - Featured posts and hero section
- **Blog** - Paginated blog listing with search
- **Projects** - Showcase of technical projects
- **About** - Professional background and experience
- **Tunes** - Automated Last.fm listening history (updated via GitHub Actions)

## Technology Stack

### Core
- **Framework:** [Astro](https://astro.build/) 5.x
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) 4.x
- **Components:** [shadcn/ui](https://ui.shadcn.com/) with Radix UI
- **Content:** [MDX](https://mdxjs.com/) for rich markdown

### Integrations
- **Code Blocks:** [Expressive Code](https://expressive-code.com/) with collapsible sections and line numbers
- **Math:** [rehype-katex](https://github.com/remarkjs/remark-math) for LaTeX rendering
- **Icons:** [astro-icon](https://www.astroicon.dev/) with Lucide and Simple Icons
- **Search:** [FlexSearch](https://github.com/nextapps-de/flexsearch)
- **Animations:** [Framer Motion](https://www.framer.com/motion/) for React components

### Deployment
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/)
- **API:** Cloudflare Pages Functions for post reactions
- **Storage:** Cloudflare KV for reaction data persistence
- **CDN:** Global edge network for fast content delivery

### Development Tools
- **TypeScript** - Full type safety
- **Prettier** - Code formatting
- **Vitest** - Unit testing framework
- **GitHub Actions** - CI/CD and automated updates

## Contact

- **Email:** hello@merox.dev
- **GitHub:** [@meroxdotdev](https://github.com/meroxdotdev)
- **LinkedIn:** [Robert Melcher](https://www.linkedin.com/in/robert-melcher-92a1a9157)

---

Built with [Astro](https://astro.build/) and deployed on [Cloudflare Pages](https://pages.cloudflare.com/)
