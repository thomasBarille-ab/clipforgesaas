import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { BrandingConfig, BrandingPosition } from '@/types/database'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_POSITIONS: BrandingPosition[] = ['center', 'bottom-right', 'bottom-left', 'top-right', 'top-left']

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan, branding_config')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  if (profile.plan !== 'business') {
    return NextResponse.json({ error: 'Fonctionnalité réservée au plan Business' }, { status: 403 })
  }

  return NextResponse.json({ brandingConfig: profile.branding_config as BrandingConfig | null })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  if (profile.plan !== 'business') {
    return NextResponse.json({ error: 'Fonctionnalité réservée au plan Business' }, { status: 403 })
  }

  let body: BrandingConfig
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de la requête invalide' }, { status: 400 })
  }

  // Validate shape
  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Le champ "enabled" est requis' }, { status: 400 })
  }

  if (body.text && body.text.length > 100) {
    return NextResponse.json({ error: 'Le texte ne peut pas dépasser 100 caractères' }, { status: 400 })
  }

  if (body.position && !VALID_POSITIONS.includes(body.position)) {
    return NextResponse.json({ error: 'Position invalide' }, { status: 400 })
  }

  const config: BrandingConfig = {
    enabled: body.enabled,
    text: (body.text ?? '').slice(0, 100),
    logoPath: body.logoPath ?? null,
    position: body.position ?? 'bottom-right',
    showLogo: body.showLogo ?? false,
    showText: body.showText ?? true,
    textColor: body.textColor ?? '#FFFFFF',
    textOpacity: Math.max(0.1, Math.min(1.0, body.textOpacity ?? 0.7)),
  }

  const admin = getAdminClient()
  const { error: updateError } = await admin
    .from('profiles')
    .update({ branding_config: config })
    .eq('id', user.id)

  if (updateError) {
    console.error('Branding config update error:', updateError)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ success: true, brandingConfig: config })
}
