import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, RefreshCw, FileCode, AlertCircle } from 'lucide-react'
import * as yaml from 'js-yaml'

interface DockerCompose {
  services: {
    [key: string]: {
      image: string
      container_name?: string
      ports?: string[]
      volumes?: string[]
      environment?: { [key: string]: string }
      restart?: string
      networks?: string[]
      command?: string | string[]
      working_dir?: string
      user?: string
      privileged?: boolean
      stdin_open?: boolean
      tty?: boolean
      read_only?: boolean
      [key: string]: any
    }
  }
  networks?: {
    [key: string]: {
      external?: boolean
    }
  }
  volumes?: {
    [key: string]: any
  }
}

function parseDockerRun(command: string): DockerCompose | null {
  if (!command.trim()) return null

  // Remove 'docker run' prefix if present
  let cmd = command.trim().replace(/^docker\s+run\s+/, '')

  // Handle line continuations (backslashes)
  cmd = cmd.replace(/\\\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim()

  const service: DockerCompose['services'][string] = {
    image: '',
  }

  // Tokenize the command properly handling quotes
  const tokens: string[] = []
  let current = ''
  let inQuotes = false
  let quoteChar = ''
  let escapeNext = false

  for (let i = 0; i < cmd.length; i++) {
    const char = cmd[i]

    if (escapeNext) {
      current += char
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      current += char
      continue
    }

    if ((char === '"' || char === "'") && !escapeNext) {
      if (!inQuotes) {
        inQuotes = true
        quoteChar = char
        current += char
      } else if (char === quoteChar) {
        inQuotes = false
        quoteChar = ''
        current += char
      } else {
        current += char
      }
    } else if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        tokens.push(current.trim())
        current = ''
      }
    } else {
      current += char
    }
  }
  if (current.trim()) {
    tokens.push(current.trim())
  }

  // Parse tokens
  let i = 0
  let imageFound = false
  const commandArgs: string[] = []

  while (i < tokens.length) {
    const token = tokens[i]

    if (!token) {
      i++
      continue
    }

    // Handle long flags (--flag)
    if (token.startsWith('--')) {
      const flagName = token.substring(2)
      const valueFlags = ['name', 'publish', 'volume', 'env', 'network', 'restart', 'workdir', 'user']
      
      if (valueFlags.includes(flagName)) {
        i++
        const value = i < tokens.length ? tokens[i] : ''
        
        switch (flagName) {
          case 'name':
            service.container_name = value
            break
          case 'publish':
            if (!service.ports) service.ports = []
            service.ports.push(value)
            break
          case 'volume':
            if (!service.volumes) service.volumes = []
            service.volumes.push(value)
            break
          case 'env':
            if (!service.environment) service.environment = {}
            const equalIndex = value.indexOf('=')
            if (equalIndex > 0) {
              const key = value.substring(0, equalIndex)
              const val = value.substring(equalIndex + 1)
              service.environment[key] = val
            } else {
              service.environment[value] = ''
            }
            break
          case 'network':
            if (!service.networks) service.networks = []
            service.networks.push(value)
            break
          case 'restart':
            service.restart = value
            break
          case 'workdir':
            service.working_dir = value
            break
          case 'user':
            service.user = value
            break
        }
      } else {
        // Boolean flags
        switch (flagName) {
          case 'detach':
          case 'd':
            // Detach is default in compose, skip
            break
          case 'interactive':
          case 'i':
            service.stdin_open = true
            break
          case 'tty':
          case 't':
            service.tty = true
            break
          case 'privileged':
            service.privileged = true
            break
          case 'read-only':
            service.read_only = true
            break
        }
      }
    }
    // Handle short flags (-p, -v, -e, etc.)
    else if (token.startsWith('-') && token.length > 1 && !token.startsWith('--')) {
      // Handle combined flags like -it, -dt, etc.
      if (token.length === 2) {
        const flag = token[1]
        const needsValue = ['p', 'v', 'e', 'w', 'u', 'n'].includes(flag)
        
        if (needsValue) {
          i++
          const value = i < tokens.length ? tokens[i] : ''
          
          switch (flag) {
            case 'p':
              if (!service.ports) service.ports = []
              service.ports.push(value)
              break
            case 'v':
              if (!service.volumes) service.volumes = []
              service.volumes.push(value)
              break
            case 'e':
              if (!service.environment) service.environment = {}
              const equalIndex = value.indexOf('=')
              if (equalIndex > 0) {
                const key = value.substring(0, equalIndex)
                const val = value.substring(equalIndex + 1)
                service.environment[key] = val
              } else {
                service.environment[value] = ''
              }
              break
            case 'w':
              service.working_dir = value
              break
            case 'u':
              service.user = value
              break
            case 'n':
              service.container_name = value
              break
          }
        } else {
          // Boolean flags
          switch (flag) {
            case 'd':
              // Detach is default, skip
              break
            case 'i':
              service.stdin_open = true
              break
            case 't':
              service.tty = true
              break
          }
        }
      } else {
        // Combined flags like -it, -dt, etc.
        const flags = token.substring(1).split('')
        for (const flag of flags) {
          switch (flag) {
            case 'i':
              service.stdin_open = true
              break
            case 't':
              service.tty = true
              break
            case 'd':
              // Detach is default, skip
              break
          }
        }
      }
    }
    // Image name or command
    else if (!token.startsWith('-')) {
      if (!imageFound) {
        // This is likely the image name
        service.image = token
        imageFound = true
      } else {
        // Everything after image is command
        commandArgs.push(token)
      }
    }

    i++
  }

  // Set command if we have args
  if (commandArgs.length > 0) {
    service.command = commandArgs.length === 1 ? commandArgs[0] : commandArgs
  }

  // Validate we have an image
  if (!service.image) {
    return null
  }

  // Generate service name
  const serviceName = service.container_name 
    ? service.container_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    : service.image.split('/').pop()?.split(':')[0]?.replace(/[^a-z0-9]/gi, '-') || 'app'

  const compose: DockerCompose = {
    services: {
      [serviceName]: service,
    },
  }

  // Add networks if specified
  if (service.networks && service.networks.length > 0) {
    compose.networks = {}
    service.networks.forEach(net => {
      if (compose.networks) {
        compose.networks[net] = {}
      }
    })
  }

  return compose
}

const DockerConverter: React.FC = () => {
  const [dockerRun, setDockerRun] = useState('')
  const [compose, setCompose] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'input' | 'output' | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setDockerRun(value)
    setError(null)

    if (!value.trim()) {
      setCompose('')
      return
    }

    try {
      const parsed = parseDockerRun(value)
      if (parsed) {
        // Use js-yaml for proper YAML formatting
        const yamlStr = yaml.dump(parsed, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          quotingType: '"',
          forceQuotes: false,
        })
        setCompose(yamlStr)
      } else {
        setError('Could not parse docker run command. Please ensure it contains a valid image name.')
        setCompose('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse command')
      setCompose('')
    }
  }

  const copyToClipboard = async (text: string, type: 'input' | 'output') => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const clearAll = () => {
    setDockerRun('')
    setCompose('')
    setError(null)
  }

  const loadExample = () => {
    const example = `docker run -d \\
  --name myapp \\
  -p 8080:80 \\
  -v /host/path:/container/path \\
  -e NODE_ENV=production \\
  -e DATABASE_URL=postgres://user:pass@host/db \\
  --restart unless-stopped \\
  nginx:latest`
    setDockerRun(example)
    const parsed = parseDockerRun(example)
    if (parsed) {
      const yamlStr = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        quotingType: '"',
        forceQuotes: false,
      })
      setCompose(yamlStr)
    }
  }

  const stats = useMemo(() => {
    if (!dockerRun.trim()) return null
    const lines = dockerRun.split('\n').length
    const chars = dockerRun.length
    return { lines, chars }
  }, [dockerRun])

  return (
    <div className="w-full">
      {/* Tool Header/Settings */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-container"><path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-4c-.5-.3-1.1-.3-1.6 0l-6.5 4.1c-.5.3-.8.9-.8 1.5v8.7c0 .5.3 1.1.8 1.4l6.5 4.1c.5.3 1.1.3 1.6 0l6.3-4c.4-.3.8-.9.8-1.5Z"/><path d="M10 21.9V14L2.1 9.1"/><path d="m10 14 11.9-6.9"/><path d="M14 19.8v-8.1"/><path d="m18 17.5-4-2.3"/></svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Docker Converter</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="h-8 px-3 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-xs"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-col divide-y">
        {/* Input Section */}
        <div className="flex flex-col p-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="docker-run-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Docker Run Command
            </label>
            <div className="flex items-center gap-3">
              <button onClick={loadExample} className="text-[10px] font-bold text-primary/70 hover:text-primary uppercase tracking-widest transition-colors">
                Load Example
              </button>
              <button
                onClick={() => copyToClipboard(dockerRun, 'input')}
                disabled={!dockerRun}
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${copied === 'input' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'}`}
              >
                {copied === 'input' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            id="docker-run-input"
            value={dockerRun}
            onChange={handleInputChange}
            placeholder="Paste docker run command here..."
            className="w-full h-48 p-3 rounded-lg border bg-muted/5 text-foreground font-mono text-sm focus:ring-1 focus:ring-primary/30 resize-none transition-all"
          />
        </div>

        {/* Output Section */}
        <div className="flex flex-col p-4 space-y-3 bg-muted/5">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="docker-compose-output" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Docker Compose YAML
            </label>
            <button
              onClick={() => copyToClipboard(compose, 'output')}
              disabled={!compose}
              className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${copied === 'output' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'}`}
            >
              {copied === 'output' ? 'Copied' : 'Copy Result'}
            </button>
          </div>
          <textarea
            id="docker-compose-output"
            value={compose}
            readOnly
            placeholder="Compose file will appear here..."
            className="w-full h-64 p-3 rounded-lg border bg-transparent text-foreground font-mono text-sm focus:ring-0 resize-none transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 border-t bg-destructive/5 text-destructive flex items-center gap-2">
          <AlertCircle className="size-3.5" />
          <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}

      {compose && (
        <div className="p-4 bg-muted/10 border-t space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Mapping Reference</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {['--name', '-p', '-v', '-e', '--restart'].map(flag => (
              <code key={flag} className="text-[10px] opacity-70 bg-background px-1 rounded border">{flag}</code>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DockerConverter
