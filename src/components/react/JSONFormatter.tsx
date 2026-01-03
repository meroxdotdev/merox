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
    <div className="w-full">
      {/* Tool Header/Settings */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b bg-muted/30 gap-3">
        <div className="flex bg-background/50 p-1 rounded-lg border shadow-sm overflow-x-auto">
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
            onClick={() => handleModeChange('minify')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              mode === 'minify'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            Minify
          </button>
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
        </div>

        <div className="flex items-center gap-2">
          {mode === 'format' && (
            <div className="flex items-center gap-2 px-2 py-1 bg-background/50 rounded-md border text-[10px]">
              <span className="text-muted-foreground uppercase font-bold tracking-tighter">Indent</span>
              <button onClick={() => handleIndentChange(indent - 1)} disabled={indent <= 0} className="hover:text-primary">
                <Minus className="size-3" />
              </button>
              <span className="font-mono font-bold w-3 text-center">{indent}</span>
              <button onClick={() => handleIndentChange(indent + 1)} disabled={indent >= 8} className="hover:text-primary">
                <Plus className="size-3" />
              </button>
            </div>
          )}
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
            <label htmlFor="json-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Input
            </label>
            <div className="flex items-center gap-3">
              <button onClick={loadExample} className="text-[10px] font-bold text-primary/70 hover:text-primary uppercase tracking-widest transition-colors">
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
            id="json-input"
            value={input}
            onChange={handleInputChange}
            placeholder='Paste your JSON here...'
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
                {validation.valid ? 'JSON is valid' : 'Invalid JSON'}
                {validation.error && <span className="ml-2 font-normal normal-case opacity-80 font-mono italic">— {validation.error}</span>}
              </p>
            </div>
          </div>
        )}

        {/* Output Section */}
        {mode !== 'validate' && (
          <div className="flex flex-col p-4 space-y-3 bg-muted/5">
            <div className="flex items-center justify-between px-1">
              <label htmlFor="json-output" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {mode === 'format' ? 'Formatted' : 'Minified'} Result
              </label>
              <div className="flex items-center gap-4">
                {output && (
                  <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">
                    {output.length} Chars {mode === 'minify' && input && `(${((1 - output.length / input.length) * 100).toFixed(0)}% saved)`}
                  </span>
                )}
                <button
                  onClick={() => copyToClipboard(output, 'output')}
                  disabled={!output}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${copied === 'output' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'}`}
                >
                  {copied === 'output' ? 'Copied' : 'Copy Result'}
                </button>
              </div>
            </div>
            <textarea
              id="json-output"
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

export default JSONFormatter

