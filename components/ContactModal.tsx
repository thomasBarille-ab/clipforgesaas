'use client'

import { useState } from 'react'
import { Send, Mail, MessageSquare, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal, Input, Textarea, Button } from '@/components/ui'

interface Props {
  open: boolean
  onClose: () => void
  defaultEmail?: string
}

export function ContactModal({ open, onClose, defaultEmail }: Props) {
  const { t } = useTranslation()
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    onClose()
    // Reset after animation
    setTimeout(() => {
      if (sent) {
        setEmail(defaultEmail ?? '')
        setMessage('')
        setSent(false)
      }
      setError(null)
    }, 200)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sending || !email.trim() || !message.trim()) return

    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? t('common.genericError'))
        return
      }

      setSent(true)
    } catch {
      setError(t('common.genericError'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} showCloseButton>
      <div className="p-6">
        {sent ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {t('contact.sent', 'Message sent!')}
              </h2>
              <p className="mt-1 text-sm text-white/50">
                {t('contact.sentDesc', "We'll get back to you as soon as possible.")}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleClose}>
              {t('common.close', 'Close')}
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">
                {t('contact.title', 'Contact us')}
              </h2>
              <p className="mt-1 text-sm text-white/50">
                {t('contact.subtitle', "Have a question or feedback? We'd love to hear from you.")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="contact-email"
                label={t('contact.email', 'Your email')}
                icon={Mail}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Textarea
                id="contact-message"
                label={t('contact.message', 'Message')}
                icon={MessageSquare}
                placeholder={t('contact.messagePlaceholder', 'How can we help you?')}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm text-white/40 transition-colors hover:text-white/60"
                >
                  {t('common.cancel')}
                </button>
                <Button
                  type="submit"
                  loading={sending}
                  disabled={!email.trim() || !message.trim()}
                  icon={Send}
                  size="sm"
                >
                  {t('contact.send', 'Send')}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  )
}
