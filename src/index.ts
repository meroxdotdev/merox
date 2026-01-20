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

    // Defer to static assets for everything else
    return env.ASSETS.fetch(request)
  },
}
