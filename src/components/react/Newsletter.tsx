import React, { useState, useEffect, useRef } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NewsletterProps {
  className?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

interface ApiResponse {
  message?: string
  error?: string
  success?: boolean
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Newsletter: React.FC<NewsletterProps> = ({ className }) => {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email.trim())
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setStatus('error')
      setMessage('Please enter your email address')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    if (!consent) {
      setStatus('error')
      setMessage('Please accept the privacy policy to subscribe')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail.toLowerCase() }),
      })

      let data: ApiResponse
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        try {
          data = await response.json()
        } catch {
          throw new Error('Invalid response from server')
        }
      } else {
        const text = await response.text()
        throw new Error(text || 'Failed to subscribe')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setMessage('You\'re in! Check your email to confirm.')
      setEmail('')
      setConsent(false)
      
      // Clear message after 5 seconds
      timeoutRef.current = setTimeout(() => {
        setStatus('idle')
        setMessage('')
        timeoutRef.current = null
      }, 5000)
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error 
          ? error.message 
          : 'Something went wrong. Please try again.'
      )
    }
  }

  const messageId = 'newsletter-message'
  const isInvalid = status === 'error' && message !== ''

  return (
    <div className={cn('w-full max-w-md mx-auto px-1', className)}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Input + Button Row */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="email"
              id="newsletter-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === 'loading'}
              required
              aria-required="true"
              aria-invalid={isInvalid}
              aria-describedby={message ? messageId : undefined}
              className={cn(
                "w-full h-11 px-4 text-base rounded-md",
                "bg-background border",
                status === 'error' && message
                  ? "border-destructive focus-visible:border-destructive"
                  : "border-border",
                "text-foreground placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Email address"
            />
          </div>
          <Button
            type="submit"
            disabled={status === 'loading'}
            size="lg"
            className="w-full h-11"
            aria-busy={status === 'loading'}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Subscribing...</span>
              </>
            ) : (
              'Subscribe'
            )}
          </Button>
        </div>
        
        {/* Consent Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative flex items-center justify-center shrink-0">
            <input
              type="checkbox"
              id="newsletter-consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={status === 'loading'}
              required
              aria-required="true"
              className="peer sr-only"
            />
            <div 
              className={cn(
                "h-5 w-5 rounded border-2 transition-all",
                "border-border bg-background",
                "peer-checked:bg-primary peer-checked:border-primary",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                "peer-disabled:opacity-50",
                "group-hover:border-foreground/20",
                status === 'error' && !consent && message.includes('privacy')
                  ? "border-destructive"
                  : ""
              )}
              aria-hidden="true"
            >
              <svg 
                className={cn(
                  "h-full w-full text-primary-foreground transition-opacity",
                  consent ? "opacity-100" : "opacity-0"
                )}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
                strokeLinecap="round" 
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <span className="text-sm text-muted-foreground leading-relaxed select-none flex-1">
            I agree to receive newsletter emails.{' '}
            <a 
              href="/privacy/"
              className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded" 
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </a>
          </span>
        </label>
        
        {/* Status Message */}
        {message && (
          <div
            id={messageId}
            className={cn(
              'flex items-start gap-2.5 py-3 px-4 rounded-md text-sm',
              'animate-in fade-in slide-in-from-top-1 duration-200',
              status === 'success' 
                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                : 'bg-destructive/10 text-destructive'
            )}
            role="alert"
            aria-live={status === 'error' ? 'assertive' : 'polite'}
          >
            {status === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span className="flex-1">{message}</span>
          </div>
        )}
      </form>
    </div>
  )
}

export default Newsletter
