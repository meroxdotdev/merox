// Cloudflare Pages Function - Post Reactions API
// Stores reaction counts in Cloudflare KV

interface Env {
  REACTIONS_KV: {
    get(key: string): Promise<string | null>
    put(key: string, value: string): Promise<void>
  }
}

interface ReactionData {
  [reactionKey: string]: number
}

/**
 * GET /api/reactions/[postId]
 * Fetch reaction counts for a post
 */
export const onRequestGet = async ({
  params,
  env,
}: {
  params: { postId: string }
  env: Env
}) => {
  try {
    const { postId } = params

    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        },
      )
    }

    // Get reactions from KV
    const stored = await env.REACTIONS_KV.get(`reactions:${postId}`)
    const reactions: ReactionData = stored ? JSON.parse(stored) : {}

    return new Response(JSON.stringify({ reactions }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
}

/**
 * POST /api/reactions/[postId]
 * Increment a reaction count
 */
export const onRequestPost = async ({
  params,
  request,
  env,
}: {
  params: { postId: string }
  request: Request
  env: Env
}) => {
  try {
    const { postId } = params
    const body = await request.json()
    const { reactionKey } = body

    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    if (!reactionKey || typeof reactionKey !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Reaction key is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    // Valid reaction keys
    const validReactions = ['like', 'love', 'celebrate', 'comment', 'fire', 'clap']
    if (!validReactions.includes(reactionKey)) {
      return new Response(
        JSON.stringify({ error: 'Invalid reaction key' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
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
    await env.REACTIONS_KV.put(
      `reactions:${postId}`,
      JSON.stringify(reactions),
    )

    return new Response(
      JSON.stringify({
        success: true,
        reactions,
        count: reactions[reactionKey],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
}

/**
 * OPTIONS /api/reactions/[postId]
 * Handle CORS preflight
 */
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

