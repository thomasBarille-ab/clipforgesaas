'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus, CircleCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AlertBanner, Button, Input, GoogleAuthButton, useToast } from '@/components/ui'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  function validate(): string | null {
    if (!email.trim()) return 'Veuillez entrer votre adresse email'
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères'
    if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (authError) {
        toast.error("Impossible de créer le compte. Vérifiez vos informations.")
        setError("Impossible de créer le compte. Vérifiez vos informations.")
        return
      }

      setSuccess(true)
      toast.success('Compte créé ! Vérifiez votre email.')
      setTimeout(() => router.push('/login'), 4000)
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
        <h2 className="mb-2 text-xl font-bold text-white">Compte créé avec succès !</h2>
        <p className="text-white/60">
          Vérifiez votre email pour confirmer votre inscription.
          <br />
          Redirection vers la page de connexion...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Créer un compte</h1>
        <p className="mt-2 text-white/60">
          Commencez à créer des clips en quelques minutes
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl">
        <GoogleAuthButton />

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-sm text-white/40">ou</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="vous@exemple.com"
          />

          <Input
            id="password"
            type="password"
            label="Mot de passe"
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
            icon={UserPlus}
            size="lg"
            className="w-full"
          >
            Créer mon compte
          </Button>

          <p className="text-center text-sm text-white/50">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </>
  )
}
