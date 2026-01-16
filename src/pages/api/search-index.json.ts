import type { APIRoute } from 'astro'
import { getAllPosts } from '@/lib/data-utils'

export const prerender = true

export const GET: APIRoute = async () => {
  try {
    const posts = await getAllPosts()

    const searchIndex = posts.map((post) => {
      return {
        id: post.id || '',
        title: post.data.title || '',
        description: post.data.description || '',
        date: post.data.date?.toISOString() || new Date().toISOString(),
        tags: post.data.tags || [],
        authors: post.data.authors || [],
        url: `/blog/${post.id}/`,
        // Simplified: no content indexing - only title, description, tags
      }
    })

    // Get the latest post date for cache invalidation
    const latestPostDate = posts.length > 0
      ? Math.max(...posts.map((p) => p.data.date?.getTime() || 0))
      : Date.now()

    // Return index with metadata for cache invalidation
    const response = {
      posts: searchIndex,
      metadata: {
        count: searchIndex.length,
        latestPostDate: new Date(latestPostDate).toISOString(),
        generatedAt: new Date().toISOString(),
      },
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600', // 5 min fresh, 1h stale-while-revalidate
      },
    })
  } catch (error) {
    console.error('Error generating search index:', error)
    // Return empty response with proper structure on error
    const errorResponse = {
      posts: [],
      metadata: {
        count: 0,
        latestPostDate: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
      },
    }
    return new Response(JSON.stringify(errorResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Shorter cache on error
      },
    })
  }
}

