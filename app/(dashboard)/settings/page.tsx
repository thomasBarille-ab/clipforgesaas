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
  Check,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { PageHeader, AlertBanner, Button, Input, GoogleAuthButton, useToast } from '@/components/ui'
import type { Profile, PlanType, CreatorPersona } from '@/types/database'

const PLAN_CONFIG: Record<PlanType, { label: string; color: string; icon: React.ElementType }> = {
  free: { label: 'Gratuit', color: 'bg-white/10 text-white/70', icon: Zap },
  pro: { label: 'Pro', color: 'bg-purple-500/20 text-purple-300', icon: Crown },
  business: { label: 'Business', color: 'bg-pink-500/20 text-pink-300', icon: Shield },
}

const PLANS_DETAILS: {
  key: PlanType
  name: string
  price: string
  description: string
  features: string[]
  badge?: string
}[] = [
  {
    key: 'free',
    name: 'Free',
    price: '0',
    description: 'Pour découvrir ClipForge',
    features: ['10 clips / mois', 'Toutes les features', 'Preview live', 'Export multi-format'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '24',
    description: 'Pour les créateurs sérieux',
    badge: 'Populaire',
    features: ['Clips illimités', 'Sans watermark', 'Tous styles de sous-titres', 'Support prioritaire'],
  },
  {
    key: 'business',
    name: 'Business',
    price: '49',
    description: 'Pour les équipes',
    features: ['Tout Pro +', 'IA personnalisée (Persona)', 'API access', 'Account manager dédié'],
  },
]

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
  const [switchingPlan, setSwitchingPlan] = useState<PlanType | null>(null)
  const [persona, setPersona] = useState<CreatorPersona | null>(null)
  const [refreshingPersona, setRefreshingPersona] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

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

      // Fetch persona si plan business
      if (p.plan === 'business') {
        const { data: personaData } = await supabase
          .from('creator_personas')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setPersona(personaData as CreatorPersona | null)
      } else {
        setPersona(null)
      }
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
        toast.error('Erreur lors de la mise à jour')
        setError('Erreur lors de la mise à jour du nom')
        return
      }

      setProfile({ ...profile, full_name: fullName.trim() || null })
      setEditing(false)
      setSaveSuccess(true)
      toast.success('Profil mis à jour !')
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
      toast.success('Déconnexion réussie !')
      router.push('/login')
    } catch {
      toast.error('Erreur lors de la déconnexion')
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
        toast.error(data.error ?? 'Erreur lors de la suppression du compte')
        setError(data.error ?? 'Erreur lors de la suppression du compte')
        setDeleting(false)
        return
      }

      toast.success('Compte supprimé')
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      toast.error('Une erreur est survenue')
      setError('Une erreur est survenue')
      setDeleting(false)
    }
  }

  async function handleSwitchPlan(newPlan: PlanType) {
    if (!profile || switchingPlan || newPlan === profile.plan) return
    setSwitchingPlan(newPlan)
    setError(null)

    try {
      const response = await fetch('/api/account/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error ?? 'Erreur lors du changement de plan')
        setError(data.error ?? 'Erreur lors du changement de plan')
        return
      }

      toast.success(`Plan changé en ${PLAN_CONFIG[newPlan].label} !`)
      await loadProfile()
    } catch {
      toast.error('Une erreur est survenue')
      setError('Une erreur est survenue')
    } finally {
      setSwitchingPlan(null)
    }
  }

  async function handleRefreshPersona() {
    if (refreshingPersona) return
    setRefreshingPersona(true)

    try {
      const response = await fetch('/api/persona/update', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error ?? 'Erreur lors de la mise à jour du persona')
        return
      }

      if (data.skipped) {
        toast.error(data.reason)
        return
      }

      toast.success('Persona mis à jour !')
      await loadProfile()
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setRefreshingPersona(false)
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
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Abonnement</h2>
          <div className="flex items-center gap-2">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', PLAN_CONFIG[plan].color)}>
              <PlanIcon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white/60">
              Plan {PLAN_CONFIG[plan].label}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS_DETAILS.map((p) => {
            const isCurrent = p.key === plan
            const PIcon = PLAN_CONFIG[p.key].icon
            const planOrder: PlanType[] = ['free', 'pro', 'business']
            const isUpgrade = planOrder.indexOf(p.key) > planOrder.indexOf(plan)
            const isDowngrade = planOrder.indexOf(p.key) < planOrder.indexOf(plan)
            const isSwitching = switchingPlan === p.key

            return (
              <div
                key={p.key}
                className={cn(
                  'relative flex flex-col rounded-xl border p-5 transition-all',
                  isCurrent
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5'
                )}
              >
                {p.badge && !isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-0.5 text-xs font-semibold text-white">
                    {p.badge}
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-3 py-0.5 text-xs font-semibold text-white">
                    Plan actuel
                  </div>
                )}

                <div className="mb-3 flex items-center gap-2">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', PLAN_CONFIG[p.key].color)}>
                    <PIcon className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-white">{p.name}</h3>
                </div>

                <div className="mb-1">
                  <span className="text-2xl font-bold text-white">{p.price}&euro;</span>
                  <span className="text-sm text-white/40">/mois</span>
                </div>
                <p className="mb-4 text-xs text-white/40">{p.description}</p>

                <ul className="mb-5 flex-1 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-center text-sm font-medium text-purple-300">
                    Actif
                  </div>
                ) : (
                  <button
                    onClick={() => handleSwitchPlan(p.key)}
                    disabled={switchingPlan !== null}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50',
                      isUpgrade
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-[1.02] hover:shadow-lg'
                        : 'border border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {isSwitching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isUpgrade ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : isDowngrade ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : null}
                    {isSwitching
                      ? 'Changement...'
                      : isUpgrade
                        ? `Passer en ${p.name}`
                        : `Revenir en ${p.name}`}
                  </button>
                )}
              </div>
            )
          })}
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
            {' '}&middot;{' '}
            {plan === 'free' ? (
              <span className="text-white/60">
                {profile?.credits_remaining ?? 0} crédit{(profile?.credits_remaining ?? 0) > 1 ? 's' : ''} restant{(profile?.credits_remaining ?? 0) > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-purple-300">Clips illimités</span>
            )}
          </p>
        </div>
      </section>

      {/* Persona IA — Business only */}
      {plan === 'business' && (
        <section className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5 p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                <Sparkles className="h-5 w-5 text-pink-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Persona IA</h2>
                <p className="text-xs text-white/40">Votre profil créateur analysé par l'IA</p>
              </div>
            </div>
            <button
              onClick={handleRefreshPersona}
              disabled={refreshingPersona}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshingPersona && 'animate-spin')} />
              {refreshingPersona ? 'Analyse...' : 'Rafraîchir'}
            </button>
          </div>

          {persona ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm leading-relaxed text-white/70">
                  {persona.persona_summary}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/30">
                <span>
                  Basé sur {persona.clip_count} clip{persona.clip_count > 1 ? 's' : ''}
                </span>
                <span>
                  Mis à jour le{' '}
                  {new Date(persona.updated_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="mb-1 text-sm text-white/50">Aucun persona généré</p>
              <p className="text-xs text-white/30">
                Générez au moins 3 clips pour que l'IA analyse votre style de création.
              </p>
            </div>
          )}
        </section>
      )}

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
