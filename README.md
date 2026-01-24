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

## Project Structure

```
merox/
├── src/
│   ├── assets/          # Images and media
│   ├── components/      # Astro and React components
│   │   ├── react/      # Interactive React components
│   │   └── ui/         # shadcn/ui components
│   ├── content/        # MDX blog posts and content
│   │   ├── blog/       # Blog post entries
│   │   ├── authors/    # Author profiles
│   │   └── projects/   # Project listings
│   ├── layouts/        # Page layouts
│   ├── lib/            # Utility functions
│   ├── pages/          # Route pages
│   ├── scripts/        # Client-side scripts
│   ├── styles/         # Global CSS
│   ├── consts.ts       # Site configuration
│   └── types.ts        # TypeScript types
├── functions/          # Cloudflare Pages Functions
│   └── api/
│       └── reactions/  # Post reactions API
├── public/             # Static assets
├── astro.config.ts     # Astro configuration
├── wrangler.toml       # Cloudflare Workers config
└── package.json        # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/meroxdotdev/merox.git
cd merox
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open `http://localhost:1234` in your browser

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Run Astro CLI commands |
| `npm run prettier` | Format all files with Prettier |
| `npm test` | Run tests with Vitest |

## Configuration

### Site Settings

Edit `src/consts.ts` to customize:

- Site title and description
- Navigation links
- Social media links
- Featured post count
- Posts per page

### Environment Variables

Configure optional features via environment variables (set in Cloudflare Pages dashboard):

**Analytics:**
```
PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
PUBLIC_UMAMI_WEBSITE_ID=your-umami-id
```

**Giscus Comments:**
```
PUBLIC_GISCUS_REPO=username/repo
PUBLIC_GISCUS_REPO_ID=your-repo-id
PUBLIC_GISCUS_CATEGORY=Blog Comments
PUBLIC_GISCUS_CATEGORY_ID=your-category-id
```

### Cloudflare KV Setup

For post reactions to work:

1. Create a KV namespace in Cloudflare Dashboard
2. Update `wrangler.toml` with your KV namespace ID
3. Bind the namespace in Cloudflare Pages project settings

## Content Authoring

### Blog Posts

Create new posts in `src/content/blog/[post-name]/index.mdx`:

```yaml
---
title: 'Your Post Title'
description: 'A brief description (≤155 characters)'
date: 2024-01-01
tags: ['tag1', 'tag2']
image: './image.png'
authors: ['merox']
draft: false
---
```

### Projects

Add projects in `src/content/projects/[project-name].mdx`:

```yaml
---
name: 'Project Name'
description: 'Project description'
tags: ['Technology', 'Stack']
image: '/static/project.png'
link: 'https://example.com'
startDate: '2024-01-01'
endDate: '2024-01-01'
---
```

## Deployment

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20.x
3. Add environment variables in the dashboard
4. Deploy automatically on push to main branch

### Custom Domain

1. Add your domain in Cloudflare Pages project settings
2. Update DNS records as instructed
3. SSL certificates are automatically provisioned

## Development Notes

- **Trailing Slashes:** Site uses `trailingSlash: 'always'` for consistent URLs
- **Static Output:** Site is fully static except for API routes in `/functions`
- **Theme System:** Custom theme implementation with OKLCH color format
- **Fonts:** Custom fonts loaded from `/public/fonts/`

## License

This project is private and not licensed for public use.

## Contact

- **Email:** hello@merox.dev
- **GitHub:** [@meroxdotdev](https://github.com/meroxdotdev)
- **LinkedIn:** [Robert Melcher](https://www.linkedin.com/in/robert-melcher-92a1a9157)

---

Built with [Astro](https://astro.build/) and deployed on [Cloudflare Pages](https://pages.cloudflare.com/)
