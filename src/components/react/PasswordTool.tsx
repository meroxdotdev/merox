import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, RefreshCw, Eye, EyeOff } from 'lucide-react'

interface PasswordOptions {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeSimilar: boolean
  excludeAmbiguous: boolean
}

interface StrengthResult {
  score: number
  label: string
  color: string
  feedback: string[]
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const SIMILAR = 'il1Lo0O'
const AMBIGUOUS = '{}[]()/\'"`~,;:.<>'

function generatePassword(options: PasswordOptions): string {
  let charset = ''

  if (options.includeUppercase) {
    charset += UPPERCASE
  }
  if (options.includeLowercase) {
    charset += LOWERCASE
  }
  if (options.includeNumbers) {
    charset += NUMBERS
  }
  if (options.includeSymbols) {
    charset += SYMBOLS
  }

  if (charset === '') {
    return ''
  }

  if (options.excludeSimilar) {
    charset = charset.split('').filter(char => !SIMILAR.includes(char)).join('')
  }

  if (options.excludeAmbiguous) {
    charset = charset.split('').filter(char => !AMBIGUOUS.includes(char)).join('')
  }

  if (charset === '') {
    return ''
  }

  const array = new Uint32Array(options.length)
  crypto.getRandomValues(array)

  let password = ''
  for (let i = 0; i < options.length; i++) {
    password += charset[array[i] % charset.length]
  }

  return password
}

function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'No password',
      color: 'bg-muted',
      feedback: [],
    }
  }

  let score = 0
  const feedback: string[] = []

  // Length scoring
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (password.length >= 20) score += 1

  if (password.length < 8) {
    feedback.push('Use at least 8 characters')
  }

  // Character variety
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)

  if (hasLower) score += 1
  if (hasUpper) score += 1
  if (hasNumber) score += 1
  if (hasSymbol) score += 1

  if (!hasLower) feedback.push('Add lowercase letters')
  if (!hasUpper) feedback.push('Add uppercase letters')
  if (!hasNumber) feedback.push('Add numbers')
  if (!hasSymbol) feedback.push('Add symbols')

  // Entropy calculation
  let charsetSize = 0
  if (hasLower) charsetSize += 26
  if (hasUpper) charsetSize += 26
  if (hasNumber) charsetSize += 10
  if (hasSymbol) charsetSize += 32

  const entropy = password.length * Math.log2(charsetSize)
  if (entropy < 28) {
    feedback.push('Password entropy is too low')
  } else if (entropy >= 60) {
    score += 1
  }

  // Common patterns
  const commonPatterns = [
    /12345/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
    /monkey/i,
    /12345678/,
    /qwerty123/,
    /password123/,
  ]

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password))
  if (hasCommonPattern) {
    score = Math.max(0, score - 2)
    feedback.push('Avoid common patterns')
  }

  // Repetition check
  const hasRepetition = /(.)\1{2,}/.test(password)
  if (hasRepetition) {
    score = Math.max(0, score - 1)
    feedback.push('Avoid repeating characters')
  }

  // Sequential characters
  const hasSequential = /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)
  if (hasSequential) {
    score = Math.max(0, score - 1)
    feedback.push('Avoid sequential characters')
  }

  // Normalize score to 0-100
  score = Math.min(100, Math.max(0, (score / 10) * 100))

  let label: string
  let color: string

  if (score < 30) {
    label = 'Very Weak'
    color = 'bg-red-500'
  } else if (score < 50) {
    label = 'Weak'
    color = 'bg-orange-500'
  } else if (score < 70) {
    label = 'Fair'
    color = 'bg-yellow-500'
  } else if (score < 90) {
    label = 'Strong'
    color = 'bg-green-500'
  } else {
    label = 'Very Strong'
    color = 'bg-green-600'
  }

  return {
    score,
    label,
    color,
    feedback: feedback.length > 0 ? feedback : ['Password looks good!'],
  }
}

const PasswordTool: React.FC = () => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  })

  const strength = useMemo(() => calculateStrength(password), [password])

  const handleGenerate = useCallback(() => {
    const newPassword = generatePassword(options)
    setPassword(newPassword)
    setShowPassword(true)
  }, [options])

  const handleCopy = useCallback(async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [password])

  const handleCheckPassword = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }, [])

  return (
    <div className="w-full">
      {/* Result Section */}
      <div className="p-4 sm:p-6 space-y-4 border-b bg-muted/5">
        <div className="relative group">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handleCheckPassword}
            placeholder="Generated password..."
            className="w-full px-4 py-3 pr-12 rounded-xl border bg-background text-lg font-mono tracking-wider focus:ring-1 focus:ring-primary/30 transition-all shadow-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>

        {password && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={`size-2 rounded-full animate-pulse ${strength.color}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{strength.label}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{Math.round(strength.score)}% Score</span>
            </div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${strength.color}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={handleGenerate}
            className="flex-1 h-10 rounded-xl shadow-sm font-bold uppercase tracking-widest text-xs"
          >
            <RefreshCw className="size-3.5 mr-2" />
            Generate
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!password}
            className={`h-10 px-4 rounded-xl transition-colors ${copied ? 'text-green-500 border-green-500/30 bg-green-500/5' : ''}`}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="p-4 sm:p-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Length</label>
            <span className="text-xs font-mono font-bold text-primary">{options.length}</span>
          </div>
          <input
            type="range"
            min="8"
            max="64"
            value={options.length}
            onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'upper', label: 'Uppercase', key: 'includeUppercase' },
            { id: 'lower', label: 'Lowercase', key: 'includeLowercase' },
            { id: 'numbers', label: 'Numbers', key: 'includeNumbers' },
            { id: 'symbols', label: 'Symbols', key: 'includeSymbols' },
          ].map((opt) => (
            <label key={opt.id} className="flex items-center justify-between p-2 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
              <span className="text-xs font-medium opacity-80">{opt.label}</span>
              <input
                type="checkbox"
                checked={options[opt.key as keyof PasswordOptions] as boolean}
                onChange={(e) => setOptions({ ...options, [opt.key]: e.target.checked })}
                className="size-3.5 rounded border-border accent-primary"
              />
            </label>
          ))}
          <label className="sm:col-span-2 flex items-center justify-between p-2 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer transition-colors">
            <span className="text-xs font-medium opacity-80">Exclude similar (i, l, 1, L, o, 0, O)</span>
            <input
              type="checkbox"
              checked={options.excludeSimilar}
              onChange={(e) => setOptions({ ...options, excludeSimilar: e.target.checked })}
              className="size-3.5 rounded border-border accent-primary"
            />
          </label>
        </div>

        {password && strength.feedback.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 border border-dashed space-y-2">
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              Feedback
            </h4>
            <ul className="space-y-1">
              {strength.feedback.map((item, index) => (
                <li key={index} className="text-[10px] text-muted-foreground flex items-center gap-2 italic">
                  <div className="size-1 rounded-full bg-primary/30" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default PasswordTool

