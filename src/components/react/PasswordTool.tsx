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
    <div className="w-full space-y-6">
      {/* Password Generator Section */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Generate Secure Password</h2>
          <p className="text-sm text-muted-foreground">
            Create a strong, random password with customizable options
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Length: {options.length}</span>
              <span className="text-xs text-muted-foreground">{options.length} characters</span>
            </label>
            <input
              type="range"
              min="8"
              max="64"
              value={options.length}
              onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeUppercase}
                onChange={(e) => setOptions({ ...options, includeUppercase: e.target.checked })}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm">Uppercase (A-Z)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeLowercase}
                onChange={(e) => setOptions({ ...options, includeLowercase: e.target.checked })}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm">Lowercase (a-z)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeNumbers}
                onChange={(e) => setOptions({ ...options, includeNumbers: e.target.checked })}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm">Numbers (0-9)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeSymbols}
                onChange={(e) => setOptions({ ...options, includeSymbols: e.target.checked })}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm">Symbols (!@#$...)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.excludeSimilar}
                onChange={(e) => setOptions({ ...options, excludeSimilar: e.target.checked })}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm">Exclude similar (i, l, 1, L, o, 0, O)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.excludeAmbiguous}
                onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
                className="rounded border-border accent-primary"
              />
              <span className="text-sm">Exclude ambiguous ({'{}[]()...'})</span>
            </label>
          </div>
        </div>

        <Button onClick={handleGenerate} className="w-full sm:w-auto">
          <RefreshCw className="size-4" />
          Generate Password
        </Button>
      </div>

      {/* Password Display & Strength Checker */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Check Password Strength</h2>
          <p className="text-sm text-muted-foreground">
            Enter a password to check its strength and get security recommendations
          </p>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handleCheckPassword}
                placeholder="Enter or generate a password"
                className="w-full px-4 py-2 pr-20 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button
              onClick={handleCopy}
              disabled={!password}
              variant="outline"
              size="icon"
              title="Copy password"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Strength Indicator */}
        {password && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Strength: {strength.label}</span>
              <span className="text-xs text-muted-foreground">{Math.round(strength.score)}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>

            {/* Feedback */}
            {strength.feedback.length > 0 && (
              <div className="rounded-md bg-muted/50 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">Recommendations:</p>
                <ul className="space-y-1">
                  {strength.feedback.map((item, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Password Stats */}
        {password && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <span className="text-xs text-muted-foreground">Length</span>
              <p className="text-lg font-semibold font-mono">{password.length}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Uppercase</span>
              <p className="text-lg font-semibold font-mono">
                {(password.match(/[A-Z]/g) || []).length}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Numbers</span>
              <p className="text-lg font-semibold font-mono">
                {(password.match(/[0-9]/g) || []).length}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Symbols</span>
              <p className="text-lg font-semibold font-mono">
                {(password.match(/[^a-zA-Z0-9]/g) || []).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PasswordTool

