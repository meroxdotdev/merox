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

/**
 * Get Last.fm API key from environment variable
 * Set PUBLIC_LASTFM_API_KEY in your .env file
 */
const getApiKey = (): string | null => {
  return import.meta.env.PUBLIC_LASTFM_API_KEY || null
}

/**
 * Get Last.fm username from environment variable
 * Set PUBLIC_LASTFM_USERNAME in your .env file
 */
const getUsername = (): string | null => {
  return import.meta.env.PUBLIC_LASTFM_USERNAME || null
}

/**
 * Make a request to Last.fm API
 */
async function lastFmRequest(params: Record<string, string>): Promise<any> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.warn('Last.fm API key not configured')
    return null
  }

  try {
    const searchParams = new URLSearchParams({
      api_key: apiKey,
      format: 'json',
      ...params,
    })

    const url = `${LASTFM_API_BASE}?${searchParams.toString()}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'merox.dev/1.0',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    // Check for API errors
    if (data.error) {
      console.error('Last.fm API error:', data.message)
      return null
    }

    return data
  } catch (error) {
    console.error('Last.fm API request failed:', error)
    return null
  }
}

/**
 * Fetches recent tracks from Last.fm
 * @param username - Last.fm username
 * @param limit - Number of tracks to fetch (default: 10, max: 200)
 * @returns Array of recent tracks or empty array if fetch fails
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

  return tracks.filter((track: any) => track.date) // Only return played tracks (exclude now playing if not scrobbled)
}

/**
 * Fetches top artists from Last.fm
 * @param username - Last.fm username
 * @param period - Time period: overall, 7day, 1month, 3month, 6month, 12month (default: overall)
 * @param limit - Number of artists to fetch (default: 10, max: 1000)
 * @returns Array of top artists or empty array if fetch fails
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
 * @param username - Last.fm username
 * @param period - Time period: overall, 7day, 1month, 3month, 6month, 12month (default: overall)
 * @param limit - Number of albums to fetch (default: 10, max: 1000)
 * @returns Array of top albums or empty array if fetch fails
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
 * @param username - Last.fm username
 * @returns User info or null if fetch fails
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
