'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AlertBanner, Button, Input, GoogleAuthButton, useToast } from '@/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  function validate(): string | null {
    if (!email.trim()) return 'Veuillez entrer votre adresse email'
    if (!password) return 'Veuillez entrer votre mot de passe'
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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        toast.error('Identifiants invalides')
        setError('Email ou mot de passe incorrect')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Connexion</h1>
        <p className="mt-2 text-white/60">
          Accédez à votre espace ClipForge
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

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-white/70">
                Mot de passe
              </label>
              <Link
                href="/reset-password"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error && <AlertBanner message={error} />}

          <Button
            type="submit"
            loading={loading}
            icon={LogIn}
            size="lg"
            className="w-full"
          >
            Se connecter
          </Button>

          <p className="text-center text-sm text-white/50">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300 transition-colors">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
    </>
  )
}
