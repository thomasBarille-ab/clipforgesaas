'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CircleCheck } from 'lucide-react'
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        toast.error('Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.')
        setError('Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.')
        return
      }

      setSuccess(true)
      toast.success('Mot de passe mis à jour !')
      setTimeout(() => router.push('/dashboard'), 3000)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center backdrop-blur-xl">
        <CircleCheck className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h2 className="mb-2 text-xl font-bold text-white">Mot de passe mis à jour</h2>
        <p className="text-white/60">
          Redirection vers le dashboard...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Nouveau mot de passe</h1>
        <p className="mt-2 text-white/60">
          Choisissez votre nouveau mot de passe
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl"
      >
        <Input
          id="password"
          type="password"
          label="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="8 caractères minimum"
        />

        <Input
          id="confirmPassword"
          type="password"
          label="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Retapez votre mot de passe"
        />

        {error && <AlertBanner message={error} />}

        <Button
          type="submit"
          loading={loading}
          icon={Lock}
          size="lg"
          className="w-full"
        >
          Mettre à jour le mot de passe
        </Button>
      </form>
    </>
  )
}
