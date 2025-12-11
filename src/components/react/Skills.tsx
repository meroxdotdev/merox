'use client'

import { useMemo } from 'react'
import { InfiniteScroll } from './InfiniteScroll'
import { getIcon } from './SkillsIconLoader'

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
    { text: 'Cisco', logo: 'simple-icons:cisco' },
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
    { text: 'Bareos', logo: 'lucide:hard-drive' },
    { text: 'Asterisk', logo: 'simple-icons:asterisk' },
    { text: 'Apache', logo: 'simple-icons:apache' },
    { text: 'Nginx', logo: 'simple-icons:nginx' },
    { text: 'MySQL', logo: 'simple-icons:mysql' },
    { text: 'WordPress', logo: 'simple-icons:wordpress' },
    { text: 'cPanel', logo: 'simple-icons:cpanel' },
  ],
}

// Pre-compute category groups for better performance
const categories = Object.keys(technologies) as Array<keyof Technologies>
const groupSize = Math.ceil(categories.length / 3)
const categoryGroups: Array<Array<keyof Technologies>> = [
  categories.slice(0, groupSize),
  categories.slice(groupSize, groupSize * 2),
  categories.slice(groupSize * 2),
]

interface TechBadgeProps {
  tech: Category
  category: string
  techIndex: number
}

const TechBadge: React.FC<TechBadgeProps> = ({ tech, category, techIndex }) => {
  const IconComponent = getIcon(tech.logo)

  return (
    <div
      className="mr-4 flex items-center gap-2.5 rounded-full bg-muted/30 px-4 py-2.5 transition-colors duration-200 hover:bg-muted/50"
      role="listitem"
    >
      <div
        className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground"
        aria-hidden="true"
      >
        <IconComponent className="h-full w-full" />
      </div>
      <span className="text-sm font-medium text-foreground">{tech.text}</span>
    </div>
  )
}

const Skills: React.FC = () => {
  // Memoize tech items per group to prevent unnecessary re-renders
  const techItemsByGroup = useMemo(() => {
    return categoryGroups.map((group) =>
      group.flatMap((category) =>
        technologies[category].map((tech, techIndex) => ({
          tech,
          category,
          techIndex,
          key: `${category}-${techIndex}`,
        })),
      ),
    )
  }, [])

  return (
    <div className="w-full space-y-4" role="list">
      {categoryGroups.map((group, groupIndex) => (
        <InfiniteScroll
          key={groupIndex}
          duration={50000}
          direction={groupIndex % 2 === 0 ? 'normal' : 'reverse'}
          showFade={true}
          className="flex flex-row"
        >
          {techItemsByGroup[groupIndex].map(({ tech, category, techIndex, key }) => (
            <TechBadge
              key={key}
              tech={tech}
              category={category}
              techIndex={techIndex}
            />
          ))}
        </InfiniteScroll>
      ))}
    </div>
  )
}

export default Skills
