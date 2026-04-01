import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { NotificationEmailPreferences } from '@/types/database'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_TYPES = [
  'clip_ready',
  'subscription_started',
  'subscription_changed',
  'subscription_canceled',
  'invoice_paid',
  'payment_failed',
  'expiry_warning',
] as const

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('notification_email_preferences')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  return NextResponse.json({
    preferences: (profile.notification_email_preferences as NotificationEmailPreferences | null)
      ?? { expiry_warning: true },
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: { preferences: NotificationEmailPreferences }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de la requête invalide' }, { status: 400 })
  }

  if (!body.preferences || typeof body.preferences !== 'object') {
    return NextResponse.json({ error: 'Préférences invalides' }, { status: 400 })
  }

  // Sanitize: only keep valid keys with boolean values
  const sanitized: NotificationEmailPreferences = {}
  for (const type of VALID_TYPES) {
    if (typeof body.preferences[type] === 'boolean') {
      sanitized[type] = body.preferences[type]
    }
  }

  const admin = getAdminClient()
  const { error: updateError } = await admin
    .from('profiles')
    .update({ notification_email_preferences: sanitized })
    .eq('id', user.id)

  if (updateError) {
    console.error('Notification preferences update error:', updateError)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ success: true, preferences: sanitized })
}
