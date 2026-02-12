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
  Pencil,
  Save,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatTime } from '@/lib/utils'
import { PageHeader, EmptyState, Button, Input, Textarea, Badge } from '@/components/ui'
import { ClipPreviewModal } from '@/components/ClipPreviewModal'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import { useClipDownload } from '@/hooks/useClipDownload'
import type { ClipWithVideo } from '@/types/database'

export default function ClipsPage() {
  const [clips, setClips] = useState<ClipWithVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [previewClip, setPreviewClip] = useState<ClipWithVideo | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editHashtags, setEditHashtags] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const { downloadingId, downloadClip } = useClipDownload()

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

  async function downloadAll() {
    const readyClips = clips.filter((c) => c.storage_path)
    for (const clip of readyClips) {
      await downloadClip(clip)
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  function startEditing(clip: ClipWithVideo) {
    setEditingId(clip.id)
    setEditTitle(clip.title)
    setEditDescription(clip.description ?? '')
    setEditHashtags(clip.hashtags.join(', '))
  }

  async function saveEdit(clipId: string) {
    setSavingId(clipId)
    try {
      const supabase = createClient()
      const hashtags = editHashtags.trim()
        ? editHashtags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
        : []

      const { error } = await supabase
        .from('clips')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          hashtags,
        })
        .eq('id', clipId)

      if (error) {
        console.error('Update error:', error)
        return
      }

      setClips((prev) =>
        prev.map((c) =>
          c.id === clipId
            ? { ...c, title: editTitle.trim(), description: editDescription.trim() || null, hashtags }
            : c
        )
      )
      setEditingId(null)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Mes Clips"
        subtitle={!loading ? (clips.length === 0 ? 'Aucun clip pour le moment' : `${clips.length} clip${clips.length > 1 ? 's' : ''} prêt${clips.length > 1 ? 's' : ''}`) : undefined}
        className="mb-8"
      >
        {clips.length > 1 && (
          <Button variant="secondary" icon={DownloadCloud} onClick={downloadAll}>
            Télécharger tous
          </Button>
        )}
      </PageHeader>

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
                {/* Thumbnail */}
                <button
                  onClick={() => setPreviewClip(clip)}
                  className="relative flex aspect-[9/16] max-h-64 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40"
                >
                  {clip.thumbnail_path ? (
                    <VideoThumbnail storagePath={clip.thumbnail_path} className="h-full w-full" />
                  ) : (
                    <Film className="h-16 w-16 text-white/20" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                      <Play className="h-8 w-8 text-white" fill="white" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {formatTime(duration)}
                  </span>
                </button>

                {/* Info */}
                <div className="p-5">
                  {clip.video?.title && (
                    <p className="mb-1 truncate text-xs text-white/30">{clip.video.title}</p>
                  )}

                  {editingId === clip.id ? (
                    <div className="space-y-3">
                      <Input
                        label="Titre"
                        icon={Pencil}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="px-3 py-2 text-sm"
                      />
                      <Textarea
                        label="Description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="px-3 py-2 text-sm"
                      />
                      <Input
                        label="Hashtags"
                        value={editHashtags}
                        onChange={(e) => setEditHashtags(e.target.value)}
                        placeholder="marketing, business, tips"
                        hint="Séparés par des virgules"
                        className="px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveEdit(clip.id)}
                          loading={savingId === clip.id}
                          disabled={!editTitle.trim()}
                          icon={Save}
                          size="sm"
                          className="flex-1"
                        >
                          Enregistrer
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                          disabled={savingId === clip.id}
                          icon={X}
                          size="sm"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="mb-1 text-xl font-bold text-white">{clip.title}</h3>
                      {clip.description && (
                        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/60">{clip.description}</p>
                      )}
                      {clip.hashtags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-1.5">
                          {clip.hashtags.map((tag) => (
                            <Badge key={tag} variant="purple" className="px-2.5 py-0.5 text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

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
                        <div className="flex gap-1">
                          {['TikTok', 'Reels', 'Shorts'].map((p) => (
                            <Badge key={p} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setPreviewClip(clip)} icon={Eye} size="sm" className="flex-1">
                          Prévisualiser
                        </Button>
                        <Button variant="secondary" onClick={() => startEditing(clip)} icon={Pencil} size="sm" className="flex-1">
                          Modifier
                        </Button>
                        <Button
                          onClick={() => downloadClip(clip)}
                          loading={downloadingId === clip.id}
                          icon={Download}
                          size="sm"
                          className="flex-1"
                        >
                          Télécharger
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && clips.length === 0 && (
        <EmptyState
          icon={Scissors}
          title="Aucun clip pour le moment"
          description="Importez une vidéo et laissez l'IA vous suggérer les meilleurs moments à extraire"
          actionLabel="Créer mon premier clip"
          actionHref="/upload"
          actionIcon={Film}
          className="py-20"
        />
      )}

      <ClipPreviewModal clip={previewClip} onClose={() => setPreviewClip(null)} />
    </div>
  )
}
