import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Search, Loader2, AlertCircle } from 'lucide-react'

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
    try {
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
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.')
      console.error('IP lookup error:', err)
    } finally {
      setLoading(false)
    }
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
        setLoading(false)
        return
      }

      setDnsRecords(records)
      setLoading(false)
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
    <div className="w-full">
      {/* Tool Header/Inputs */}
      <div className="flex flex-col sm:flex-row items-center gap-3 px-4 py-4 border-b bg-muted/30">
        <div className="flex bg-background/50 p-1 rounded-lg border shadow-sm w-full sm:w-auto">
          <button
            onClick={() => {
              setLookupType('ip')
              setIpInfo(null)
              setDnsRecords([])
              setError(null)
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              lookupType === 'ip'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            IP Info
          </button>
          <button
            onClick={() => {
              setLookupType('dns')
              setIpInfo(null)
              setDnsRecords([])
              setError(null)
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              lookupType === 'dns'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            DNS Lookup
          </button>
        </div>

        <div className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1 group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lookupType === 'ip' ? 'IP Address...' : 'Domain...'}
              className="w-full pl-8 pr-3 py-2 rounded-lg border bg-background shadow-sm focus:ring-1 focus:ring-primary/30 transition-all text-sm font-mono"
            />
          </div>
          <Button 
            onClick={handleLookup} 
            disabled={loading || !input.trim()}
            className="h-9 px-4 rounded-lg shadow-sm transition-all shrink-0 text-xs font-bold uppercase tracking-widest"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : 'Lookup'}
          </Button>
        </div>

        {lookupType === 'ip' && (
          <button
            onClick={getMyIP}
            disabled={loading}
            className="text-[10px] font-bold uppercase tracking-widest text-primary/70 hover:text-primary transition-colors px-2 shrink-0"
          >
            My IP
          </button>
        )}
      </div>

      {error && (
        <div className="m-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <AlertCircle className="size-3.5" />
          {error}
        </div>
      )}

      {/* IP Info Results */}
      {ipInfo && (
        <div className="p-4 space-y-4 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'IP Address', value: ipInfo.ip, mono: true },
              { label: 'Location', value: `${ipInfo.city}, ${ipInfo.country}` },
              { label: 'Provider', value: ipInfo.isp },
              { label: 'Timezone', value: ipInfo.timezone },
              { label: 'ASN', value: ipInfo.as, mono: true },
              { label: 'Coordinates', value: `${ipInfo.lat?.toFixed(4)}, ${ipInfo.lon?.toFixed(4)}` },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-lg border bg-background shadow-sm space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{item.label}</span>
                <p className={`text-sm font-bold truncate ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DNS Records Results */}
      {dnsRecords.length > 0 && (
        <div className="animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-y">
                <tr>
                  {['Type', 'Host', 'Value', 'TTL'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {dnsRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2 font-mono font-bold text-primary">{record.type}</td>
                    <td className="px-4 py-2 font-mono opacity-60">{record.name}</td>
                    <td className="px-4 py-2 font-mono break-all">{record.value}</td>
                    <td className="px-4 py-2 text-muted-foreground opacity-50">{record.ttl ? `${record.ttl}s` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default IPDNSLookup

