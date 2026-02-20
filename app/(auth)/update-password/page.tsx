'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { AlertBanner, Button, Input, useToast } from '@/components/ui'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const { t } = useTranslation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError(t('auth.updatePassword.passwordMinLength'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.updatePassword.passwordMismatch'))
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        toast.error(t('auth.updatePassword.cannotUpdate'))
        setError(t('auth.updatePassword.cannotUpdate'))
        return
      }

      setSuccess(true)
      toast.success(t('auth.updatePassword.toastSuccess'))
      setTimeout(() => router.push('/dashboard'), 3000)
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
        <h2 className="mb-2 text-xl font-bold text-white">{t('auth.updatePassword.successTitle')}</h2>
        <p className="text-white/60">
          {t('auth.updatePassword.successRedirect')}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">{t('auth.updatePassword.title')}</h1>
        <p className="mt-2 text-white/60">
          {t('auth.updatePassword.subtitle')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl"
      >
        <Input
          id="password"
          type="password"
          label={t('auth.updatePassword.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder={t('auth.updatePassword.passwordPlaceholder')}
        />

        <Input
          id="confirmPassword"
          type="password"
          label={t('auth.updatePassword.confirmPassword')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder={t('auth.updatePassword.confirmPasswordPlaceholder')}
        />

        {error && <AlertBanner message={error} />}

        <Button
          type="submit"
          loading={loading}
          icon={Lock}
          size="lg"
          className="w-full"
        >
          {t('auth.updatePassword.submit')}
        </Button>
      </form>
    </>
  )
}
