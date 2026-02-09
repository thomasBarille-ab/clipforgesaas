'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2, CircleCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        setError("Impossible de créer le compte. Vérifiez vos informations.")
        return
      }

      setSuccess(true)
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

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl"
      >
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/70">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="vous@exemple.com"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/70">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-white/70">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Retapez votre mot de passe"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <UserPlus className="h-5 w-5" />
          )}
          Créer mon compte
        </button>

        <p className="text-center text-sm text-white/50">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
            Se connecter
          </Link>
        </p>
      </form>
    </>
  )
}
