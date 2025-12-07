import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, RefreshCw, Minus, Plus, FileCheck, AlertCircle } from 'lucide-react'

type FormatMode = 'format' | 'minify' | 'validate'

interface ValidationResult {
  valid: boolean
  error?: string
  line?: number
  column?: number
}

const JSONFormatter: React.FC = () => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<FormatMode>('format')
  const [indent, setIndent] = useState(2)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [copied, setCopied] = useState<'input' | 'output' | null>(null)

  const validateJSON = useCallback((text: string): ValidationResult => {
    if (!text.trim()) {
      return { valid: false, error: 'Input is empty' }
    }

    try {
      JSON.parse(text)
      return { valid: true }
    } catch (err) {
      const error = err as Error
      // Try to extract line and column from error message
      const match = error.message.match(/position (\d+)/)
      const position = match ? parseInt(match[1], 10) : 0
      
      // Calculate approximate line and column
      const lines = text.substring(0, position).split('\n')
      const line = lines.length
      const column = lines[lines.length - 1].length + 1

      return {
        valid: false,
        error: error.message,
        line,
        column,
      }
    }
  }, [])

  const formatJSON = useCallback((text: string, spaces: number): string => {
    try {
      const parsed = JSON.parse(text)
      return JSON.stringify(parsed, null, spaces)
    } catch {
      return ''
    }
  }, [])

  const minifyJSON = useCallback((text: string): string => {
    try {
      const parsed = JSON.parse(text)
      return JSON.stringify(parsed)
    } catch {
      return ''
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    
    // Always validate
    const validationResult = validateJSON(value)
    setValidation(validationResult)

    if (!value.trim()) {
      setOutput('')
      return
    }

    if (mode === 'validate') {
      setOutput('')
      return
    }

    if (validationResult.valid) {
      if (mode === 'format') {
        setOutput(formatJSON(value, indent))
      } else if (mode === 'minify') {
        setOutput(minifyJSON(value))
      }
    } else {
      setOutput('')
    }
  }

  const handleModeChange = (newMode: FormatMode) => {
    setMode(newMode)
    
    if (!input.trim()) {
      setOutput('')
      return
    }

    const validationResult = validateJSON(input)
    setValidation(validationResult)

    if (validationResult.valid) {
      if (newMode === 'format') {
        setOutput(formatJSON(input, indent))
      } else if (newMode === 'minify') {
        setOutput(minifyJSON(input))
      } else {
        setOutput('')
      }
    } else {
      setOutput('')
    }
  }

  const handleIndentChange = (newIndent: number) => {
    if (newIndent < 0 || newIndent > 8) return
    setIndent(newIndent)
    
    if (mode === 'format' && input.trim()) {
      const validationResult = validateJSON(input)
      if (validationResult.valid) {
        setOutput(formatJSON(input, newIndent))
      }
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
    setInput('')
    setOutput('')
    setValidation(null)
  }

  const loadExample = () => {
    const example = {
      name: 'JSON Formatter',
      version: '1.0.0',
      features: ['Format', 'Minify', 'Validate'],
      settings: {
        indent: 2,
        validateOnInput: true,
      },
      tags: ['json', 'formatter', 'validator'],
    }
    const exampleStr = JSON.stringify(example, null, 2)
    setInput(exampleStr)
    setOutput(exampleStr)
    setValidation({ valid: true })
  }

  const stats = useMemo(() => {
    if (!input.trim()) return null
    const lines = input.split('\n').length
    const chars = input.length
    const words = input.split(/\s+/).filter(w => w).length
    return { lines, chars, words }
  }, [input])

  return (
    <div className="w-full space-y-6">
      {/* Mode Selector */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={mode === 'format' ? 'default' : 'outline'}
            onClick={() => handleModeChange('format')}
            className="flex-1 sm:flex-none"
          >
            <Plus className="size-4" />
            Format
          </Button>
          <Button
            variant={mode === 'minify' ? 'default' : 'outline'}
            onClick={() => handleModeChange('minify')}
            className="flex-1 sm:flex-none"
          >
            <Minus className="size-4" />
            Minify
          </Button>
          <Button
            variant={mode === 'validate' ? 'default' : 'outline'}
            onClick={() => handleModeChange('validate')}
            className="flex-1 sm:flex-none"
          >
            <FileCheck className="size-4" />
            Validate
          </Button>
        </div>

        {mode === 'format' && (
          <div className="flex items-center gap-4 pt-2 border-t">
            <label className="text-sm font-medium">Indentation:</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleIndentChange(indent - 1)}
                disabled={indent <= 0}
                className="h-8 w-8"
              >
                <Minus className="size-3" />
              </Button>
              <span className="text-sm font-mono w-8 text-center">{indent}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleIndentChange(indent + 1)}
                disabled={indent >= 8}
                className="h-8 w-8"
              >
                <Plus className="size-3" />
              </Button>
              <span className="text-xs text-muted-foreground">spaces</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label htmlFor="json-input" className="text-sm font-medium">
            JSON Input
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
          id="json-input"
          value={input}
          onChange={handleInputChange}
          placeholder='Enter JSON to format, minify, or validate...'
          rows={12}
          className="w-full px-4 py-2 rounded-md border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-y"
        />
        {stats && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span>Lines: {stats.lines}</span>
            <span>Characters: {stats.chars.toLocaleString()}</span>
            <span>Words: {stats.words}</span>
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
                {validation.valid ? 'Valid JSON' : 'Invalid JSON'}
              </p>
              {validation.error && (
                <p className="text-xs text-muted-foreground font-mono">
                  {validation.error}
                </p>
              )}
              {validation.line && validation.column && (
                <p className="text-xs text-muted-foreground">
                  Error at line {validation.line}, column {validation.column}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Output Section */}
      {(mode === 'format' || mode === 'minify') && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="json-output" className="text-sm font-medium">
              {mode === 'format' ? 'Formatted JSON' : 'Minified JSON'}
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
            id="json-output"
            value={output}
            readOnly
            placeholder={mode === 'format' ? 'Formatted JSON will appear here...' : 'Minified JSON will appear here...'}
            rows={12}
            className="w-full px-4 py-2 rounded-md border bg-muted/50 text-foreground font-mono text-sm resize-y"
          />
          {output && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              <span>Output size: {output.length.toLocaleString()} characters</span>
              {mode === 'minify' && input && (
                <span className="text-green-600 dark:text-green-400">
                  Reduced by {((1 - output.length / input.length) * 100).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default JSONFormatter

