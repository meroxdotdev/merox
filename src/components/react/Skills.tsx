import React, { useMemo, useEffect, useRef } from 'react'
import { type IconType } from 'react-icons'
import { FaQuestionCircle } from 'react-icons/fa'
import {
  SiLinux,
  SiUbuntu,
  SiDebian,
  SiProxmox,
  SiDocker,
  SiKubernetes,
  SiCisco,
  SiPfsense,
  SiFortinet,
  SiPaloaltonetworks,
  SiAnsible,
  SiTerraform,
  SiPuppet,
  SiSaltproject,
  SiGit,
  SiFlux,
  SiRancher,
  SiOracle,
  SiCloudflare,
  SiCilium,
  SiPortainer,
  SiAsterisk,
  SiApache,
  SiNginx,
  SiMysql,
  SiWordpress,
  SiCpanel,
} from 'react-icons/si'
import { 
  Shield, 
  Server, 
  Network, 
  Cloud, 
  HardDrive,
  Lock,
  Wifi,
  Terminal,
  CloudCog,
  Box,
} from 'lucide-react'
import { InfiniteScroll } from './InfiniteScroll'

// Types for technologies
type Category = {
  text: string
  logo: string
}

type Technologies = {
  'Systems & Virtualization': Category[]
  'Networking & Security': Category[]
  'Automation & Orchestration': Category[]
  'Cloud & Infrastructure': Category[]
  'Monitoring & Tools': Category[]
}

// Technologies based on CV
const technologies: Technologies = {
  'Systems & Virtualization': [
    { text: 'Linux', logo: 'simple-icons:linux' },
    { text: 'Ubuntu', logo: 'mdi:ubuntu' },
    { text: 'Debian', logo: 'simple-icons:debian' },
    { text: 'Windows Server', logo: 'mdi:windows' },
    { text: 'Proxmox', logo: 'simple-icons:proxmox' },
    { text: 'Docker', logo: 'mdi:docker' },
    { text: 'Kubernetes', logo: 'mdi:kubernetes' },
    { text: 'XEN', logo: 'lucide:box' },
  ],
  'Networking & Security': [
    { text: 'CISCO', logo: 'simple-icons:cisco' },
    { text: 'pfSense', logo: 'simple-icons:pfsense' },
    { text: 'Fortinet', logo: 'simple-icons:fortinet' },
    { text: 'Palo Alto', logo: 'simple-icons:paloaltonetworks' },
    { text: 'StrongSwan', logo: 'lucide:wifi' },
    { text: 'VLAN', logo: 'lucide:network' },
    { text: 'CyberArk', logo: 'lucide:lock' },
    { text: 'Nessus', logo: 'lucide:shield' },
  ],
  'Automation & Orchestration': [
    { text: 'Ansible', logo: 'simple-icons:ansible' },
    { text: 'Terraform', logo: 'simple-icons:terraform' },
    { text: 'Puppet', logo: 'simple-icons:puppet' },
    { text: 'SALT', logo: 'simple-icons:saltproject' },
    { text: 'Bash', logo: 'lucide:terminal' },
    { text: 'Git', logo: 'mdi:git' },
    { text: 'Flux', logo: 'simple-icons:flux' },
    { text: 'Rancher', logo: 'simple-icons:rancher' },
  ],
  'Cloud & Infrastructure': [
    { text: 'AWS', logo: 'lucide:cloud' },
    { text: 'Oracle Cloud', logo: 'simple-icons:oracle' },
    { text: 'Cloudflare', logo: 'simple-icons:cloudflare' },
    { text: 'InfiniBand', logo: 'lucide:network' },
    { text: 'PBS Scheduler', logo: 'lucide:server' },
    { text: 'ManageIQ', logo: 'lucide:cloud-cog' },
    { text: 'Talos Linux', logo: 'lucide:box' },
    { text: 'Cilium CNI', logo: 'simple-icons:cilium' },
  ],
  'Monitoring & Tools': [
    { text: 'Portainer', logo: 'simple-icons:portainer' },
    { text: 'BAREOS', logo: 'lucide:hard-drive' },
    { text: 'Asterisk', logo: 'simple-icons:asterisk' },
    { text: 'Apache', logo: 'simple-icons:apache' },
    { text: 'Nginx', logo: 'simple-icons:nginx' },
    { text: 'MySQL', logo: 'simple-icons:mysql' },
    { text: 'WordPress', logo: 'simple-icons:wordpress' },
    { text: 'cPanel', logo: 'simple-icons:cpanel' },
  ],
}

// Icon mapping
const iconMap: { [key: string]: IconType } = {
  'simple-icons:linux': SiLinux,
  'mdi:ubuntu': SiUbuntu,
  'simple-icons:debian': SiDebian,
  'mdi:windows': Server,
  'simple-icons:proxmox': SiProxmox,
  'mdi:docker': SiDocker,
  'mdi:kubernetes': SiKubernetes,
  'lucide:box': Box,
  'simple-icons:cisco': SiCisco,
  'simple-icons:pfsense': SiPfsense,
  'simple-icons:fortinet': SiFortinet,
  'simple-icons:paloaltonetworks': SiPaloaltonetworks,
  'lucide:wifi': Wifi,
  'lucide:network': Network,
  'lucide:lock': Lock,
  'lucide:shield': Shield,
  'simple-icons:ansible': SiAnsible,
  'simple-icons:terraform': SiTerraform,
  'simple-icons:puppet': SiPuppet,
  'simple-icons:saltproject': SiSaltproject,
  'lucide:terminal': Terminal,
  'mdi:git': SiGit,
  'simple-icons:flux': SiFlux,
  'simple-icons:rancher': SiRancher,
  'lucide:cloud': Cloud,
  'simple-icons:oracle': SiOracle,
  'simple-icons:cloudflare': SiCloudflare,
  'lucide:server': Server,
  'lucide:cloud-cog': CloudCog,
  'simple-icons:cilium': SiCilium,
  'simple-icons:portainer': SiPortainer,
  'lucide:hard-drive': HardDrive,
  'simple-icons:asterisk': SiAsterisk,
  'simple-icons:apache': SiApache,
  'simple-icons:nginx': SiNginx,
  'simple-icons:mysql': SiMysql,
  'simple-icons:wordpress': SiWordpress,
  'simple-icons:cpanel': SiCpanel,
}

// Split technologies into 3 groups for 3 rows
const categories = Object.keys(technologies)
const ROWS_COUNT = 3
const groupSize = Math.ceil(categories.length / ROWS_COUNT)
const categoryGroups = [
  categories.slice(0, groupSize),
  categories.slice(groupSize, groupSize * 2),
  categories.slice(groupSize * 2),
]

const Skills: React.FC = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const hasAnimatedRef = useRef(false)

  // Optimize badge visibility - only run once and use ref to avoid re-queries
  useEffect(() => {
    if (hasAnimatedRef.current) return
    
    const container = containerRef.current
    if (!container) return

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      const badges = container.querySelectorAll('.tech-badge')
      badges.forEach((badge) => {
        badge.classList.add('tech-badge-visible')
      })
      hasAnimatedRef.current = true
    })

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  // Memoize the category groups to prevent recreation
  const memoizedGroups = useMemo(
    () =>
      categoryGroups.map((group, groupIndex) => {
        const groupItems = group.flatMap((category) =>
          technologies[category as keyof Technologies].map(
            (tech: Category, techIndex: number) => {
              const IconComponent = iconMap[tech.logo] || FaQuestionCircle
              return (
                <div
                  key={`${category}-${techIndex}`}
                  className="tech-badge mr-4 flex items-center gap-3 rounded-full border border-border bg-card px-4 py-3 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted p-2 text-lg shadow-inner">
                    <IconComponent className="text-primary" />
                  </span>
                  <span className="text-foreground font-medium whitespace-nowrap">
                    {tech.text}
                  </span>
                </div>
              )
            }
          )
        )

        return (
          <InfiniteScroll
            key={groupIndex}
            duration={80000}
            direction={groupIndex % 2 === 0 ? 'normal' : 'reverse'}
            showFade={true}
            className="flex flex-row"
          >
            {groupItems}
          </InfiniteScroll>
        )
      }),
    []
  )

  return (
    <div
      ref={containerRef}
      className="z-30 mt-8 flex w-full flex-col gap-4 max-w-[calc(100vw-5rem)] mx-auto lg:max-w-full"
    >
      {memoizedGroups}
    </div>
  )
})

Skills.displayName = 'Skills'

export default Skills