const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/'

export interface LastFmRecentTrack {
  name: string
  artist: string
  url: string
  imageUrl: string | null
  nowPlaying: boolean
}

interface LastFmTrackImage {
  '#text': string
  size: 'small' | 'medium' | 'large' | 'extralarge'
}

interface LastFmTrackRaw {
  name: string
  artist: { '#text': string }
  url: string
  image?: LastFmTrackImage[]
  '@attr'?: { nowplaying?: 'true' }
}

interface LastFmRecentTracksResponse {
  recenttracks?: {
    track?: LastFmTrackRaw[]
  }
  error?: number
  message?: string
}

/**
 * Fetches the most recent track(s) from Last.fm for a user.
 * Used at build time for the homepage "Latest played" bento card.
 */
export async function fetchRecentTracks(
  user: string,
  apiKey: string,
  limit: number = 1
): Promise<LastFmRecentTrack[] | null> {
  if (!user?.trim() || !apiKey?.trim()) return null

  try {
    const params = new URLSearchParams({
      method: 'user.getrecenttracks',
      user: user.trim(),
      api_key: apiKey.trim(),
      format: 'json',
      limit: String(limit),
    })
    const res = await fetch(`${LASTFM_API}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null

    const data = (await res.json()) as LastFmRecentTracksResponse
    if (data.error || !data.recenttracks?.track?.length) return null

    return data.recenttracks.track.slice(0, limit).map((t) => {
      const img = Array.isArray(t.image) ? t.image.find((i) => i.size === 'medium') ?? t.image[0] : undefined
      return {
        name: t.name || 'Unknown',
        artist: t.artist?.['#text'] ?? 'Unknown',
        url: t.url || '#',
        imageUrl: img?.['#text']?.trim() || null,
        nowPlaying: t['@attr']?.nowplaying === 'true',
      }
    })
  } catch {
    return null
  }
}
