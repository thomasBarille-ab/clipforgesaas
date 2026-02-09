'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Film,
  Play,
  Download,
  Eye,
  TrendingUp,
  Clock,
  Loader2,
  Scissors,
  DownloadCloud,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatTime } from '@/lib/utils'
import { ClipPreviewModal } from '@/components/ClipPreviewModal'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import type { Clip } from '@/types/database'

interface ClipWithVideo extends Clip {
  video: { title: string } | null
}

export default function ClipsPage() {
  const [clips, setClips] = useState<ClipWithVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [previewClip, setPreviewClip] = useState<ClipWithVideo | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const loadClips = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('clips')
      .select('*, video:videos(title)')
      .eq('user_id', session.user.id)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })

    setClips((data as ClipWithVideo[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadClips()
  }, [loadClips])

  async function downloadClip(clip: ClipWithVideo) {
    if (!clip.storage_path) return
    setDownloadingId(clip.id)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(clip.storage_path, 300)

      if (error) {
        console.error('Download signed URL error:', error)
        return
      }

      if (data?.signedUrl) {
        // Télécharger le blob puis déclencher le download
        const res = await fetch(data.signedUrl)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${clip.title}.mp4`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  async function downloadAll() {
    const readyClips = clips.filter((c) => c.storage_path)
    for (const clip of readyClips) {
      await downloadClip(clip)
      // Petit délai entre chaque pour éviter de bloquer le navigateur
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  const readyCount = clips.length

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Mes Clips
          </h1>
          {!loading && (
            <p className="mt-1 text-white/50">
              {readyCount === 0
                ? 'Aucun clip pour le moment'
                : `${readyCount} clip${readyCount > 1 ? 's' : ''} prêt${readyCount > 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {readyCount > 1 && (
          <button
            onClick={downloadAll}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <DownloadCloud className="h-4 w-4" />
            Télécharger tous
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="aspect-[9/16] max-h-64 w-full bg-white/5" />
              <div className="p-5">
                <div className="mb-2 h-5 w-3/4 rounded bg-white/10" />
                <div className="mb-1 h-4 w-full rounded bg-white/5" />
                <div className="mb-4 h-4 w-2/3 rounded bg-white/5" />
                <div className="flex gap-2">
                  <div className="h-9 w-28 rounded-lg bg-white/5" />
                  <div className="h-9 w-28 rounded-lg bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grille de clips */}
      {!loading && clips.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {clips.map((clip) => {
            const duration = clip.end_time_seconds - clip.start_time_seconds

            return (
              <div
                key={clip.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-200 hover:border-purple-500/50"
              >
                {/* Thumbnail / Preview zone */}
                <button
                  onClick={() => setPreviewClip(clip)}
                  className="relative flex aspect-[9/16] max-h-64 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40"
                >
                  {clip.thumbnail_path ? (
                    <VideoThumbnail
                      storagePath={clip.thumbnail_path}
                      className="h-full w-full"
                    />
                  ) : (
                    <Film className="h-16 w-16 text-white/20" />
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                      <Play className="h-8 w-8 text-white" fill="white" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {formatTime(duration)}
                  </span>
                </button>

                {/* Info */}
                <div className="p-5">
                  {/* Vidéo source */}
                  {clip.video?.title && (
                    <p className="mb-1 truncate text-xs text-white/30">
                      {clip.video.title}
                    </p>
                  )}

                  {/* Titre */}
                  <h3 className="mb-1 text-xl font-bold text-white">
                    {clip.title}
                  </h3>

                  {/* Description */}
                  {clip.description && (
                    <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/60">
                      {clip.description}
                    </p>
                  )}

                  {/* Hashtags */}
                  {clip.hashtags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {clip.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta : durée + score + plateformes */}
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(clip.start_time_seconds)} → {formatTime(clip.end_time_seconds)}
                    </span>
                    {clip.virality_score && (
                      <span className="flex items-center gap-1 font-bold text-purple-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {clip.virality_score.toFixed(1)}
                      </span>
                    )}
                    {/* Platform badges */}
                    <div className="flex gap-1">
                      {['TikTok', 'Reels', 'Shorts'].map((p) => (
                        <span
                          key={p}
                          className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewClip(clip)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4" />
                      Prévisualiser
                    </button>
                    <button
                      onClick={() => downloadClip(clip)}
                      disabled={downloadingId === clip.id}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all',
                        'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105',
                        downloadingId === clip.id && 'opacity-70 hover:scale-100'
                      )}
                    >
                      {downloadingId === clip.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Télécharger
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && clips.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-20 text-center">
          <Scissors className="mb-4 h-16 w-16 text-white/15" />
          <h2 className="mb-2 text-xl font-semibold text-white/60">
            Aucun clip pour le moment
          </h2>
          <p className="mb-6 max-w-sm text-sm text-white/40">
            Importez une vidéo et laissez l&apos;IA vous suggérer les meilleurs moments à extraire
          </p>
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
          >
            <Film className="h-5 w-5" />
            Créer mon premier clip
          </Link>
        </div>
      )}

      {/* Modal Preview */}
      <ClipPreviewModal clip={previewClip} onClose={() => setPreviewClip(null)} />
    </div>
  )
}
