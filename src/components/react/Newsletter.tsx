import React, { useState } from 'react'
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NEWSLETTER_CONSENT_TEXT } from '@/consts'

interface NewsletterProps {
  variant?: 'default' | 'compact' | 'inline'
  className?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const Newsletter: React.FC<NewsletterProps> = ({ 
  variant = 'default',
  className 
}) => {
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

    // GDPR compliance: Require explicit consent
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
      setMessage('Successfully subscribed! Please check your email to confirm your subscription.')
      setEmail('')
      setConsent(false)
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error 
          ? error.message 
          : 'Something went wrong. Please try again later.'
      )
    }
  }

  // Compact variant (for footer)
  if (variant === 'compact') {
    return (
      <div className={cn('w-full', className)}>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === 'loading'}
                className="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-border bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Email address"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={status === 'loading'}
              size="default"
              className="shrink-0 h-10 px-6 gap-2"
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Subscribe
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          
          {/* GDPR Compliant Consent Checkbox */}
          <div className="flex items-start gap-2 pl-2 sm:pl-10">
            <input
              type="checkbox"
              id="newsletter-consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={status === 'loading'}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              required
            />
            <label
              htmlFor="newsletter-consent"
              className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
            >
              {NEWSLETTER_CONSENT_TEXT.text} <a href={NEWSLETTER_CONSENT_TEXT.privacyLink} className="underline hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">{NEWSLETTER_CONSENT_TEXT.privacyText}</a>
            </label>
          </div>
          
          {message && (
            <div
              className={cn(
                'flex items-center gap-2 text-xs px-1',
                status === 'success' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-destructive'
              )}
              role="alert"
            >
              {status === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}
        </form>
      </div>
    )
  }

  // Inline variant (for after blog posts)
  if (variant === 'inline') {
    return (
      <div className={cn('rounded-xl border bg-card/50 p-6', className)}>
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-1">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get the latest posts delivered to your inbox. No spam, unsubscribe anytime.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={status === 'loading'}
                  className="flex-1 px-4 py-2 text-sm rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Email address"
                  required
                />
                <Button
                  type="submit"
                  disabled={status === 'loading'}
                  size="default"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="sr-only">Subscribing...</span>
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </div>
              
              {/* GDPR Consent */}
              <div className="flex items-start gap-2 pl-0 sm:pl-4">
                <input
                  type="checkbox"
                  id="newsletter-consent-inline"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={status === 'loading'}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 disabled:opacity-50 shrink-0 cursor-pointer"
                  required
                />
                <label
                  htmlFor="newsletter-consent-inline"
                  className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
                >
                  {NEWSLETTER_CONSENT_TEXT.text} <a href={NEWSLETTER_CONSENT_TEXT.privacyLink} className="underline hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">{NEWSLETTER_CONSENT_TEXT.privacyText}</a>
                </label>
              </div>
              
              {message && (
                <div
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                  )}
                  role="alert"
                >
                  {status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{message}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Default variant (for homepage CTA section)
  return (
    <div className={cn('rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm p-8', className)}>
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">
          Subscribe to the Newsletter
        </h3>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Get the latest posts about infrastructure, HPC, Kubernetes, and more delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === 'loading'}
              className="flex-1 px-4 py-2.5 text-sm rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Email address"
              required
            />
            <Button
              type="submit"
              disabled={status === 'loading'}
              size="lg"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="sr-only">Subscribing...</span>
                </>
              ) : (
                'Subscribe'
              )}
            </Button>
          </div>
          
          {/* GDPR Consent */}
          <div className="flex items-start gap-2 pl-0 sm:pl-4">
            <input
              type="checkbox"
              id="newsletter-consent-default"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={status === 'loading'}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 disabled:opacity-50 shrink-0 cursor-pointer"
              required
            />
            <label
              htmlFor="newsletter-consent-default"
              className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
            >
              {NEWSLETTER_CONSENT_TEXT.text} <a href={NEWSLETTER_CONSENT_TEXT.privacyLink} className="underline hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">{NEWSLETTER_CONSENT_TEXT.privacyText}</a>
            </label>
          </div>
          
          {message && (
            <div
              className={cn(
                'flex items-center justify-center gap-2 text-sm',
                status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              )}
              role="alert"
            >
              {status === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{message}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default Newsletter
