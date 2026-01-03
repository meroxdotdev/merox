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
    <div className="w-full">
      {/* Tool Header/Inputs */}
      <div className="flex flex-col sm:flex-row items-end gap-3 px-4 py-4 border-b bg-muted/30">
        <div className="flex-1 space-y-1.5 w-full">
          <label htmlFor="ip-address" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
            IP Address
          </label>
          <input
            id="ip-address"
            type="text"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="192.168.1.1"
            className="w-full px-3 py-2 rounded-lg border bg-background shadow-sm focus:ring-1 focus:ring-primary/30 transition-all text-sm font-mono"
          />
        </div>

        <div className="flex-1 space-y-1.5 w-full">
          <label htmlFor="cidr-mask" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
            CIDR / Mask
          </label>
          <input
            id="cidr-mask"
            type="text"
            value={cidrOrMask}
            onChange={(e) => setCidrOrMask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="24"
            className="w-full px-3 py-2 rounded-lg border bg-background shadow-sm focus:ring-1 focus:ring-primary/30 transition-all text-sm font-mono"
          />
        </div>

        <Button onClick={handleCalculate} className="h-9 px-6 rounded-lg shadow-sm w-full sm:w-auto text-xs font-bold uppercase tracking-widest">
          Calculate
        </Button>
      </div>

      {error && (
        <div className="px-4 py-3 border-b bg-destructive/5 text-destructive flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="flex flex-col divide-y animate-in fade-in duration-500">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 border-b">
            {[
              { label: 'Network', value: result.networkAddress },
              { label: 'Broadcast', value: result.broadcastAddress },
              { label: 'First IP', value: result.firstUsableIP },
              { label: 'Last IP', value: result.lastUsableIP },
            ].map((item) => (
              <div key={item.label} className="p-4 space-y-1 hover:bg-muted/20 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{item.label}</span>
                <p className="text-sm font-mono font-bold truncate">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            <div className="p-4 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Technical Info</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: 'Subnet Mask', value: result.subnetMask },
                  { label: 'CIDR', value: `/${result.cidr}` },
                  { label: 'IP Class', value: result.ipClass },
                  { label: 'Usable Hosts', value: result.usableHosts.toLocaleString() },
                ].map(spec => (
                  <div key={spec.label} className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-50">{spec.label}</span>
                    <span className="text-xs font-mono font-bold">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-4 bg-muted/5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Binary View</h4>
              <div className="space-y-3 font-mono text-[10px] opacity-70 leading-none">
                <div className="space-y-1">
                  <span className="opacity-50 uppercase font-bold text-[8px]">Network</span>
                  <p className="break-all">{result.binaryNetworkAddress}</p>
                </div>
                <div className="space-y-1">
                  <span className="opacity-50 uppercase font-bold text-[8px]">Mask</span>
                  <p className="break-all">{result.binarySubnetMask}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubnetCalculator

