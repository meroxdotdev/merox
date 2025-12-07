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
    <div className="w-full space-y-6">
      {/* Input Section */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label htmlFor="docker-run-input" className="text-sm font-medium">
            Docker Run Command
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadExample}
              className="h-7 text-xs"
            >
              Load Example
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7"
            >
              <RefreshCw className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(dockerRun, 'input')}
              disabled={!dockerRun}
              className="h-7"
            >
              {copied === 'input' ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </div>
        </div>
        <textarea
          id="docker-run-input"
          value={dockerRun}
          onChange={handleInputChange}
          placeholder="Enter docker run command...&#10;&#10;Example:&#10;docker run -d --name myapp -p 8080:80 -v /host:/container nginx:latest"
          rows={12}
          className="w-full px-4 py-2 rounded-md border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-y"
        />
        {stats && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span>Lines: {stats.lines}</span>
            <span>Characters: {stats.chars.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border bg-destructive/10 border-destructive/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-xs text-muted-foreground font-mono">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Output Section */}
      {compose && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="docker-compose-output" className="text-sm font-medium flex items-center gap-2">
              <FileCode className="size-4" />
              Docker Compose YAML
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(compose, 'output')}
              disabled={!compose}
              className="h-7"
            >
              {copied === 'output' ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </div>
          <textarea
            id="docker-compose-output"
            value={compose}
            readOnly
            placeholder="Docker Compose YAML will appear here..."
            rows={20}
            className="w-full px-4 py-2 rounded-md border bg-muted/50 text-foreground font-mono text-sm resize-y"
          />
          <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Supported flags:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><code className="px-1 py-0.5 bg-background rounded">--name, -n</code> → container_name</li>
              <li><code className="px-1 py-0.5 bg-background rounded">--publish, -p</code> → ports</li>
              <li><code className="px-1 py-0.5 bg-background rounded">--volume, -v</code> → volumes</li>
              <li><code className="px-1 py-0.5 bg-background rounded">--env, -e</code> → environment</li>
              <li><code className="px-1 py-0.5 bg-background rounded">--restart</code> → restart</li>
              <li><code className="px-1 py-0.5 bg-background rounded">--network</code> → networks</li>
              <li><code className="px-1 py-0.5 bg-background rounded">--workdir, -w</code> → working_dir</li>
              <li><code className="px-1 py-0.5 bg-background rounded">--user, -u</code> → user</li>
              <li><code className="px-1 py-0.5 bg-background rounded">--privileged</code> → privileged</li>
              <li><code className="px-1 py-0.5 bg-background rounded">-it</code> → stdin_open + tty</li>
              <li><code className="px-1 py-0.5 bg-background rounded">-d</code> → detach (default in compose)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Info Section */}
      {!compose && !error && dockerRun.trim() && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Enter a docker run command above to convert it to Docker Compose format.
          </p>
        </div>
      )}
    </div>
  )
}

export default DockerConverter
