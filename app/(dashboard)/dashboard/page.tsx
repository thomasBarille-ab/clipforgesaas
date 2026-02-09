'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Upload,
  Film,
  Scissors,
  Clock,
  Loader2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CircleAlert,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatTime, formatFileSize } from '@/lib/utils'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import type { Video, Clip, VideoStatus } from '@/types/database'

interface ClipWithVideo extends Clip {
  video: { title: string } | null
}

interface Stats {
  totalVideos: number
  readyClips: number
  processingJobs: number
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

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [clips, setClips] = useState<ClipWithVideo[]>([])
  const [stats, setStats] = useState<Stats>({ totalVideos: 0, readyClips: 0, processingJobs: 0 })
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const [videosRes, clipsRes, jobsRes] = await Promise.all([
      supabase
        .from('videos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('clips')
        .select('*, video:videos(title)')
        .eq('user_id', session.user.id)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('processing_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .in('status', ['pending', 'processing']),
    ])

    const videosList = (videosRes.data ?? []) as Video[]
    const clipsList = (clipsRes.data ?? []) as ClipWithVideo[]

    setVideos(videosList)
    setClips(clipsList)
    setStats({
      totalVideos: videosList.length,
      readyClips: clipsList.length,
      processingJobs: jobsRes.count ?? 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">Dashboard</h1>
          <p className="mt-1 text-white/50">
            Gérez vos vidéos et clips en un coup d&apos;oeil
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 font-semibold text-white transition-transform hover:scale-105"
        >
          <Upload className="h-5 w-5" />
          Importer une vidéo
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
            <Film className="h-5 w-5 text-purple-400" />
          </div>
          {loading ? (
            <div className="h-8 w-12 animate-pulse rounded bg-white/10" />
          ) : (
            <p className="text-2xl font-bold text-white">{stats.totalVideos}</p>
          )}
          <p className="mt-1 text-sm text-white/50">Vidéos importées</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20">
            <Scissors className="h-5 w-5 text-pink-400" />
          </div>
          {loading ? (
            <div className="h-8 w-12 animate-pulse rounded bg-white/10" />
          ) : (
            <p className="text-2xl font-bold text-white">{stats.readyClips}</p>
          )}
          <p className="mt-1 text-sm text-white/50">Clips prêts</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            <Loader2 className={cn('h-5 w-5 text-blue-400', stats.processingJobs > 0 && 'animate-spin')} />
          </div>
          {loading ? (
            <div className="h-8 w-12 animate-pulse rounded bg-white/10" />
          ) : (
            <p className="text-2xl font-bold text-white">{stats.processingJobs}</p>
          )}
          <p className="mt-1 text-sm text-white/50">En cours de traitement</p>
        </div>
      </div>

      {/* Vidéos récentes */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Vidéos récentes</h2>
          {videos.length > 0 && (
            <Link href="/videos" className="flex items-center gap-1 text-sm text-purple-400 transition-colors hover:text-purple-300">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <div className="aspect-square bg-white/10" />
                <div className="p-3">
                  <div className="mb-1 h-4 w-3/4 rounded bg-white/10" />
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 py-12 text-center">
            <Film className="mb-3 h-12 w-12 text-white/15" />
            <p className="mb-1 text-white/50">Aucune vidéo importée</p>
            <p className="mb-4 text-sm text-white/30">Commencez par importer votre première vidéo</p>
            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              <Upload className="h-4 w-4" />
              Importer
            </Link>
          </div>
        )}

        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={video.status === 'ready' ? `/clips/create/${video.id}` : '/videos'}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-purple-500/30 hover:bg-white/[0.07]"
              >
                {/* Miniature carrée */}
                <div className="relative aspect-square overflow-hidden bg-white/5">
                  {video.status === 'processing' ? (
                    <div className="flex h-full w-full items-center justify-center bg-purple-500/10">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                    </div>
                  ) : video.status === 'failed' ? (
                    <div className="flex h-full w-full items-center justify-center bg-red-500/10">
                      <CircleAlert className="h-8 w-8 text-red-400" />
                    </div>
                  ) : (
                    <VideoThumbnail storagePath={`${video.user_id}/thumbnails/${video.id}.jpg`} className="h-full w-full" />
                  )}

                  {/* Badge statut */}
                  <span className={cn(
                    'absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm',
                    STATUS_COLORS[video.status]
                  )}>
                    {STATUS_LABELS[video.status]}
                  </span>

                  {/* Durée */}
                  {video.duration_seconds && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {formatTime(video.duration_seconds)}
                    </span>
                  )}
                </div>

                {/* Titre */}
                <div className="p-2.5">
                  <p className="truncate text-sm font-medium text-white">{video.title}</p>
                  <p className="mt-0.5 text-xs text-white/40">{formatFileSize(video.file_size_bytes)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Derniers clips */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Derniers clips</h2>
          {clips.length > 0 && (
            <Link href="/clips" className="flex items-center gap-1 text-sm text-purple-400 transition-colors hover:text-purple-300">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <div className="aspect-square bg-white/10" />
                <div className="p-3">
                  <div className="mb-1 h-4 w-3/4 rounded bg-white/10" />
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && clips.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 py-12 text-center">
            <Scissors className="mb-3 h-12 w-12 text-white/15" />
            <p className="text-white/50">Aucun clip généré</p>
            <p className="mt-1 text-sm text-white/30">
              Vos clips apparaîtront ici une fois générés
            </p>
          </div>
        )}

        {!loading && clips.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {clips.map((clip) => {
              const duration = clip.end_time_seconds - clip.start_time_seconds
              return (
                <Link
                  key={clip.id}
                  href="/clips"
                  className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-purple-500/30 hover:bg-white/[0.07]"
                >
                  {/* Miniature carrée */}
                  <div className="relative aspect-square overflow-hidden bg-white/5">
                    {clip.thumbnail_path ? (
                      <VideoThumbnail storagePath={clip.thumbnail_path} className="h-full w-full" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-purple-500/10">
                        <Scissors className="h-8 w-8 text-purple-400/40" />
                      </div>
                    )}

                    {/* Badge vidéo source */}
                    {clip.video?.title && (
                      <span className="absolute left-1.5 top-1.5 max-w-[calc(100%-12px)] truncate rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                        {clip.video.title}
                      </span>
                    )}

                    {/* Durée */}
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {formatTime(duration)}
                    </span>

                    {/* Score viralité */}
                    {clip.virality_score && (
                      <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-md bg-purple-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        <TrendingUp className="h-2.5 w-2.5" />
                        {clip.virality_score.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <p className="truncate text-sm font-medium text-white">{clip.title}</p>
                    {clip.hashtags.length > 0 && (
                      <p className="mt-1 truncate text-xs text-purple-300/60">
                        {clip.hashtags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
