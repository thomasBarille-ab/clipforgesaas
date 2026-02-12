'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  Pencil,
  Save,
  Loader2,
  LogOut,
  Trash2,
  Crown,
  Zap,
  Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { PageHeader, AlertBanner, Button, Input, GoogleAuthButton } from '@/components/ui'
import type { Profile, PlanType } from '@/types/database'

const PLAN_CONFIG: Record<PlanType, { label: string; color: string; icon: React.ElementType }> = {
  free: { label: 'Gratuit', color: 'bg-white/10 text-white/70', icon: Zap },
  pro: { label: 'Pro', color: 'bg-purple-500/20 text-purple-300', icon: Crown },
  business: { label: 'Business', color: 'bg-pink-500/20 text-pink-300', icon: Shield },
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authProvider, setAuthProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [signingOut, setSigningOut] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const provider = user.app_metadata?.provider ?? 'email'
      setAuthProvider(provider)

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !data) {
        setError('Impossible de charger le profil')
        return
      }

      const p = data as Profile
      setProfile(p)
      setFullName(p.full_name ?? '')
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handleSaveName() {
    if (!profile || saving) return
    setSaving(true)
    setSaveSuccess(false)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null })
        .eq('id', profile.id)

      if (updateError) {
        setError('Erreur lors de la mise à jour du nom')
        return
      }

      setProfile({ ...profile, full_name: fullName.trim() || null })
      setEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      setError('Erreur lors de la déconnexion')
      setSigningOut(false)
    }
  }

  async function handleDeleteAccount() {
    if (!profile || deleting) return
    setDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error ?? 'Erreur lors de la suppression du compte')
        setDeleting(false)
        return
      }

      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      setError('Une erreur est survenue')
      setDeleting(false)
    }
  }

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || ''
  const initials = displayName.slice(0, 2).toUpperCase()
  const plan = profile?.plan ?? 'free'
  const PlanIcon = PLAN_CONFIG[plan].icon

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title="Paramètres" subtitle="Gérez votre compte et vos préférences" />

      {error && <AlertBanner message={error} />}
      {saveSuccess && <AlertBanner variant="success" message="Profil mis à jour" />}

      {/* Profil */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="mb-5 text-lg font-semibold text-white">Profil</h2>

        <div className="flex items-start gap-5">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold text-white">
              {initials}
            </div>
          )}

          <div className="flex-1 space-y-3">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  placeholder="Votre nom"
                  autoFocus
                  className="max-w-xs px-3 py-2 text-sm"
                />
                <Button
                  onClick={handleSaveName}
                  loading={saving}
                  icon={Save}
                  variant="secondary"
                  size="sm"
                >
                  Enregistrer
                </Button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFullName(profile?.full_name ?? '')
                  }}
                  className="rounded-lg px-2 py-2 text-sm text-white/40 transition-colors hover:text-white/60"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-white/40" />
                <span className="font-medium text-white">
                  {profile?.full_name || <span className="italic text-white/30">Aucun nom</span>}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md p-1 text-white/30 transition-colors hover:text-purple-400"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-white/40" />
              <span className="text-sm text-white/60">{profile?.email}</span>
            </div>

            {authProvider && (
              <div className="flex items-center gap-2">
                {authProvider === 'google' ? (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-sm text-white/40">Connecté via Google</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 text-white/40" />
                    <span className="text-sm text-white/40">Connecté via email</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Abonnement */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="mb-5 text-lg font-semibold text-white">Abonnement</h2>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', PLAN_CONFIG[plan].color)}>
              <PlanIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-white">Plan {PLAN_CONFIG[plan].label}</p>
              <p className="text-sm text-white/40">
                {profile?.credits_remaining ?? 0} crédit{(profile?.credits_remaining ?? 0) > 1 ? 's' : ''} restant{(profile?.credits_remaining ?? 0) > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {plan === 'free' && (
            <Button disabled icon={Crown} size="sm">
              Passer en Pro — bientôt disponible
            </Button>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.03] p-4">
          <p className="text-sm text-white/40">
            Membre depuis le{' '}
            <span className="text-white/60">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </p>
        </div>
      </section>

      {/* Compte */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="mb-5 text-lg font-semibold text-white">Compte</h2>

        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Se déconnecter
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-left text-sm text-red-400/70 transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer mon compte
            </button>
          ) : (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="mb-3 text-sm text-red-300">
                Cette action est irréversible. Toutes vos vidéos, clips et données seront supprimés définitivement.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  loading={deleting}
                  icon={Trash2}
                  size="sm"
                >
                  Confirmer la suppression
                </Button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-4 py-2 text-sm text-white/40 transition-colors hover:text-white/60"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
