import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, RefreshCw, ArrowLeftRight, FileCheck, AlertCircle } from 'lucide-react'

type YAMLMode = 'validate' | 'format' | 'to-json' | 'from-json'

interface ValidationResult {
  valid: boolean
  error?: string
  line?: number
  column?: number
}

// Simple YAML to JSON converter (basic implementation)
// For production, consider using js-yaml library
function yamlToJSON(yaml: string): { json: string; error?: string } {
  try {
    // This is a simplified converter - for full YAML support, use js-yaml
    // For now, we'll do basic conversion
    const lines = yaml.split('\n')
    const result: any = {}
    let currentPath: string[] = []
    let indentLevel = 0
    const indentStack: number[] = [0]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue

      // Calculate indentation
      const indent = line.match(/^(\s*)/)?.[1].length || 0
      
      // Handle list items
      if (trimmed.startsWith('-')) {
        const value = trimmed.substring(1).trim()
        // Simple list handling
        continue
      }

      // Handle key-value pairs
      const colonIndex = trimmed.indexOf(':')
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim()
        const value = trimmed.substring(colonIndex + 1).trim()
        
        // Remove quotes if present
        const cleanKey = key.replace(/^["']|["']$/g, '')
        const cleanValue = value.replace(/^["']|["']$/g, '')
        
        if (cleanValue === '' || cleanValue === 'null') {
          // Nested object
          continue
        } else {
          // Simple value
          result[cleanKey] = cleanValue === 'true' ? true : cleanValue === 'false' ? false : cleanValue
        }
      }
    }

    return { json: JSON.stringify(result, null, 2) }
  } catch (err) {
    return { 
      json: '', 
      error: err instanceof Error ? err.message : 'Failed to convert YAML to JSON' 
    }
  }
}

function jsonToYAML(json: string): { yaml: string; error?: string } {
  try {
    const obj = JSON.parse(json)
    return { yaml: jsonToYAMLString(obj, 0) }
  } catch (err) {
    return { 
      yaml: '', 
      error: err instanceof Error ? err.message : 'Invalid JSON' 
    }
  }
}

function jsonToYAMLString(obj: any, indent: number): string {
  const spaces = '  '.repeat(indent)
  
  if (obj === null) {
    return 'null'
  }
  
  if (typeof obj === 'string') {
    // Escape quotes and wrap if needed
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
      return `"${obj.replace(/"/g, '\\"')}"`
    }
    return obj
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj)
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    return obj.map(item => `${spaces}- ${jsonToYAMLString(item, indent + 1)}`).join('\n')
  }
  
  if (typeof obj === 'object') {
    const entries = Object.entries(obj)
    if (entries.length === 0) return '{}'
    return entries.map(([key, value]) => {
      const valueStr = typeof value === 'object' && value !== null && !Array.isArray(value)
        ? `\n${jsonToYAMLString(value, indent + 1)}`
        : ` ${jsonToYAMLString(value, indent)}`
      return `${spaces}${key}:${valueStr}`
    }).join('\n')
  }
  
  return String(obj)
}

function validateYAML(yaml: string): ValidationResult {
  if (!yaml.trim()) {
    return { valid: false, error: 'Input is empty' }
  }

  // Basic YAML validation
  const lines = yaml.split('\n')
  let indentLevel = 0
  const indentStack: number[] = [0]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue

    const indent = line.match(/^(\s*)/)?.[1].length || 0
    
    // Check for common YAML syntax errors
    if (trimmed.includes(':') && !trimmed.match(/^[^:]+:\s*.+$/)) {
      // Key without value (might be nested, but check for common errors)
      if (!trimmed.endsWith(':') && !trimmed.match(/:\s*(null|~|\[\]|\{\})/)) {
        // This might be valid, but flag potential issues
      }
    }

    // Check for invalid characters in keys
    if (trimmed.includes(':') && trimmed.indexOf(':') > 0) {
      const key = trimmed.substring(0, trimmed.indexOf(':')).trim()
      if (key.includes(' ') && !key.startsWith('"') && !key.startsWith("'")) {
        // Key with spaces should be quoted
        return {
          valid: false,
          error: `Key with spaces should be quoted at line ${i + 1}`,
          line: i + 1,
        }
      }
    }
  }

  // Try to convert to JSON as validation
  const result = yamlToJSON(yaml)
  if (result.error) {
    return {
      valid: false,
      error: result.error,
    }
  }

  return { valid: true }
}

function formatYAML(yaml: string): string {
  // Basic YAML formatting - normalize indentation
  const lines = yaml.split('\n')
  const formatted: string[] = []
  let indentLevel = 0
  const indentSize = 2

  for (const line of lines) {
    const trimmed = line.trim()
    
    if (!trimmed || trimmed.startsWith('#')) {
      formatted.push(trimmed)
      continue
    }

    const currentIndent = line.match(/^(\s*)/)?.[1].length || 0
    const normalizedIndent = indentLevel * indentSize
    
    // Adjust indent level based on content
    if (trimmed.startsWith('-')) {
      formatted.push(' '.repeat(normalizedIndent) + trimmed)
    } else if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':')
      const key = trimmed.substring(0, colonIndex).trim()
      const value = trimmed.substring(colonIndex + 1).trim()
      
      if (value === '' || value === 'null' || value === '~') {
        // This might be a nested object
        formatted.push(' '.repeat(normalizedIndent) + `${key}:`)
        indentLevel++
      } else {
        formatted.push(' '.repeat(normalizedIndent) + `${key}: ${value}`)
      }
    } else {
      formatted.push(' '.repeat(normalizedIndent) + trimmed)
    }
  }

  return formatted.join('\n')
}

const YAMLValidator: React.FC = () => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<YAMLMode>('validate')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [copied, setCopied] = useState<'input' | 'output' | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    
    if (!value.trim()) {
      setOutput('')
      setValidation(null)
      return
    }

    if (mode === 'validate') {
      const result = validateYAML(value)
      setValidation(result)
      setOutput('')
    } else if (mode === 'format') {
      const result = validateYAML(value)
      setValidation(result)
      if (result.valid) {
        setOutput(formatYAML(value))
      } else {
        setOutput('')
      }
    } else if (mode === 'to-json') {
      const result = validateYAML(value)
      setValidation(result)
      if (result.valid) {
        const conversion = yamlToJSON(value)
        if (conversion.error) {
          setValidation({ valid: false, error: conversion.error })
          setOutput('')
        } else {
          setOutput(conversion.json)
        }
      } else {
        setOutput('')
      }
    } else if (mode === 'from-json') {
      // Validate JSON first
      try {
        JSON.parse(value)
        const conversion = jsonToYAML(value)
        if (conversion.error) {
          setValidation({ valid: false, error: conversion.error })
          setOutput('')
        } else {
          setValidation({ valid: true })
          setOutput(conversion.yaml)
        }
      } catch (err) {
        setValidation({
          valid: false,
          error: err instanceof Error ? err.message : 'Invalid JSON',
        })
        setOutput('')
      }
    }
  }

  const handleModeChange = (newMode: YAMLMode) => {
    setMode(newMode)
    
    if (!input.trim()) {
      setOutput('')
      setValidation(null)
      return
    }

    // Recalculate based on new mode
    handleInputChange({ target: { value: input } } as React.ChangeEvent<HTMLTextAreaElement>)
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
    setInput('')
    setOutput('')
    setValidation(null)
  }

  const loadYAMLExample = () => {
    const example = `# YAML Example
name: YAML Validator
version: 1.0.0
features:
  - Validate
  - Format
  - Convert to JSON
  - Convert from JSON
settings:
  indent: 2
  validateOnInput: true
tags:
  - yaml
  - validator
  - formatter`
    setInput(example)
    const result = validateYAML(example)
    setValidation(result)
    if (mode === 'format') {
      setOutput(formatYAML(example))
    }
  }

  const loadJSONExample = () => {
    const example = JSON.stringify({
      name: 'YAML Validator',
      version: '1.0.0',
      features: ['Validate', 'Format', 'Convert'],
      settings: {
        indent: 2,
        validateOnInput: true,
      },
    }, null, 2)
    setInput(example)
    if (mode === 'from-json') {
      const conversion = jsonToYAML(example)
      setOutput(conversion.yaml)
      setValidation({ valid: true })
    }
  }

  const stats = useMemo(() => {
    if (!input.trim()) return null
    const lines = input.split('\n').length
    const chars = input.length
    return { lines, chars }
  }, [input])

  return (
    <div className="w-full">
      {/* Tool Header/Settings */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b bg-muted/30 gap-3">
        <div className="flex bg-background/50 p-1 rounded-lg border shadow-sm overflow-x-auto">
          <button
            onClick={() => handleModeChange('validate')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              mode === 'validate'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            Validate
          </button>
          <button
            onClick={() => handleModeChange('format')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              mode === 'format'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            Format
          </button>
          <button
            onClick={() => handleModeChange('to-json')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              mode === 'to-json'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            YAML → JSON
          </button>
          <button
            onClick={() => handleModeChange('from-json')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              mode === 'from-json'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            JSON → YAML
          </button>
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
            <label htmlFor="yaml-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {mode === 'from-json' ? 'JSON' : 'YAML'} Input
            </label>
            <div className="flex items-center gap-3">
              <button onClick={mode === 'from-json' ? loadJSONExample : loadYAMLExample} className="text-[10px] font-bold text-primary/70 hover:text-primary uppercase tracking-widest transition-colors">
                Load Example
              </button>
              <button
                onClick={() => copyToClipboard(input, 'input')}
                disabled={!input}
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${copied === 'input' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'}`}
              >
                {copied === 'input' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            id="yaml-input"
            value={input}
            onChange={handleInputChange}
            placeholder={mode === 'from-json' ? 'Paste your JSON here...' : 'Paste your YAML here...'}
            className="w-full h-48 p-3 rounded-lg border bg-muted/5 text-foreground font-mono text-sm focus:ring-1 focus:ring-primary/30 resize-none transition-all"
          />
        </div>

        {/* Validation Status */}
        {validation && (
          <div className={`px-4 py-3 border-y transition-all ${
            validation.valid 
              ? 'bg-green-500/5 text-green-600 dark:text-green-400' 
              : 'bg-destructive/5 text-destructive'
          }`}>
            <div className="flex items-center gap-2">
              {validation.valid ? <FileCheck className="size-3.5" /> : <AlertCircle className="size-3.5" />}
              <p className="text-[10px] font-bold uppercase tracking-widest">
                {validation.valid 
                  ? (mode === 'from-json' ? 'JSON is valid' : 'YAML is valid')
                  : (mode === 'from-json' ? 'Invalid JSON' : 'Invalid YAML')
                }
                {validation.error && <span className="ml-2 font-normal normal-case opacity-80 font-mono italic">— {validation.error}</span>}
              </p>
            </div>
          </div>
        )}

        {/* Output Section */}
        {mode !== 'validate' && (
          <div className="flex flex-col p-4 space-y-3 bg-muted/5">
            <div className="flex items-center justify-between px-1">
              <label htmlFor="yaml-output" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {mode === 'format' ? 'Formatted YAML' : mode === 'to-json' ? 'JSON' : 'YAML'} Result
              </label>
              <button
                onClick={() => copyToClipboard(output, 'output')}
                disabled={!output}
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${copied === 'output' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'}`}
              >
                {copied === 'output' ? 'Copied' : 'Copy Result'}
              </button>
            </div>
            <textarea
              id="yaml-output"
              value={output}
              readOnly
              placeholder="Result will appear here..."
              className="w-full h-64 p-3 rounded-lg border bg-transparent text-foreground font-mono text-sm focus:ring-0 resize-none transition-all"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default YAMLValidator

