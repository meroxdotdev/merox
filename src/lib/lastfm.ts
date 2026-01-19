export interface LastFmTrack {
  name: string
  artist: {
    '#text': string
    mbid?: string
  }
  album?: {
    '#text': string
    mbid?: string
  }
  date?: {
    uts: string
    '#text': string
  }
  url: string
  image?: Array<{
    '#text': string
    size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega'
  }>
}

export interface LastFmArtist {
  name: string
  mbid?: string
  playcount: string
  listeners?: string
  url: string
  image?: Array<{
    '#text': string
    size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega'
  }>
}

export interface LastFmAlbum {
  name: string
  artist: {
    name: string
    mbid?: string
  }
  playcount: string
  url: string
  image?: Array<{
    '#text': string
    size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega'
  }>
}

export interface LastFmUserInfo {
  name: string
  playcount: string
  registered: {
    unixtime: string
    '#text': string
  }
  url: string
  image?: Array<{
    '#text': string
    size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega'
  }>
}

const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/'
const REQUEST_TIMEOUT_MS = 8000

/**
 * Get Last.fm API key from environment variable
 */
const getApiKey = (): string | null => {
  return import.meta.env.PUBLIC_LASTFM_API_KEY || null
}

/**
 * Get Last.fm username from environment variable
 */
const getUsername = (): string | null => {
  return import.meta.env.PUBLIC_LASTFM_USERNAME || null
}

/**
 * Make a request to Last.fm API with timeout
 */
async function lastFmRequest(params: Record<string, string>): Promise<any> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return null
  }

  try {
    const searchParams = new URLSearchParams({
      api_key: apiKey,
      format: 'json',
      ...params,
    })

    const url = `${LASTFM_API_BASE}?${searchParams.toString()}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'merox.dev/1.0',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.error) {
      return null
    }

    return data
  } catch (error) {
    // Silently handle errors - timeout and network errors are expected
    return null
  }
}

/**
 * Fetches recent tracks from Last.fm
 */
export async function fetchRecentTracks(
  username?: string,
  limit: number = 10,
): Promise<LastFmTrack[]> {
  const user = username || getUsername()
  if (!user) {
    return []
  }

  const data = await lastFmRequest({
    method: 'user.getrecenttracks',
    user,
    limit: Math.min(limit, 200).toString(),
  })

  if (!data?.recenttracks?.track) {
    return []
  }

  const tracks = Array.isArray(data.recenttracks.track)
    ? data.recenttracks.track
    : [data.recenttracks.track]

  return tracks.filter((track: any) => track.date)
}

/**
 * Fetches top artists from Last.fm
 */
export async function fetchTopArtists(
  username?: string,
  period: 'overall' | '7day' | '1month' | '3month' | '6month' | '12month' = 'overall',
  limit: number = 10,
): Promise<LastFmArtist[]> {
  const user = username || getUsername()
  if (!user) {
    return []
  }

  const data = await lastFmRequest({
    method: 'user.gettopartists',
    user,
    period,
    limit: Math.min(limit, 1000).toString(),
  })

  if (!data?.topartists?.artist) {
    return []
  }

  const artists = Array.isArray(data.topartists.artist)
    ? data.topartists.artist
    : [data.topartists.artist]

  return artists
}

/**
 * Fetches top albums from Last.fm
 */
export async function fetchTopAlbums(
  username?: string,
  period: 'overall' | '7day' | '1month' | '3month' | '6month' | '12month' = 'overall',
  limit: number = 10,
): Promise<LastFmAlbum[]> {
  const user = username || getUsername()
  if (!user) {
    return []
  }

  const data = await lastFmRequest({
    method: 'user.gettopalbums',
    user,
    period,
    limit: Math.min(limit, 1000).toString(),
  })

  if (!data?.topalbums?.album) {
    return []
  }

  const albums = Array.isArray(data.topalbums.album)
    ? data.topalbums.album
    : [data.topalbums.album]

  return albums
}

/**
 * Fetches user info from Last.fm
 */
export async function fetchUserInfo(
  username?: string,
): Promise<LastFmUserInfo | null> {
  const user = username || getUsername()
  if (!user) {
    return null
  }

  const data = await lastFmRequest({
    method: 'user.getinfo',
    user,
  })

  if (!data?.user) {
    return null
  }

  return data.user
}

/**
 * Get image URL from Last.fm image array
 */
export function getImageUrl(
  images: Array<{ '#text': string; size: string }> | undefined,
  size: 'small' | 'medium' | 'large' | 'extralarge' = 'large',
): string | null {
  if (!images || images.length === 0) {
    return null
  }

  const image = images.find((img) => img.size === size)
  return image?.['#text'] || images[images.length - 1]?.['#text'] || null
}

/**
 * Format play count with proper pluralization
 */
export function formatPlayCount(count: string | number): string {
  const num = typeof count === 'string' ? parseInt(count, 10) : count
  return `${num.toLocaleString()} ${num === 1 ? 'play' : 'plays'}`
}

/**
 * Format date from Last.fm timestamp
 */
export function formatLastFmDate(uts: string): string {
  return new Date(parseInt(uts, 10) * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
