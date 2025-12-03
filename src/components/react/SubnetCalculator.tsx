import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

interface SubnetResult {
  networkAddress: string
  broadcastAddress: string
  firstUsableIP: string
  lastUsableIP: string
  subnetMask: string
  wildcardMask: string
  totalHosts: number
  usableHosts: number
  ipClass: string
  cidr: number
  binarySubnetMask: string
  binaryNetworkAddress: string
  binaryBroadcastAddress: string
}

const IP_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
const CIDR_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/

function ipToNumber(ip: string): number | null {
  const match = ip.match(IP_REGEX)
  if (!match) return null
  
  const [, a, b, c, d] = match.map(Number)
  if (a > 255 || b > 255 || c > 255 || d > 255) return null
  
  return (a << 24) | (b << 16) | (c << 8) | d
}

function numberToIP(num: number): string {
  return `${(num >>> 24) & 255}.${(num >>> 16) & 255}.${(num >>> 8) & 255}.${num & 255}`
}

function cidrToSubnetMask(cidr: number): number {
  return (0xffffffff << (32 - cidr)) >>> 0
}

function subnetMaskToCIDR(mask: number): number {
  let cidr = 0
  let temp = mask
  while (temp & 0x80000000) {
    cidr++
    temp = (temp << 1) >>> 0
  }
  return cidr
}

function isValidSubnetMask(mask: number): boolean {
  const inverted = ~mask >>> 0
  return (inverted & (inverted + 1)) === 0
}

function getIPClass(ip: number): string {
  const firstOctet = (ip >>> 24) & 255
  if (firstOctet >= 1 && firstOctet <= 126) return 'A'
  if (firstOctet >= 128 && firstOctet <= 191) return 'B'
  if (firstOctet >= 192 && firstOctet <= 223) return 'C'
  if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)'
  if (firstOctet >= 240 && firstOctet <= 255) return 'E (Reserved)'
  return 'Invalid'
}

function toBinaryString(num: number): string {
  return num.toString(2).padStart(32, '0')
    .match(/.{1,8}/g)!
    .join('.')
}

function calculateSubnet(ip: string, cidrOrMask: string): SubnetResult | null {
  let ipNum = ipToNumber(ip)
  if (ipNum === null) return null

  let subnetMask: number
  let cidr: number

  // Check if input is CIDR notation
  const cidrMatch = cidrOrMask.match(CIDR_REGEX)
  if (cidrMatch) {
    const [, a, b, c, d, cidrStr] = cidrMatch.map(Number)
    if (a > 255 || b > 255 || c > 255 || d > 255) return null
    ipNum = (a << 24) | (b << 16) | (c << 8) | d
    cidr = cidrStr
    if (cidr < 0 || cidr > 32) return null
    subnetMask = cidrToSubnetMask(cidr)
  } else {
    // Check if it's a CIDR number
    const cidrNum = parseInt(cidrOrMask, 10)
    if (!isNaN(cidrNum) && cidrNum >= 0 && cidrNum <= 32) {
      cidr = cidrNum
      subnetMask = cidrToSubnetMask(cidr)
    } else {
      // Try as subnet mask
      const maskNum = ipToNumber(cidrOrMask)
      if (maskNum === null) return null
      if (!isValidSubnetMask(maskNum)) return null
      subnetMask = maskNum
      cidr = subnetMaskToCIDR(subnetMask)
    }
  }

  const networkAddress = ipNum & subnetMask
  const broadcastAddress = networkAddress | (~subnetMask >>> 0)
  const totalHosts = Math.pow(2, 32 - cidr)
  let usableHosts = Math.max(0, totalHosts - 2)

  let firstUsableIP = networkAddress + 1
  let lastUsableIP = broadcastAddress - 1

  // Handle /31 and /32 special cases
  if (cidr === 31) {
    firstUsableIP = networkAddress
    lastUsableIP = broadcastAddress
    usableHosts = 2
  } else if (cidr === 32) {
    firstUsableIP = networkAddress
    lastUsableIP = networkAddress
    usableHosts = 1
  }

  return {
    networkAddress: numberToIP(networkAddress),
    broadcastAddress: numberToIP(broadcastAddress),
    firstUsableIP: numberToIP(firstUsableIP),
    lastUsableIP: numberToIP(lastUsableIP),
    subnetMask: numberToIP(subnetMask),
    wildcardMask: numberToIP(~subnetMask >>> 0),
    totalHosts,
    usableHosts,
    ipClass: getIPClass(ipNum),
    cidr,
    binarySubnetMask: toBinaryString(subnetMask),
    binaryNetworkAddress: toBinaryString(networkAddress),
    binaryBroadcastAddress: toBinaryString(broadcastAddress),
  }
}

const SubnetCalculator: React.FC = () => {
  const [ipAddress, setIpAddress] = useState('192.168.1.1')
  const [cidrOrMask, setCidrOrMask] = useState('24')
  const [result, setResult] = useState<SubnetResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleCalculate = useCallback(() => {
    setError(null)
    setResult(null)

    if (!ipAddress.trim()) {
      setError('Please enter an IP address')
      return
    }

    if (!cidrOrMask.trim()) {
      setError('Please enter a CIDR notation or subnet mask')
      return
    }

    const calculated = calculateSubnet(ipAddress.trim(), cidrOrMask.trim())
    
    if (calculated === null) {
      setError('Invalid IP address or subnet mask/CIDR notation')
      return
    }

    setResult(calculated)
  }, [ipAddress, cidrOrMask])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate()
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

  return (
    <div className="w-full space-y-6">
      {/* Input Section */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="ip-address" className="text-sm font-medium">
            IP Address
          </label>
          <input
            id="ip-address"
            type="text"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="192.168.1.1"
            className="w-full px-4 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="cidr-mask" className="text-sm font-medium">
            CIDR Notation or Subnet Mask
          </label>
          <input
            id="cidr-mask"
            type="text"
            value={cidrOrMask}
            onChange={(e) => setCidrOrMask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="24 or 255.255.255.0"
            className="w-full px-4 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <p className="text-xs text-muted-foreground">
            Enter CIDR notation (e.g., 24) or subnet mask (e.g., 255.255.255.0)
          </p>
        </div>

        <Button onClick={handleCalculate} className="w-full sm:w-auto">
          Calculate Subnet
        </Button>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Main Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Network Address</span>
                <button
                  onClick={() => copyToClipboard(result.networkAddress, 'network')}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  title="Copy to clipboard"
                >
                  {copied === 'network' ? <Check className="size-3" /> : <Copy className="size-3" />}
                </button>
              </div>
              <p className="text-lg font-mono font-semibold">{result.networkAddress}</p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Broadcast Address</span>
                <button
                  onClick={() => copyToClipboard(result.broadcastAddress, 'broadcast')}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  title="Copy to clipboard"
                >
                  {copied === 'broadcast' ? <Check className="size-3" /> : <Copy className="size-3" />}
                </button>
              </div>
              <p className="text-lg font-mono font-semibold">{result.broadcastAddress}</p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">First Usable IP</span>
                <button
                  onClick={() => copyToClipboard(result.firstUsableIP, 'first')}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  title="Copy to clipboard"
                >
                  {copied === 'first' ? <Check className="size-3" /> : <Copy className="size-3" />}
                </button>
              </div>
              <p className="text-lg font-mono font-semibold">{result.firstUsableIP}</p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Last Usable IP</span>
                <button
                  onClick={() => copyToClipboard(result.lastUsableIP, 'last')}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  title="Copy to clipboard"
                >
                  {copied === 'last' ? <Check className="size-3" /> : <Copy className="size-3" />}
                </button>
              </div>
              <p className="text-lg font-mono font-semibold">{result.lastUsableIP}</p>
            </div>
          </div>

          {/* Additional Information */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Subnet Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Subnet Mask</span>
                <p className="text-base font-mono font-semibold mt-1">{result.subnetMask}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Wildcard Mask</span>
                <p className="text-base font-mono font-semibold mt-1">{result.wildcardMask}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">CIDR Notation</span>
                <p className="text-base font-mono font-semibold mt-1">/{result.cidr}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">IP Class</span>
                <p className="text-base font-semibold mt-1">{result.ipClass}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Total Hosts</span>
                <p className="text-base font-semibold mt-1">{result.totalHosts.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Usable Hosts</span>
                <p className="text-base font-semibold mt-1">{result.usableHosts.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Binary Representation */}
          <details className="rounded-lg border bg-card">
            <summary className="p-4 cursor-pointer font-medium hover:bg-muted/50 transition-colors">
              Binary Representation
            </summary>
            <div className="p-4 pt-0 space-y-3 border-t">
              <div>
                <span className="text-sm text-muted-foreground">Network Address (Binary)</span>
                <p className="text-sm font-mono mt-1 break-all">{result.binaryNetworkAddress}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Subnet Mask (Binary)</span>
                <p className="text-sm font-mono mt-1 break-all">{result.binarySubnetMask}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Broadcast Address (Binary)</span>
                <p className="text-sm font-mono mt-1 break-all">{result.binaryBroadcastAddress}</p>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default SubnetCalculator

