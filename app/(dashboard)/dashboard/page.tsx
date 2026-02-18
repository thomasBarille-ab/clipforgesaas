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
  CircleAlert,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatTime, formatFileSize } from '@/lib/utils'
import { VIDEO_STATUS_LABELS, VIDEO_STATUS_COLORS } from '@/lib/constants'
import { PageHeader, EmptyState, Badge } from '@/components/ui'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import type { Video, ClipWithVideo } from '@/types/database'

interface Stats {
  totalVideos: number
  readyClips: number
  processingJobs: number
}

const STAT_CARDS = [
  { key: 'totalVideos' as const, label: 'Vidéos importées', icon: Film, color: 'bg-purple-500/20', iconColor: 'text-purple-400' },
  { key: 'readyClips' as const, label: 'Clips prêts', icon: Scissors, color: 'bg-pink-500/20', iconColor: 'text-pink-400' },
  { key: 'processingJobs' as const, label: 'En cours de traitement', icon: Loader2, color: 'bg-blue-500/20', iconColor: 'text-blue-400' },
]

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
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader title="Dashboard" subtitle="Gérez vos vidéos et clips en un coup d'oeil">
        <Link
          href="/upload"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 font-semibold text-white transition-transform hover:scale-105"
        >
          <Upload className="h-5 w-5" />
          Importer une vidéo
        </Link>
      </PageHeader>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/upload"
          className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-left transition-transform hover:scale-[1.02]"
        >
          <Upload className="mb-2 h-8 w-8 text-white" />
          <strong className="mb-1 block text-white">Upload vidéo</strong>
          <span className="text-sm text-white/80">Créez vos premiers clips</span>
        </Link>
        <Link
          href="/clips"
          className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:border-purple-500/50"
        >
          <Scissors className="mb-2 h-8 w-8 text-purple-400" />
          <strong className="mb-1 block text-white">Mes clips</strong>
          <span className="text-sm text-slate-400">Voir, éditer et publier vos clips</span>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, iconColor }) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', color)}>
              <Icon className={cn('h-5 w-5', iconColor, key === 'processingJobs' && stats.processingJobs > 0 && 'animate-spin')} />
            </div>
            {loading ? (
              <div className="h-8 w-12 animate-pulse rounded bg-white/10" />
            ) : (
              <p className="text-2xl font-bold text-white">{stats[key]}</p>
            )}
            <p className="mt-1 text-sm text-white/50">{label}</p>
          </div>
        ))}
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
          <EmptyState
            icon={Film}
            title="Aucune vidéo importée"
            description="Commencez par importer votre première vidéo"
            actionLabel="Importer"
            actionHref="/upload"
            actionIcon={Upload}
            className="py-12"
          />
        )}

        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={video.status === 'ready' ? `/clips/create/${video.id}` : '/videos'}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-purple-500/30 hover:bg-white/[0.07]"
              >
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

                  <Badge
                    variant={video.status === 'ready' ? 'emerald' : video.status === 'processing' ? 'blue' : video.status === 'failed' ? 'red' : 'yellow'}
                    className="absolute left-1.5 top-1.5 px-2 py-0.5 text-[10px] backdrop-blur-sm"
                  >
                    {VIDEO_STATUS_LABELS[video.status]}
                  </Badge>

                  {video.duration_seconds && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {formatTime(video.duration_seconds)}
                    </span>
                  )}
                </div>

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
          <EmptyState
            icon={Scissors}
            title="Aucun clip généré"
            description="Vos clips apparaîtront ici une fois générés"
            className="py-12"
          />
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
                  <div className="relative aspect-square overflow-hidden bg-white/5">
                    {clip.thumbnail_path ? (
                      <VideoThumbnail storagePath={clip.thumbnail_path} className="h-full w-full" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-purple-500/10">
                        <Scissors className="h-8 w-8 text-purple-400/40" />
                      </div>
                    )}

                    {clip.video?.title && (
                      <span className="absolute left-1.5 top-1.5 max-w-[calc(100%-12px)] truncate rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                        {clip.video.title}
                      </span>
                    )}

                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {formatTime(duration)}
                    </span>

                    {clip.virality_score && (
                      <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-md bg-purple-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        <TrendingUp className="h-2.5 w-2.5" />
                        {clip.virality_score.toFixed(1)}
                      </span>
                    )}
                  </div>

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
