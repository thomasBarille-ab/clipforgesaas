import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendExpiryWarningEmail } from '@/lib/email/send'
import { createNotification, isEmailEnabledForType } from '@/lib/notifications'

// ═══════════════════════════════════════════════════════════════
// CRON: Avertissement d'expiration (24h avant suppression)
// Schedule: tous les jours à 8h UTC (1h avant le cleanup)
// URL: GET /api/cron/expiry-warnings
// Header: Authorization: Bearer <CRON_SECRET>
// Service externe recommandé: Upstash QStash, EasyCron, ou cron-job.org
// ═══════════════════════════════════════════════════════════════

const RETENTION_DAYS = 7

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
    ?? searchParams.get('secret')

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    // Fenêtre : fichiers créés entre 6 et 7 jours (expirent dans les prochaines 24h)
    const warningStart = new Date()
    warningStart.setDate(warningStart.getDate() - RETENTION_DAYS)

    const warningEnd = new Date()
    warningEnd.setDate(warningEnd.getDate() - (RETENTION_DAYS - 1))

    // Vidéos qui expirent dans les prochaines 24h
    const { data: expiringVideos, error: videosError } = await supabase
      .from('videos')
      .select('id, title, user_id')
      .gte('created_at', warningStart.toISOString())
      .lt('created_at', warningEnd.toISOString())

    if (videosError) {
      console.error('Erreur récupération vidéos expirantes:', videosError)
    }

    // Clips qui expirent dans les prochaines 24h
    const { data: expiringClips, error: clipsError } = await supabase
      .from('clips')
      .select('id, title, user_id')
      .eq('status', 'ready')
      .gte('created_at', warningStart.toISOString())
      .lt('created_at', warningEnd.toISOString())

    if (clipsError) {
      console.error('Erreur récupération clips expirants:', clipsError)
    }

    // Grouper par user_id
    const userItems = new Map<string, { videos: { title: string }[]; clips: { title: string }[] }>()

    for (const video of expiringVideos ?? []) {
      if (!userItems.has(video.user_id)) {
        userItems.set(video.user_id, { videos: [], clips: [] })
      }
      userItems.get(video.user_id)!.videos.push({ title: video.title })
    }

    for (const clip of expiringClips ?? []) {
      if (!userItems.has(clip.user_id)) {
        userItems.set(clip.user_id, { videos: [], clips: [] })
      }
      userItems.get(clip.user_id)!.clips.push({ title: clip.title })
    }

    // Récupérer les emails des utilisateurs concernés
    let emailsSent = 0

    for (const [userId, items] of userItems) {
      const totalCount = items.videos.length + items.clips.length

      // Créer la notification in-app (toujours)
      await createNotification(
        userId,
        'expiry_warning',
        'Fichiers expirant bientôt',
        `${totalCount} fichier${totalCount > 1 ? 's' : ''} expire${totalCount > 1 ? 'nt' : ''} dans les prochaines 24h.`
      )

      // Vérifier les préférences email
      const emailEnabled = await isEmailEnabledForType(userId, 'expiry_warning')
      if (!emailEnabled) continue

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      if (!profile?.email) {
        // Fallback: récupérer l'email via auth.users (admin)
        const { data: { user } } = await supabase.auth.admin.getUserById(userId)
        const email = user?.email
        if (!email) continue

        await sendExpiryWarningEmail(email, items.videos, items.clips)
        emailsSent++
      } else {
        await sendExpiryWarningEmail(profile.email, items.videos, items.clips)
        emailsSent++
      }
    }

    return NextResponse.json({
      success: true,
      usersNotified: emailsSent,
      expiringVideos: (expiringVideos ?? []).length,
      expiringClips: (expiringClips ?? []).length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erreur cron expiry-warnings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des avertissements' },
      { status: 500 }
    )
  }
}
