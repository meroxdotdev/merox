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
    <div className="w-full space-y-6">
      {/* Mode Selector */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant={mode === 'encode' ? 'default' : 'outline'}
            onClick={() => handleModeChange('encode')}
            className="flex-1"
          >
            Encode
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleModeChange(mode === 'encode' ? 'decode' : 'encode')}
            title="Switch mode"
          >
            <ArrowUpDown className="size-4" />
          </Button>
          <Button
            variant={mode === 'decode' ? 'default' : 'outline'}
            onClick={() => handleModeChange('decode')}
            className="flex-1"
          >
            Decode
          </Button>
        </div>
      </div>

      {/* Input Section */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="base64-input" className="text-sm font-medium">
            {mode === 'encode' ? 'Text to Encode' : 'Base64 to Decode'}
          </label>
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
        <textarea
          id="base64-input"
          value={input}
          onChange={handleInputChange}
          placeholder={mode === 'encode' ? 'Enter text to encode to Base64...' : 'Enter Base64 string to decode...'}
          rows={6}
          className="w-full px-4 py-2 rounded-md border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-y"
        />
      </div>

      {/* Output Section */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="base64-output" className="text-sm font-medium">
            {mode === 'encode' ? 'Base64 Encoded' : 'Decoded Text'}
          </label>
          <div className="flex items-center gap-2">
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
        </div>
        <textarea
          id="base64-output"
          value={output}
          readOnly
          placeholder={mode === 'encode' ? 'Encoded Base64 will appear here...' : 'Decoded text will appear here...'}
          rows={6}
          className="w-full px-4 py-2 rounded-md border bg-muted/50 text-foreground font-mono text-sm resize-y"
        />
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

    </div>
  )
}

export default Base64Tool

