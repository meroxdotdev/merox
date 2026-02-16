import { useEffect, useState } from 'react'

export interface TimeInfo {
  utc: string
  local: string
  unix: string
  zone: string
  status: string
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function formatUTCTime(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function getTimeZone(): string {
  const offset = -new Date().getTimezoneOffset() / 60
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  return `GMT${sign}${absOffset}`
}

function getTimeInfo(): TimeInfo {
  const now = new Date()
  return {
    utc: formatUTCTime(now),
    local: formatTime(now),
    unix: Math.floor(now.getTime() / 1000).toString(),
    zone: getTimeZone(),
    status: 'ON',
  }
}

/**
 * Hook to get current time information (UTC, local, Unix timestamp, timezone)
 * Updates every second
 */
export function useTimeInfo(): TimeInfo {
  const [timeInfo, setTimeInfo] = useState<TimeInfo>(getTimeInfo)

  useEffect(() => {
    const updateTime = () => {
      setTimeInfo(getTimeInfo())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return timeInfo
}
