import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, RefreshCw, ArrowUpDown } from 'lucide-react'

type Mode = 'encode' | 'decode'

const Base64Tool: React.FC = () => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<Mode>('encode')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'input' | 'output' | null>(null)

  const handleEncode = useCallback(() => {
    setError(null)
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)))
      setOutput(encoded)
    } catch (err) {
      setError('Failed to encode. Please check your input.')
      setOutput('')
    }
  }, [input])

  const handleDecode = useCallback(() => {
    setError(null)
    try {
      const decoded = decodeURIComponent(escape(atob(input)))
      setOutput(decoded)
    } catch (err) {
      setError('Failed to decode. Invalid Base64 string.')
      setOutput('')
    }
  }, [input])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    
    if (value.trim()) {
      if (mode === 'encode') {
        handleEncode()
      } else {
        handleDecode()
      }
    } else {
      setOutput('')
      setError(null)
    }
  }

  const handleModeChange = (newMode: Mode) => {
    const currentInput = input
    const currentOutput = output
    
    setMode(newMode)
    setError(null)
    
    // Swap input and output when switching modes
    if (currentOutput.trim()) {
      // Use current output as new input
      setInput(currentOutput)
      
      // Recalculate with swapped values
      if (newMode === 'encode') {
        try {
          const encoder = new TextEncoder()
          const bytes = encoder.encode(currentOutput)
          const binaryString = String.fromCharCode(...bytes)
          const encoded = btoa(binaryString)
          setOutput(encoded)
        } catch (err) {
          setError('Failed to encode')
          setOutput('')
        }
      } else {
        try {
          const binaryString = atob(currentOutput)
          const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0))
          const decoder = new TextDecoder()
          const decoded = decoder.decode(bytes)
          setOutput(decoded)
        } catch (err) {
          setError('Invalid Base64 string')
          setOutput('')
        }
      }
    } else {
      // If no output, just swap
      setInput(currentOutput)
      setOutput(currentInput)
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
    setError(null)
  }

  return (
    <div className="w-full">
      {/* Tool Header/Settings */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b bg-muted/30 gap-3">
        <div className="flex bg-background/50 p-1 rounded-lg border shadow-sm">
          <button
            onClick={() => handleModeChange('encode')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'encode'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            Encode
          </button>
          <button
            onClick={() => handleModeChange('decode')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'decode'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            Decode
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
            <label htmlFor="base64-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {mode === 'encode' ? 'Text' : 'Base64'} Input
            </label>
            <button
              onClick={() => copyToClipboard(input, 'input')}
              disabled={!input}
              className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${copied === 'input' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'}`}
            >
              {copied === 'input' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            id="base64-input"
            value={input}
            onChange={handleInputChange}
            placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 string to decode...'}
            className="w-full h-48 p-3 rounded-lg border bg-muted/5 text-foreground font-mono text-sm focus:ring-1 focus:ring-primary/30 resize-none transition-all"
          />
        </div>

        {/* Output Section */}
        <div className="flex flex-col p-4 space-y-3 bg-muted/5">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="base64-output" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {mode === 'encode' ? 'Base64' : 'Text'} Result
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
            id="base64-output"
            value={output}
            readOnly
            placeholder="Result will appear here..."
            className="w-full h-48 p-3 rounded-lg border bg-transparent text-foreground font-mono text-sm focus:ring-0 resize-none transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 border-t bg-destructive/5 text-destructive flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
        </div>
      )}
    </div>
  )
}

export default Base64Tool

