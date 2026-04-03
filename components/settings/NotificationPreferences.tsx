'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Loader2,
  Save,
  Scissors,
  Crown,
  AlertTriangle,
  CreditCard,
  Clock,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import type { NotificationType, NotificationEmailPreferences as Prefs } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
}

const NOTIFICATION_TYPES: {
  type: NotificationType
  labelKey: string
  icon: React.ElementType
  color: string
  bg: string
}[] = [
  { type: 'clip_ready', labelKey: 'notifications.types.clip_ready', icon: Scissors, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { type: 'subscription_started', labelKey: 'notifications.types.subscription_started', icon: Crown, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { type: 'subscription_changed', labelKey: 'notifications.types.subscription_changed', icon: Crown, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { type: 'subscription_canceled', labelKey: 'notifications.types.subscription_canceled', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  { type: 'invoice_paid', labelKey: 'notifications.types.invoice_paid', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { type: 'payment_failed', labelKey: 'notifications.types.payment_failed', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  { type: 'expiry_warning', labelKey: 'notifications.types.expiry_warning', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
]

export function NotificationPreferences({ open, onClose }: Props) {
  const { t } = useTranslation()
  const [preferences, setPreferences] = useState<Prefs>({
    clip_ready: true,
    subscription_started: true,
    subscription_changed: true,
    subscription_canceled: true,
    invoice_paid: true,
    payment_failed: true,
    expiry_warning: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    async function fetchPrefs() {
      setLoading(true)
      try {
        const res = await fetch('/api/account/notification-preferences')
        if (res.ok) {
          const data = await res.json()
          setPreferences(data.preferences ?? { expiry_warning: true })
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }

    fetchPrefs()
  }, [open])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/account/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      })

      if (res.ok) {
        onClose()
      }
    } catch {
      // silent fail
    } finally {
      setSaving(false)
    }
  }

  function toggleType(type: NotificationType) {
    setPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{t('notifications.emailPreferences')}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="mb-4 text-sm text-white/50">{t('notifications.emailPreferencesDesc')}</p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/30" />
            </div>
          ) : (
            <div className="space-y-2">
              {NOTIFICATION_TYPES.map(({ type, labelKey, icon: Icon, color, bg }) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/5 px-4 py-3 text-left transition-all hover:border-white/10 hover:bg-white/[0.03]"
                >
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg)}>
                    <Icon className={cn('h-4 w-4', color)} />
                  </div>
                  <span className="flex-1 text-sm text-white/80">{t(labelKey)}</span>
                  {/* Toggle switch */}
                  <div
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors',
                      preferences[type] ? 'bg-orange-500' : 'bg-white/10'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                        preferences[type] ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-white/40 transition-colors hover:text-white/60"
          >
            {t('common.cancel')}
          </button>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={loading}
            icon={Save}
            variant="secondary"
            size="sm"
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
