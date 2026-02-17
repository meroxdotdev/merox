/**
 * Structured data schemas (Schema.org)
 * Reusable schemas for SEO and rich snippets
 */

import type { Site } from '@/types'

interface PersonSchemaOptions {
  name: string
  alternateName: string
  url: string
  image: string
  jobTitle: string
  worksFor: string
  sameAs: string[]
  description: string
}

interface OrganizationSchemaOptions {
  name: string
  url: string
  logo: string
  description: string
  founder: string
}

interface WebsiteSchemaOptions {
  name: string
  url: string
  description: string
  author: string
  searchUrlTemplate: string
}

/**
 * Generate Person schema
 */
export function createPersonSchema(options: PersonSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: options.name,
    alternateName: options.alternateName,
    url: options.url,
    image: options.image,
    jobTitle: options.jobTitle,
    worksFor: { '@type': 'Organization', name: options.worksFor },
    sameAs: options.sameAs,
    description: options.description,
  }
}

/**
 * Generate Organization schema
 */
export function createOrganizationSchema(options: OrganizationSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options.name,
    url: options.url,
    logo: options.logo,
    description: options.description,
    founder: { '@type': 'Person', name: options.founder },
  }
}

/**
 * Generate Website schema
 */
export function createWebsiteSchema(options: WebsiteSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: options.name,
    url: options.url,
    description: options.description,
    author: { '@type': 'Person', name: options.author },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: options.searchUrlTemplate,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Create all homepage schemas
 */
export function createHomepageSchemas(
  site: Site,
  baseUrl: string,
  logoUrl: string,
  personName: string,
  personAlternateName: string,
  jobTitle: string,
  worksFor: string,
  sameAs: string[]
) {
  return {
    person: createPersonSchema({
      name: personName,
      alternateName: personAlternateName,
      url: baseUrl,
      image: logoUrl,
      jobTitle,
      worksFor,
      sameAs,
      description: site.description,
    }),
    organization: createOrganizationSchema({
      name: site.title,
      url: baseUrl,
      logo: logoUrl,
      description: site.description,
      founder: personName,
    }),
    website: createWebsiteSchema({
      name: site.title,
      url: baseUrl,
      description: site.description,
      author: personName,
      searchUrlTemplate: `${baseUrl}/blog?q={search_term_string}`,
    }),
  }
}
