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
    <div className="w-full space-y-6">
      {/* Mode Selector */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={mode === 'validate' ? 'default' : 'outline'}
            onClick={() => handleModeChange('validate')}
            className="flex-1 sm:flex-none"
          >
            <FileCheck className="size-4" />
            Validate
          </Button>
          <Button
            variant={mode === 'format' ? 'default' : 'outline'}
            onClick={() => handleModeChange('format')}
            className="flex-1 sm:flex-none"
          >
            Format
          </Button>
          <Button
            variant={mode === 'to-json' ? 'default' : 'outline'}
            onClick={() => handleModeChange('to-json')}
            className="flex-1 sm:flex-none"
          >
            <ArrowLeftRight className="size-4" />
            YAML → JSON
          </Button>
          <Button
            variant={mode === 'from-json' ? 'default' : 'outline'}
            onClick={() => handleModeChange('from-json')}
            className="flex-1 sm:flex-none"
          >
            <ArrowLeftRight className="size-4" />
            JSON → YAML
          </Button>
        </div>
      </div>

      {/* Input Section */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label htmlFor="yaml-input" className="text-sm font-medium">
            {mode === 'from-json' ? 'JSON Input' : 'YAML Input'}
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={mode === 'from-json' ? loadJSONExample : loadYAMLExample}
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
              onClick={() => copyToClipboard(input, 'input')}
              disabled={!input}
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
          id="yaml-input"
          value={input}
          onChange={handleInputChange}
          placeholder={mode === 'from-json' ? 'Enter JSON to convert to YAML...' : 'Enter YAML to validate, format, or convert...'}
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

      {/* Validation Status */}
      {validation && (
        <div className={`rounded-lg border p-4 ${
          validation.valid 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-destructive/10 border-destructive/20'
        }`}>
          <div className="flex items-start gap-3">
            {validation.valid ? (
              <FileCheck className="size-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <p className={`text-sm font-medium ${
                validation.valid ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              }`}>
                {validation.valid 
                  ? (mode === 'from-json' ? 'Valid JSON' : 'Valid YAML')
                  : (mode === 'from-json' ? 'Invalid JSON' : 'Invalid YAML')
                }
              </p>
              {validation.error && (
                <p className="text-xs text-muted-foreground font-mono">
                  {validation.error}
                </p>
              )}
              {validation.line && (
                <p className="text-xs text-muted-foreground">
                  Error at line {validation.line}
                  {validation.column && `, column ${validation.column}`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Output Section */}
      {(mode === 'format' || mode === 'to-json' || mode === 'from-json') && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="yaml-output" className="text-sm font-medium">
              {mode === 'format' ? 'Formatted YAML' : mode === 'to-json' ? 'JSON Output' : 'YAML Output'}
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(output, 'output')}
              disabled={!output}
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
            id="yaml-output"
            value={output}
            readOnly
            placeholder={
              mode === 'format' ? 'Formatted YAML will appear here...' :
              mode === 'to-json' ? 'JSON will appear here...' :
              'YAML will appear here...'
            }
            rows={12}
            className="w-full px-4 py-2 rounded-md border bg-muted/50 text-foreground font-mono text-sm resize-y"
          />
        </div>
      )}
    </div>
  )
}

export default YAMLValidator

