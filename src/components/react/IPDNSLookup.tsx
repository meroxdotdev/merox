import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Search, Loader2 } from 'lucide-react'

interface IPInfo {
  ip: string
  city?: string
  region?: string
  country?: string
  countryCode?: string
  timezone?: string
  isp?: string
  org?: string
  as?: string
  lat?: number
  lon?: number
}

interface DNSRecord {
  type: string
  name: string
  value: string
  ttl?: number
}

type LookupType = 'ip' | 'dns'

const IPDNSLookup: React.FC = () => {
  const [input, setInput] = useState('')
  const [lookupType, setLookupType] = useState<LookupType>('ip')
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null)
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const lookupIP = useCallback(async (ip: string) => {
    setLoading(true)
    setError(null)
    setIpInfo(null)

    // Primary API: ipapi.co (30,000/month, 1,000/day - HTTPS, no API key)
    // Fallback: ip-api.com (45 requests/minute - HTTP only, but reliable)
    const apis = [
      {
        name: 'ipapi.co',
        url: `https://ipapi.co/${ip}/json/`,
        parser: (data: any) => {
          if (data.error) return null
          return {
            ip: data.ip || ip,
            city: data.city,
            region: data.region,
            country: data.country_name,
            countryCode: data.country_code,
            timezone: data.timezone,
            isp: data.org,
            org: data.org,
            as: data.asn ? `AS${data.asn}` : undefined,
            lat: data.latitude,
            lon: data.longitude,
          }
        }
      },
      {
        name: 'ip-api.com',
        url: `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,lat,lon,query`,
        parser: (data: any) => {
          if (data.status === 'fail') return null
          return {
            ip: data.query || ip,
            city: data.city,
            region: data.regionName,
            country: data.country,
            countryCode: data.countryCode,
            timezone: data.timezone,
            isp: data.isp,
            org: data.org,
            as: data.as,
            lat: data.lat,
            lon: data.lon,
          }
        }
      }
    ]

    // Try each API in order until one succeeds
    for (const api of apis) {
      try {
        const response = await fetch(api.url, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        if (!response.ok) continue
        
        const data = await response.json()
        const parsed = api.parser(data)
        
        if (parsed) {
          setIpInfo(parsed)
          return
        }
      } catch (err) {
        // Continue to next API if this one fails
        console.warn(`${api.name} failed, trying fallback...`, err)
        continue
      }
    }

    // If all APIs failed
    setError('Failed to lookup IP address. Please try again later.')
    setLoading(false)
  }, [])

  const lookupDNS = useCallback(async (domain: string) => {
    setLoading(true)
    setError(null)
    setDnsRecords([])

    try {
      // Using Google's DNS over HTTPS API
      const records: DNSRecord[] = []
      const types = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS']

      for (const type of types) {
        try {
          const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`)
          const data = await response.json()

          if (data.Answer) {
            data.Answer.forEach((answer: any) => {
              records.push({
                type: answer.type || type,
                name: answer.name || domain,
                value: answer.data,
                ttl: answer.TTL,
              })
            })
          }
        } catch (err) {
          // Continue with other record types
          console.error(`Error fetching ${type} records:`, err)
        }
      }

      if (records.length === 0) {
        setError('No DNS records found for this domain')
        return
      }

      setDnsRecords(records)
    } catch (err) {
      setError('Failed to lookup DNS records. Please check the domain name and try again.')
      console.error('DNS lookup error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLookup = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter an IP address or domain name')
      return
    }

    if (lookupType === 'ip') {
      // Basic IP validation
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      if (!ipRegex.test(input.trim())) {
        setError('Please enter a valid IPv4 address')
        return
      }
      lookupIP(input.trim())
    } else {
      // Basic domain validation
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
      if (!domainRegex.test(input.trim())) {
        setError('Please enter a valid domain name (e.g., example.com)')
        return
      }
      lookupDNS(input.trim())
    }
  }, [input, lookupType, lookupIP, lookupDNS])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup()
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getMyIP = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      setInput(data.ip)
      setLookupType('ip')
      await lookupIP(data.ip)
    } catch (err) {
      setError('Failed to get your IP address')
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Input Section */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant={lookupType === 'ip' ? 'default' : 'outline'}
            onClick={() => {
              setLookupType('ip')
              setIpInfo(null)
              setDnsRecords([])
              setError(null)
            }}
            className="flex-1"
          >
            IP Lookup
          </Button>
          <Button
            variant={lookupType === 'dns' ? 'default' : 'outline'}
            onClick={() => {
              setLookupType('dns')
              setIpInfo(null)
              setDnsRecords([])
              setError(null)
            }}
            className="flex-1"
          >
            DNS Lookup
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lookupType === 'ip' ? 'Enter IP address (e.g., 8.8.8.8)' : 'Enter domain name (e.g., google.com)'}
              className="flex-1 px-4 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Button onClick={handleLookup} disabled={loading || !input.trim()}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Lookup
                </>
              )}
            </Button>
          </div>
          {lookupType === 'ip' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={getMyIP}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Get My IP Address
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* IP Info Results */}
      {ipInfo && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">IP Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">IP Address</span>
                <button
                  onClick={() => copyToClipboard(ipInfo.ip, 'ip')}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  {copied === 'ip' ? <Check className="size-3" /> : <Copy className="size-3" />}
                </button>
              </div>
              <p className="text-base font-mono font-semibold">{ipInfo.ip}</p>
            </div>

            {ipInfo.country && (
              <div className="rounded-lg border bg-card p-4">
                <span className="text-sm font-medium text-muted-foreground">Country</span>
                <p className="text-base font-semibold mt-1">{ipInfo.country} {ipInfo.countryCode && `(${ipInfo.countryCode})`}</p>
              </div>
            )}

            {ipInfo.region && (
              <div className="rounded-lg border bg-card p-4">
                <span className="text-sm font-medium text-muted-foreground">Region</span>
                <p className="text-base font-semibold mt-1">{ipInfo.region}</p>
              </div>
            )}

            {ipInfo.city && (
              <div className="rounded-lg border bg-card p-4">
                <span className="text-sm font-medium text-muted-foreground">City</span>
                <p className="text-base font-semibold mt-1">{ipInfo.city}</p>
              </div>
            )}

            {ipInfo.timezone && (
              <div className="rounded-lg border bg-card p-4">
                <span className="text-sm font-medium text-muted-foreground">Timezone</span>
                <p className="text-base font-semibold mt-1">{ipInfo.timezone}</p>
              </div>
            )}

            {ipInfo.isp && (
              <div className="rounded-lg border bg-card p-4">
                <span className="text-sm font-medium text-muted-foreground">ISP</span>
                <p className="text-base font-semibold mt-1">{ipInfo.isp}</p>
              </div>
            )}

            {ipInfo.org && (
              <div className="rounded-lg border bg-card p-4">
                <span className="text-sm font-medium text-muted-foreground">Organization</span>
                <p className="text-base font-semibold mt-1">{ipInfo.org}</p>
              </div>
            )}

            {ipInfo.as && (
              <div className="rounded-lg border bg-card p-4">
                <span className="text-sm font-medium text-muted-foreground">AS Number</span>
                <p className="text-base font-mono font-semibold mt-1">{ipInfo.as}</p>
              </div>
            )}

            {ipInfo.lat !== undefined && ipInfo.lon !== undefined && (
              <div className="rounded-lg border bg-card p-4 md:col-span-2">
                <span className="text-sm font-medium text-muted-foreground">Coordinates</span>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base font-mono font-semibold">
                    {ipInfo.lat.toFixed(4)}, {ipInfo.lon.toFixed(4)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${ipInfo.lat},${ipInfo.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View on Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DNS Records Results */}
      {dnsRecords.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">DNS Records</h3>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">TTL</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dnsRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-mono font-semibold">{record.type}</td>
                      <td className="px-4 py-3 text-sm font-mono">{record.name}</td>
                      <td className="px-4 py-3 text-sm font-mono break-all">{record.value}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{record.ttl ? `${record.ttl}s` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default IPDNSLookup

