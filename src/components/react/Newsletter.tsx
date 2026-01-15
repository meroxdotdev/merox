import React, { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewsletterProps {
  className?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const Newsletter: React.FC<NewsletterProps> = ({ className }) => {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setStatus('error')
      setMessage('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
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
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setMessage('You\'re in! Check your email to confirm.')
      setEmail('')
      setConsent(false)
      
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
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

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input + Button Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === 'loading'}
              className={cn(
                "w-full h-12 px-4 text-sm rounded-xl",
                "bg-muted/50 border border-border/50",
                "text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-muted/70",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Email address"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className={cn(
              "h-12 px-6 rounded-xl font-semibold text-sm",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2 shrink-0"
            )}
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Subscribe</span>
            )}
          </button>
        </div>
        
        {/* Consent Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={status === 'loading'}
              className="peer sr-only"
            />
            <div className={cn(
              "h-5 w-5 rounded-md border-2 transition-all duration-200",
              "border-border/60 bg-background",
              "peer-checked:bg-primary peer-checked:border-primary",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
              "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
              "group-hover:border-muted-foreground/50"
            )}>
              <svg 
                className={cn(
                  "h-full w-full text-primary-foreground transition-opacity duration-200",
                  consent ? "opacity-100" : "opacity-0"
                )}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <span className="text-xs text-muted-foreground leading-relaxed select-none">
            I agree to receive newsletter emails.{' '}
            <a 
              href="/privacy/"
              className="text-foreground/80 underline underline-offset-2 hover:text-foreground transition-colors" 
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </a>
          </span>
        </label>
        
        {/* Status Message */}
        {message && (
          <div
            className={cn(
              'flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium',
              'animate-in fade-in slide-in-from-top-1 duration-200',
              status === 'success' 
                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                : 'bg-destructive/10 text-destructive'
            )}
            role="alert"
          >
            {status === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  )
}

export default Newsletter
