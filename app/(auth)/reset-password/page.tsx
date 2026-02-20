'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, CircleCheck, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { AlertBanner, Button, Input, useToast } from '@/components/ui'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const { t } = useTranslation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError(t('auth.resetPassword.enterEmail'))
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        }
      )

      if (resetError) {
        toast.error(t('auth.resetPassword.cannotSend'))
        setError(t('auth.resetPassword.cannotSend'))
        return
      }

      setSuccess(true)
      toast.success(t('auth.resetPassword.toastSuccess'))
    } catch {
      setError(t('common.genericError'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center backdrop-blur-xl">
        <CircleCheck className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h2 className="mb-2 text-xl font-bold text-white">{t('auth.resetPassword.successTitle')}</h2>
        <p className="text-white/60">
          {t('auth.resetPassword.successMessage')}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm text-purple-400 transition-colors hover:text-purple-300"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('auth.resetPassword.backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">{t('auth.resetPassword.title')}</h1>
        <p className="mt-2 text-white/60">
          {t('auth.resetPassword.subtitle')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl"
      >
        <Input
          id="email"
          type="email"
          label={t('auth.resetPassword.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder={t('auth.resetPassword.emailPlaceholder')}
        />

        {error && <AlertBanner message={error} />}

        <Button
          type="submit"
          loading={loading}
          icon={Mail}
          size="lg"
          className="w-full"
        >
          {t('auth.resetPassword.submit')}
        </Button>

        <p className="text-center text-sm text-white/50">
          <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
            {t('auth.resetPassword.backToLogin')}
          </Link>
        </p>
      </form>
    </>
  )
}
