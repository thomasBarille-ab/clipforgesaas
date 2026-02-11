'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Film,
  Upload,
  Clock,
  Loader2,
  Sparkles,
  CircleAlert,
  Trash2,
  Play,
  HardDrive,
  Calendar,
  Scissors,
  ChevronDown,
  TrendingUp,
  Download,
  Eye,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatTime, formatFileSize } from '@/lib/utils'
import { ClipPreviewModal } from '@/components/ClipPreviewModal'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import type { Video, Clip, VideoStatus } from '@/types/database'

interface VideoWithClips extends Video {
  clips: Clip[]
}

const STATUS_LABELS: Record<VideoStatus, string> = {
  uploaded: 'En attente',
  processing: 'Transcription...',
  ready: 'Prête',
  failed: 'Erreur',
}

const STATUS_COLORS: Record<VideoStatus, string> = {
  uploaded: 'bg-yellow-500/20 text-yellow-300',
  processing: 'bg-blue-500/20 text-blue-300',
  ready: 'bg-emerald-500/20 text-emerald-300',
  failed: 'bg-red-500/20 text-red-300',
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoWithClips[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [transcribingId, setTranscribingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null)
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null)
  const [previewClip, setPreviewClip] = useState<Clip | null>(null)

  const loadVideos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('videos')
      .select('*, clips(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    setVideos((data as VideoWithClips[]) ?? [])
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  // Polling auto quand des vidéos sont en cours de traitement
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const hasProcessing = videos.some((v) => v.status === 'processing' || v.status === 'uploaded')

    if (hasProcessing && !pollingRef.current) {
      pollingRef.current = setInterval(() => loadVideos(true), 5000)
    } else if (!hasProcessing && pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [videos, loadVideos])

  async function downloadClip(clip: Clip) {
    if (!clip.storage_path) return
    setDownloadingClipId(clip.id)

    try {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('videos')
        .createSignedUrl(clip.storage_path, 300)

      if (data?.signedUrl) {
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
      setDownloadingClipId(null)
    }
  }

  async function deleteVideo(video: VideoWithClips) {
    setDeletingId(video.id)
    setConfirmDeleteId(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // 1. Supprimer les clips associés du Storage
      const { data: clips } = await supabase
        .from('clips')
        .select('id, storage_path')
        .eq('video_id', video.id)

      if (clips && clips.length > 0) {
        const clipPaths = clips
          .map((c) => c.storage_path)
          .filter(Boolean) as string[]

        if (clipPaths.length > 0) {
          await supabase.storage.from('videos').remove(clipPaths)
        }

        // Supprimer les clips de la DB
        await supabase.from('clips').delete().eq('video_id', video.id)
      }

      // 2. Supprimer les transcriptions
      await supabase.from('transcriptions').delete().eq('video_id', video.id)

      // 3. Supprimer les processing jobs
      await supabase.from('processing_jobs').delete().eq('video_id', video.id)

      // 4. Supprimer la vidéo du Storage
      if (video.storage_path) {
        await supabase.storage.from('videos').remove([video.storage_path])
      }

      // 5. Supprimer la vidéo de la DB
      await supabase.from('videos').delete().eq('id', video.id)

      // Mettre à jour la liste locale
      setVideos((prev) => prev.filter((v) => v.id !== video.id))
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeletingId(null)
    }
  }

  async function transcribeVideo(videoId: string) {
    setTranscribingId(videoId)

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      })

      if (response.ok) {
        // Recharger la liste pour voir le nouveau statut
        await loadVideos()
      } else {
        const result = await response.json()
        console.error('Transcription error:', result.error)
      }
    } catch (err) {
      console.error('Transcription error:', err)
    } finally {
      setTranscribingId(null)
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const videoToDelete = videos.find((v) => v.id === confirmDeleteId)

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Mes Vidéos
          </h1>
          {!loading && (
            <p className="mt-1 text-white/50">
              {videos.length === 0
                ? 'Aucune vidéo importée'
                : `${videos.length} vidéo${videos.length > 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        <Link
          href="/upload"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 font-semibold text-white transition-transform hover:scale-105"
        >
          <Upload className="h-5 w-5" />
          Importer une vidéo
        </Link>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/10" />
                <div className="flex-1">
                  <div className="mb-2 h-5 w-1/3 rounded bg-white/10" />
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                </div>
                <div className="h-7 w-24 rounded-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liste des vidéos */}
      {!loading && videos.length > 0 && (
        <div className="space-y-4">
          {videos.map((video) => {
            const readyClips = (video.clips ?? []).filter((c) => c.status === 'ready')
            const clipCount = readyClips.length
            const isDeleting = deletingId === video.id
            const isTranscribing = transcribingId === video.id
            const isExpanded = expandedVideoId === video.id

            return (
              <div
                key={video.id}
                className={cn(
                  'group overflow-hidden rounded-2xl border bg-white/5 transition-all duration-200',
                  isDeleting
                    ? 'border-red-500/30 opacity-50'
                    : 'border-white/10 hover:border-purple-500/30'
                )}
              >
                <div className="flex items-start gap-4 p-5">
                  {/* Miniature */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    {video.status === 'processing' || isTranscribing ? (
                      <div className="flex h-full w-full items-center justify-center bg-purple-500/20">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      </div>
                    ) : video.status === 'failed' ? (
                      <div className="flex h-full w-full items-center justify-center bg-red-500/20">
                        <CircleAlert className="h-6 w-6 text-red-400" />
                      </div>
                    ) : (
                      <VideoThumbnail storagePath={`${video.user_id}/thumbnails/${video.id}.jpg`} className="h-full w-full rounded-xl" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-3">
                      <h3 className="truncate text-lg font-semibold text-white">
                        {video.title}
                      </h3>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-3 py-0.5 text-xs font-medium',
                          STATUS_COLORS[video.status]
                        )}
                      >
                        {isTranscribing ? 'Transcription...' : STATUS_LABELS[video.status]}
                      </span>
                    </div>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/40">
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5" />
                        {formatFileSize(video.file_size_bytes)}
                      </span>
                      {video.duration_seconds && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(video.duration_seconds)}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(video.created_at)}
                      </span>
                      {clipCount > 0 && (
                        <button
                          onClick={() => setExpandedVideoId(isExpanded ? null : video.id)}
                          className="flex items-center gap-1.5 text-purple-400 transition-colors hover:text-purple-300"
                        >
                          <Scissors className="h-3.5 w-3.5" />
                          {clipCount} clip{clipCount > 1 ? 's' : ''}
                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 transition-transform duration-200',
                              isExpanded && 'rotate-180'
                            )}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {video.status === 'uploaded' && (
                      <button
                        onClick={() => transcribeVideo(video.id)}
                        disabled={isTranscribing || isDeleting}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all',
                          'bg-blue-500/20 hover:bg-blue-500/30',
                          (isTranscribing || isDeleting) && 'opacity-50'
                        )}
                      >
                        {isTranscribing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">Transcrire</span>
                      </button>
                    )}

                    {video.status === 'ready' && (
                      <Link
                        href={`/clips/create/${video.id}`}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span className="hidden sm:inline">Créer clips</span>
                      </Link>
                    )}

                    <button
                      onClick={() => setConfirmDeleteId(video.id)}
                      disabled={isDeleting}
                      className={cn(
                        'rounded-lg p-2 text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400',
                        isDeleting && 'opacity-50'
                      )}
                      title="Supprimer"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Dropdown clips */}
                {isExpanded && clipCount > 0 && (
                  <div className="border-t border-white/10 bg-white/[0.02]">
                    <div className="px-5 py-3">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
                        Clips générés ({clipCount})
                      </p>
                      <div className="space-y-2">
                        {readyClips.map((clip) => {
                          const clipDuration = clip.end_time_seconds - clip.start_time_seconds
                          return (
                            <div
                              key={clip.id}
                              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/[0.07]"
                            >
                              {/* Icône clip */}
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15">
                                <Scissors className="h-4 w-4 text-purple-400" />
                              </div>

                              {/* Info clip */}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">
                                  {clip.title}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-white/40">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(clipDuration)}
                                  </span>
                                  {clip.virality_score && (
                                    <span className="flex items-center gap-1 font-bold text-purple-400">
                                      <TrendingUp className="h-3 w-3" />
                                      {clip.virality_score.toFixed(1)}
                                    </span>
                                  )}
                                  {clip.hashtags.length > 0 && (
                                    <span className="hidden text-white/30 sm:inline">
                                      {clip.hashtags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions clip */}
                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  onClick={() => setPreviewClip(clip)}
                                  className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/10 hover:text-white/60"
                                  title="Prévisualiser"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => downloadClip(clip)}
                                  disabled={downloadingClipId === clip.id}
                                  className="rounded-lg p-2 text-white/30 transition-colors hover:bg-purple-500/20 hover:text-purple-400"
                                  title="Télécharger"
                                >
                                  {downloadingClipId === clip.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-20 text-center">
          <Film className="mb-4 h-16 w-16 text-white/15" />
          <h2 className="mb-2 text-xl font-semibold text-white/60">
            Aucune vidéo importée
          </h2>
          <p className="mb-6 max-w-sm text-sm text-white/40">
            Importez votre première vidéo pour commencer à créer des clips viraux
          </p>
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
          >
            <Upload className="h-5 w-5" />
            Importer une vidéo
          </Link>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {confirmDeleteId && videoToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Supprimer cette vidéo ?
              </h3>
            </div>

            <p className="mb-2 text-sm text-white/60">
              La vidéo <strong className="text-white">{videoToDelete.title}</strong> sera
              définitivement supprimée, ainsi que tous ses clips et transcriptions associés.
            </p>
            <p className="mb-6 text-sm text-red-400/80">
              Cette action est irréversible.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteVideo(videoToDelete)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal preview clip */}
      <ClipPreviewModal clip={previewClip} onClose={() => setPreviewClip(null)} />
    </div>
  )
}
