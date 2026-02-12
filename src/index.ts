// Worker script for Cloudflare Workers with Static Assets
// Handles API routes and serves static assets

type Fetcher = {
  fetch(request: Request): Promise<Response>
}

// KV Namespace type definition
type KVNamespace = {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
  list(options?: {
    prefix?: string
    limit?: number
    cursor?: string
  }): Promise<{
    keys: Array<{ name: string }>
    list_complete: boolean
    cursor?: string
  }>
}

interface Env {
  ASSETS: Fetcher
  REACTIONS_KV: KVNamespace
}

interface ReactionData {
  [reactionKey: string]: number
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Valid reaction keys
const validReactions = ['like', 'love', 'fire', 'celebrate', 'clap']

// Check if a request is likely an HTML page request
function isHtmlPageRequest(pathname: string, acceptHeader: string): boolean {
  // Check if pathname has a file extension (e.g., .css, .js, .png)
  const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathname)
  
  // It's an HTML request if:
  // - Accept header includes text/html, OR
  // - Pathname has no file extension and doesn't start with /api
  return (
    acceptHeader.includes('text/html') ||
    (!hasFileExtension && !pathname.startsWith('/api'))
  )
}

// Handle 404 errors by serving custom 404 page for HTML requests
async function handle404(
  request: Request,
  env: Env,
  originalResponse: Response
): Promise<Response> {
  // Only handle GET requests
  if (request.method !== 'GET') {
    return originalResponse
  }

  const url = new URL(request.url)
  const acceptHeader = request.headers.get('accept') || ''
  
  // Check if this is an HTML page request
  if (!isHtmlPageRequest(url.pathname, acceptHeader)) {
    return originalResponse
  }

  try {
    // Fetch the 404 page - use /404 (not /404.html) because Cloudflare's
    // html_handling (auto-trailing-slash) redirects /404.html → /404 with a 307
    const notFoundUrl = new URL(request.url)
    notFoundUrl.pathname = '/404'
    const notFoundResponse = await env.ASSETS.fetch(
      new Request(notFoundUrl, request)
    )

    // If the 404 page exists, return it with 404 status
    if (notFoundResponse.status === 200) {
      return new Response(notFoundResponse.body, {
        status: 404,
        headers: notFoundResponse.headers,
      })
    }
  } catch (error) {
    // If fetching the 404 page fails, log and return the original 404 response
    console.error('Error fetching 404 page:', error)
  }

  return originalResponse
}

// Handle OPTIONS preflight
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400',
    },
  })
}

// Handle GET /api/reactions/[postId]
async function handleGetReactions(postId: string, env: Env): Promise<Response> {
  try {
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const stored = await env.REACTIONS_KV.get(`reactions:${postId}`)
    const reactions: ReactionData = stored ? JSON.parse(stored) : {}

    return new Response(JSON.stringify({ reactions }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch reactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
}

// Handle POST /api/reactions/[postId]
async function handlePostReaction(
  postId: string,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = (await request.json()) as { reactionKey?: string }
    const { reactionKey } = body

    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (!reactionKey || typeof reactionKey !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Reaction key is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    if (!validReactions.includes(reactionKey)) {
      return new Response(JSON.stringify({ error: 'Invalid reaction key' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Get current reactions
    const stored = await env.REACTIONS_KV.get(`reactions:${postId}`)
    const reactions: ReactionData = stored ? JSON.parse(stored) : {}

    // Increment reaction count
    if (!reactions[reactionKey]) {
      reactions[reactionKey] = 0
    }
    reactions[reactionKey] += 1

    // Save back to KV
    await env.REACTIONS_KV.put(`reactions:${postId}`, JSON.stringify(reactions))

    return new Response(
      JSON.stringify({
        success: true,
        reactions,
        count: reactions[reactionKey],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  } catch (error) {
    console.error('Error updating reactions:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to update reactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle API routes for reactions
    if (url.pathname.startsWith('/api/reactions/')) {
      // Extract postId - handle both with and without trailing slash
      const postId = url.pathname
        .replace('/api/reactions/', '')
        .replace(/\/$/, '')

      if (request.method === 'OPTIONS') {
        return handleOptions()
      }
      if (request.method === 'GET') {
        return handleGetReactions(postId, env)
      }
      if (request.method === 'POST') {
        return handlePostReaction(postId, request, env)
      }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Try to fetch the requested asset
    const response = await env.ASSETS.fetch(request)

    // If the asset wasn't found, try to serve custom 404 page for HTML requests
    if (response.status === 404) {
      return handle404(request, env, response)
    }

    return response
  },
}
