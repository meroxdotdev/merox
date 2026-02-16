import { useEffect, useState } from 'react'

export interface BrowserInfo {
  client: string
  viewport: string
  screen: string
  depth: string
}

const isClient = typeof window !== 'undefined'

function getBrowserName(): string {
  if (!isClient) return 'Unknown Browser'
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Google Chrome'
  if (ua.includes('Firefox')) return 'Mozilla Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Microsoft Edge'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  return 'Unknown Browser'
}

function getColorDepth(): string {
  if (!isClient) return '24BIT'
  const depth = window.screen.colorDepth || window.screen.pixelDepth || 24
  return `${depth}BIT`
}

function getBrowserInfo(): BrowserInfo {
  if (!isClient) {
    return {
      client: 'Unknown Browser',
      viewport: '0x0',
      screen: '0x0',
      depth: '24BIT',
    }
  }

  return {
    client: getBrowserName(),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${window.screen.width}x${window.screen.height}`,
    depth: getColorDepth(),
  }
}

/**
 * Hook to get browser and screen information
 * Safe for SSR - returns default values on server
 */
export function useBrowserInfo(): BrowserInfo {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>(getBrowserInfo)

  useEffect(() => {
    if (!isClient) return

    const updateBrowserInfo = () => {
      setBrowserInfo(getBrowserInfo())
    }

    updateBrowserInfo()
    window.addEventListener('resize', updateBrowserInfo)
    window.addEventListener('orientationchange', updateBrowserInfo)

    return () => {
      window.removeEventListener('resize', updateBrowserInfo)
      window.removeEventListener('orientationchange', updateBrowserInfo)
    }
  }, [])

  return browserInfo
}
