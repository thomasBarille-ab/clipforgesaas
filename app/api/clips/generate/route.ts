import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canCreateClip } from '@/lib/plans'
import type { PlanType } from '@/types/database'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Vous devez être connecté' },
      { status: 401 }
    )
  }

  // 2. Vérifier la limite de clips par mois
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan as PlanType) ?? 'free'
  const clipCheck = await canCreateClip(supabase, user.id, plan)

  if (!clipCheck.allowed) {
    return NextResponse.json(
      { error: `Limite atteinte : ${clipCheck.used}/${clipCheck.limit} clips ce mois-ci. Passez au plan Pro pour des clips illimités.` },
      { status: 403 }
    )
  }

  // 3. Parse body
  let clipId: string
  let storagePath: string
  let thumbnailPath: string | null = null
  try {
    const body = await request.json()
    clipId = body.clipId
    storagePath = body.storagePath
    thumbnailPath = body.thumbnailPath ?? null
  } catch {
    return NextResponse.json(
      { error: 'Corps de la requête invalide' },
      { status: 400 }
    )
  }

  if (!clipId || !storagePath) {
    return NextResponse.json(
      { error: 'Les paramètres clipId et storagePath sont requis' },
      { status: 400 }
    )
  }

  // 4. Vérifier ownership du clip
  const { data: clip, error: clipError } = await supabase
    .from('clips')
    .select('id')
    .eq('id', clipId)
    .eq('user_id', user.id)
    .single()

  if (clipError || !clip) {
    return NextResponse.json(
      { error: 'Clip introuvable ou accès non autorisé' },
      { status: 404 }
    )
  }

  // 4. Mettre à jour le clip avec le storage_path + status ready
  const { error: updateError } = await supabase
    .from('clips')
    .update({
      status: 'ready',
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
    })
    .eq('id', clipId)

  if (updateError) {
    console.error('Clip update error:', updateError)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du clip' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: { clipId, storagePath },
  })
}
