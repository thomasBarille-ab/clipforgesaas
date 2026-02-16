import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const VIDEOS_RETENTION_DAYS = 7
const CLIPS_RETENTION_DAYS = 15

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  // Vérifier le secret
  const { searchParams } = new URL(request.url)
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
    ?? searchParams.get('secret')

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results = { videos: { deleted: 0, errors: 0 }, clips: { deleted: 0, errors: 0 } }

  try {
    // ========================================
    // 1. Supprimer les vidéos > 7 jours
    // ========================================
    const videoCutoff = new Date()
    videoCutoff.setDate(videoCutoff.getDate() - VIDEOS_RETENTION_DAYS)

    const { data: oldVideos, error: videosError } = await supabase
      .from('videos')
      .select('id, user_id, storage_path')
      .lt('created_at', videoCutoff.toISOString())

    if (videosError) {
      console.error('Erreur récupération vidéos:', videosError)
    }

    if (oldVideos && oldVideos.length > 0) {
      // Supprimer les fichiers Storage des vidéos
      const videoPaths = oldVideos
        .map((v) => v.storage_path)
        .filter(Boolean) as string[]

      if (videoPaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('videos')
          .remove(videoPaths)

        if (storageError) {
          console.error('Erreur suppression storage vidéos:', storageError)
        }
      }

      // Supprimer les transcriptions associées (la FK CASCADE le fera,
      // mais on supprime aussi les thumbnails des vidéos)
      for (const video of oldVideos) {
        const thumbPath = `${video.user_id}/thumbnails/${video.id}.jpg`
        await supabase.storage.from('videos').remove([thumbPath])
      }

      // Supprimer les vidéos de la DB
      // (les clips auront video_id = NULL via ON DELETE SET NULL)
      const videoIds = oldVideos.map((v) => v.id)
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .in('id', videoIds)

      if (deleteError) {
        console.error('Erreur suppression DB vidéos:', deleteError)
        results.videos.errors = oldVideos.length
      } else {
        results.videos.deleted = oldVideos.length
      }
    }

    // ========================================
    // 2. Supprimer les clips > 15 jours
    // ========================================
    const clipCutoff = new Date()
    clipCutoff.setDate(clipCutoff.getDate() - CLIPS_RETENTION_DAYS)

    const { data: oldClips, error: clipsError } = await supabase
      .from('clips')
      .select('id, user_id, storage_path, thumbnail_path')
      .eq('status', 'ready')
      .lt('updated_at', clipCutoff.toISOString())

    if (clipsError) {
      console.error('Erreur récupération clips:', clipsError)
    }

    if (oldClips && oldClips.length > 0) {
      // Supprimer les fichiers Storage des clips + thumbnails
      const storagePaths: string[] = []
      for (const clip of oldClips) {
        if (clip.storage_path) storagePaths.push(clip.storage_path)
        if (clip.thumbnail_path) storagePaths.push(clip.thumbnail_path)
      }

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('videos')
          .remove(storagePaths)

        if (storageError) {
          console.error('Erreur suppression storage clips:', storageError)
        }
      }

      // Supprimer les clips de la DB
      const clipIds = oldClips.map((c) => c.id)
      const { error: deleteError } = await supabase
        .from('clips')
        .delete()
        .in('id', clipIds)

      if (deleteError) {
        console.error('Erreur suppression DB clips:', deleteError)
        results.clips.errors = oldClips.length
      } else {
        results.clips.deleted = oldClips.length
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erreur cron cleanup:', error)
    return NextResponse.json(
      { error: 'Erreur lors du nettoyage' },
      { status: 500 }
    )
  }
}
