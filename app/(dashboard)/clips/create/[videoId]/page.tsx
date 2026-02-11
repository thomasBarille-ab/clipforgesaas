'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Sparkles,
  Plus,
  Clock,
  Loader2,
  CircleAlert,
  Film,
  TrendingUp,
  Check,
  ArrowLeft,
  Wand2,
  Search,
  MessageSquare,
  Send,
  Pencil,
  AlignLeft,
  Hash,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatTime, formatFileSize } from '@/lib/utils'
import { trimAndCropVideo } from '@/lib/ffmpeg'
import { generateSrt, filterSegmentsForClip } from '@/lib/generateSrt'
import { SubtitlePreview } from '@/components/SubtitlePreview'
import { SubtitleEditor } from '@/components/SubtitleEditor'
import { CropTimelineEditor, DEFAULT_CROP_TIMELINE } from '@/components/CropTimelineEditor'
import { CollapsibleBlock } from '@/components/CollapsibleBlock'
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitles'
import type { SubtitleStyle } from '@/types/subtitles'
import type { CropTimelineConfig } from '@/components/CropTimelineEditor'
import type { Video, ClipInsert, TranscriptionSegment } from '@/types/database'

interface ClipSuggestion {
  start: number
  end: number
  title: string
  description: string
  hashtags: string[]
  score: number
}

type GeneratingState = {
  step: 'creating' | 'loading-ffmpeg' | 'downloading' | 'processing' | 'uploading' | 'finalizing' | 'done'
  progress: number
}

const STEP_LABELS: Record<GeneratingState['step'], string> = {
  creating: 'Création du clip...',
  'loading-ffmpeg': 'Chargement de FFmpeg...',
  downloading: 'Téléchargement de la vidéo...',
  processing: 'Encodage en cours (peut prendre quelques minutes)...',
  uploading: 'Upload du clip...',
  finalizing: 'Finalisation...',
  done: 'Clip créé !',
}

export default function CreateClipsPage() {
  const params = useParams<{ videoId: string }>()
  const router = useRouter()
  const videoId = params.videoId

  const [video, setVideo] = useState<Video | null>(null)
  const [suggestions, setSuggestions] = useState<ClipSuggestion[]>([])
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [videoSignedUrl, setVideoSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState<GeneratingState | null>(null)
  const [createdIndices, setCreatedIndices] = useState<Set<number>>(new Set())

  // Recherche par prompt
  const [searchPrompt, setSearchPrompt] = useState('')
  const [searchResults, setSearchResults] = useState<ClipSuggestion[]>([])
  const [searching, setSearching] = useState(false)

  // Étape de personnalisation des sous-titres
  const [customizing, setCustomizing] = useState<{
    suggestion: ClipSuggestion
    index: number
  } | null>(null)
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(DEFAULT_SUBTITLE_STYLE)
  const [cropTimeline, setCropTimeline] = useState<CropTimelineConfig>(DEFAULT_CROP_TIMELINE)
  const [clipTitle, setClipTitle] = useState('')
  const [clipDescription, setClipDescription] = useState('')
  const [clipHashtags, setClipHashtags] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Fetch video
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single()

      if (videoError || !videoData) {
        setError('Vidéo introuvable')
        setLoading(false)
        return
      }

      const vid = videoData as Video
      setVideo(vid)

      // Fetch en parallèle : suggestions + transcription + signed URL
      const [suggestionsRes, transcriptionRes, signedUrlRes] = await Promise.all([
        fetch('/api/clips/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        }).then((r) => r.json()),
        supabase
          .from('transcriptions')
          .select('segments')
          .eq('video_id', videoId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase.storage
          .from('videos')
          .createSignedUrl(vid.storage_path, 3600),
      ])

      if (suggestionsRes.error) {
        setError(suggestionsRes.error)
      } else {
        setSuggestions(suggestionsRes.data?.suggestions ?? [])
      }

      if (transcriptionRes.data?.segments) {
        setSegments(transcriptionRes.data.segments as TranscriptionSegment[])
      }

      if (signedUrlRes.data?.signedUrl) {
        setVideoSignedUrl(signedUrlRes.data.signedUrl)
      }
    } catch {
      setError('Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Segments filtrés pour le clip en cours de personnalisation
  const clipSegments = useMemo(() => {
    if (!customizing) return []
    return filterSegmentsForClip(
      segments,
      customizing.suggestion.start,
      customizing.suggestion.end
    )
  }, [customizing, segments])

  function openCustomizer(suggestion: ClipSuggestion, index: number) {
    setCustomizing({ suggestion, index })
    setSubtitleStyle(DEFAULT_SUBTITLE_STYLE)
    setCropTimeline(DEFAULT_CROP_TIMELINE)
    setClipTitle(suggestion.title)
    setClipDescription(suggestion.description)
    setClipHashtags(suggestion.hashtags.join(', '))
    setError(null)
  }

  function closeCustomizer() {
    setCustomizing(null)
    setGenerating(null)
  }

  async function handleSearch() {
    if (!searchPrompt.trim() || searching) return
    setSearching(true)
    setError(null)

    try {
      const res = await fetch('/api/clips/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, prompt: searchPrompt.trim() }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setSearchResults([])
      } else {
        setSearchResults(data.data?.suggestions ?? [])
      }
    } catch {
      setError('Erreur lors de la recherche')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  async function generateClip() {
    if (!customizing || generating) return
    const { suggestion, index } = customizing

    setGenerating({ step: 'creating', progress: 0 })
    setError(null)

    let clipId: string | null = null

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('Vous devez être connecté')
        setGenerating(null)
        return
      }

      // 1. Insérer le clip dans la DB
      const clipInsert: ClipInsert = {
        video_id: videoId,
        user_id: session.user.id,
        title: clipTitle.trim() || suggestion.title,
        description: clipDescription.trim() || suggestion.description,
        hashtags: clipHashtags.trim()
          ? clipHashtags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
          : suggestion.hashtags,
        start_time_seconds: suggestion.start,
        end_time_seconds: suggestion.end,
        storage_path: null,
        thumbnail_path: null,
        subtitle_style: JSON.stringify(subtitleStyle),
        status: 'generating',
        virality_score: suggestion.score,
      }

      const { data: clip, error: clipError } = await supabase
        .from('clips')
        .insert(clipInsert)
        .select('id')
        .single()

      if (clipError || !clip) {
        console.error('Supabase error:', clipError)
        setError('Erreur lors de la création du clip')
        setGenerating(null)
        return
      }

      clipId = clip.id

      // 2. Préparer les données pour FFmpeg
      setGenerating({ step: 'loading-ffmpeg', progress: 5 })

      // Obtenir un signed URL frais si nécessaire
      let ffmpegVideoUrl = videoSignedUrl
      if (!ffmpegVideoUrl) {
        const { data: videoRecord } = await supabase
          .from('videos')
          .select('storage_path')
          .eq('id', videoId)
          .single()

        if (!videoRecord?.storage_path) {
          throw new Error('Vidéo source introuvable')
        }

        const { data: signedUrlData } = await supabase.storage
          .from('videos')
          .createSignedUrl(videoRecord.storage_path, 3600)

        ffmpegVideoUrl = signedUrlData?.signedUrl ?? null
      }

      if (!ffmpegVideoUrl) {
        throw new Error('Impossible de générer le lien de téléchargement')
      }

      // 3. Générer le SRT (seulement si sous-titres activés)
      let srtContent: string | null = null
      if (subtitleStyle.enabled && segments.length > 0) {
        srtContent = generateSrt(segments, suggestion.start, suggestion.end)
        console.log('[clip] SRT generated:', srtContent.split('\n').length, 'lines')
      }

      // 4. Traiter la vidéo avec FFmpeg WASM
      setGenerating({ step: 'downloading', progress: 10 })

      const { videoBlob, thumbnailBlob } = await trimAndCropVideo({
        videoUrl: ffmpegVideoUrl,
        startSeconds: suggestion.start,
        endSeconds: suggestion.end,
        srtContent,
        subtitleStyle: subtitleStyle.enabled ? subtitleStyle : undefined,
        cropSegments: cropTimeline.enabled
          ? cropTimeline.segments.map((s) => ({ startTime: s.time, cropX: s.cropX }))
          : undefined,
        onProgress: (p) => {
          setGenerating({ step: 'processing', progress: 10 + Math.round(p * 0.6) })
        },
      })

      // 5. Uploader le clip + miniature
      setGenerating({ step: 'uploading', progress: 75 })

      const clipStoragePath = `${session.user.id}/clips/${clip.id}.mp4`
      const thumbStoragePath = `${session.user.id}/thumbnails/clips/${clip.id}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(clipStoragePath, videoBlob, {
          contentType: 'video/mp4',
          upsert: true,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error("Erreur lors de l'upload du clip")
      }

      let finalThumbPath: string | null = null
      if (thumbnailBlob.size > 0) {
        const { error: thumbUploadError } = await supabase.storage
          .from('videos')
          .upload(thumbStoragePath, thumbnailBlob, {
            contentType: 'image/jpeg',
            upsert: true,
          })
        if (thumbUploadError) {
          console.error('[clip-thumb] Upload error:', thumbUploadError.message)
        } else {
          finalThumbPath = thumbStoragePath
          console.log('[clip-thumb] Uploaded to:', thumbStoragePath)
        }
      }

      // 6. Finaliser
      setGenerating({ step: 'finalizing', progress: 90 })

      const response = await fetch('/api/clips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipId: clip.id,
          storagePath: clipStoragePath,
          thumbnailPath: finalThumbPath,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la finalisation du clip')
      }

      // 7. Succès
      setGenerating({ step: 'done', progress: 100 })
      setCreatedIndices((prev) => new Set(prev).add(index))

      setTimeout(() => {
        setGenerating(null)
        setCustomizing(null)
        router.push('/clips')
      }, 1500)
    } catch (err) {
      console.error('Clip generation error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération du clip')

      if (clipId) {
        try {
          const supabase = createClient()
          await supabase
            .from('clips')
            .update({ status: 'failed' })
            .eq('id', clipId)
        } catch { /* best-effort */ }
      }

      setGenerating(null)
    }
  }

  // ──────────────────────────────────────────────
  // VUE : Personnalisation des sous-titres
  // ──────────────────────────────────────────────
  if (customizing) {
    const { suggestion } = customizing

    return (
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={closeCustomizer}
            disabled={generating !== null}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Personnaliser le clip</h1>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <CircleAlert className="h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Barre de progression */}
        {generating && (
          <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-purple-300">
                {generating.step === 'done' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {STEP_LABELS[generating.step]}
              </span>
              <span className="text-sm text-purple-400">{generating.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${generating.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Layout 3 colonnes : Infos | Preview | Sous-titres */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[3fr_4fr_5fr] xl:gap-8">
          {/* Colonne gauche : Infos du clip */}
          <div className="space-y-4">
            <CollapsibleBlock title="Informations" icon={Pencil}>
              <div className="space-y-4">
                {/* Titre */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                    <Pencil className="h-4 w-4" />
                    Titre
                  </label>
                  <input
                    type="text"
                    value={clipTitle}
                    onChange={(e) => setClipTitle(e.target.value)}
                    placeholder="Titre du clip"
                    disabled={generating !== null}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                    <AlignLeft className="h-4 w-4" />
                    Description
                  </label>
                  <textarea
                    value={clipDescription}
                    onChange={(e) => setClipDescription(e.target.value)}
                    placeholder="Description pour les réseaux sociaux"
                    disabled={generating !== null}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                {/* Hashtags */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                    <Hash className="h-4 w-4" />
                    Hashtags
                  </label>
                  <input
                    type="text"
                    value={clipHashtags}
                    onChange={(e) => setClipHashtags(e.target.value)}
                    placeholder="marketing, business, tips"
                    disabled={generating !== null}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                  />
                  <p className="mt-1.5 text-xs text-white/30">Séparés par des virgules</p>
                </div>
              </div>
            </CollapsibleBlock>

            {/* Cadrage */}
            <CropTimelineEditor
              config={cropTimeline}
              onChange={setCropTimeline}
              videoUrl={videoSignedUrl}
              startSeconds={suggestion.start}
              clipDuration={suggestion.end - suggestion.start}
            />

            {/* Info clip (durée / score) */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(suggestion.start)} → {formatTime(suggestion.end)}
                </span>
                {suggestion.score > 0 && (
                  <span className="flex items-center gap-1 font-bold text-purple-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {suggestion.score.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Colonne centre : Preview + Bouton */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-[300px]">
              {videoSignedUrl ? (
                <SubtitlePreview
                  videoUrl={videoSignedUrl}
                  startSeconds={suggestion.start}
                  endSeconds={suggestion.end}
                  segments={clipSegments}
                  style={subtitleStyle}
                  cropTimeline={cropTimeline}
                />
              ) : (
                <div className="flex aspect-[9/16] items-center justify-center rounded-2xl bg-white/5">
                  <Loader2 className="h-8 w-8 animate-spin text-white/20" />
                </div>
              )}
            </div>

            {/* Bouton générer */}
            <button
              onClick={generateClip}
              disabled={generating !== null}
              className={cn(
                'flex w-full max-w-[300px] items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white transition-all',
                'bg-gradient-to-r from-purple-600 to-pink-600',
                generating
                  ? 'opacity-70'
                  : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25'
              )}
            >
              {generating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="h-5 w-5" />
              )}
              Générer le clip
            </button>
          </div>

          {/* Colonne droite : Sous-titres */}
          <div>
            <SubtitleEditor style={subtitleStyle} onChange={setSubtitleStyle} />
          </div>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────
  // VUE : Liste des suggestions
  // ──────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Créer des Clips
        </h1>

        {video && (
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <Film className="h-4 w-4" />
              {video.title}
            </span>
            {video.duration_seconds && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatTime(video.duration_seconds)}
              </span>
            )}
            <span>{formatFileSize(video.file_size_bytes)}</span>
          </div>
        )}
      </div>

      {/* Erreur globale */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <CircleAlert className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Recherche par prompt */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
          <MessageSquare className="h-4 w-4 text-pink-400" />
          Décrivez le clip que vous voulez
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ex: le moment où il parle de marketing, la blague sur les chats, un passage motivant..."
            disabled={searching || loading}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-purple-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchPrompt.trim() || loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Chercher</span>
          </button>
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-pink-500/20 p-2.5">
              <Search className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Résultats</h2>
              <p className="text-sm text-white/50">
                {searchResults.length} clip{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''} pour &quot;{searchPrompt}&quot;
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {searchResults.map((suggestion, i) => {
              const globalIndex = suggestions.length + i
              const isCreated = createdIndices.has(globalIndex)

              return (
                <div
                  key={`search-${i}`}
                  className={cn(
                    'group rounded-xl border bg-white/5 p-6 transition-all duration-200',
                    isCreated
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-pink-500/20 hover:border-pink-500/40 hover:bg-white/[0.07]'
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-semibold text-pink-300">
                      Recherche
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-white">
                    {suggestion.title}
                  </h3>

                  {suggestion.description && (
                    <p className="mb-3 text-sm leading-relaxed text-white/60">
                      {suggestion.description}
                    </p>
                  )}

                  {suggestion.hashtags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {suggestion.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-pink-500/20 px-3 py-1 text-xs font-medium text-pink-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-sm text-white/40">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(suggestion.start)} → {formatTime(suggestion.end)}
                      </span>
                      {suggestion.score > 0 && (
                        <span className="flex items-center gap-1 font-bold text-pink-400">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {suggestion.score.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {isCreated ? (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                        <Check className="h-4 w-4" />
                        Créé
                      </span>
                    ) : (
                      <button
                        onClick={() => openCustomizer(suggestion, globalIndex)}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
                      >
                        <Plus className="h-4 w-4" />
                        Créer
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Section Suggestions IA */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-purple-500/20 p-2.5">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Suggestions IA</h2>
          <p className="text-sm text-white/50">
            Les meilleurs moments identifiés pour créer des clips viraux
          </p>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-3 h-5 w-3/4 rounded bg-white/10" />
              <div className="mb-2 h-4 w-full rounded bg-white/5" />
              <div className="mb-4 h-4 w-2/3 rounded bg-white/5" />
              <div className="mb-4 flex gap-2">
                <div className="h-6 w-16 rounded-full bg-white/5" />
                <div className="h-6 w-20 rounded-full bg-white/5" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-white/5" />
                <div className="h-9 w-28 rounded-lg bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grille de suggestions */}
      {!loading && suggestions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion, index) => {
            const isCreated = createdIndices.has(index)

            return (
              <div
                key={index}
                className={cn(
                  'group rounded-xl border bg-white/5 p-6 transition-all duration-200',
                  isCreated
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-white/10 hover:border-purple-500/50 hover:bg-white/[0.07]'
                )}
              >
                <h3 className="mb-2 text-lg font-bold text-white">
                  {suggestion.title}
                </h3>

                {suggestion.description && (
                  <p className="mb-3 text-sm leading-relaxed text-white/60">
                    {suggestion.description}
                  </p>
                )}

                {suggestion.hashtags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {suggestion.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm text-white/40">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(suggestion.start)} → {formatTime(suggestion.end)}
                    </span>
                    {suggestion.score > 0 && (
                      <span className="flex items-center gap-1 font-bold text-purple-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {suggestion.score.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {isCreated ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                      <Check className="h-4 w-4" />
                      Créé
                    </span>
                  ) : (
                    <button
                      onClick={() => openCustomizer(suggestion, index)}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
                    >
                      <Plus className="h-4 w-4" />
                      Créer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && suggestions.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
          <Sparkles className="mb-4 h-12 w-12 text-white/20" />
          <p className="text-lg font-medium text-white/50">
            Aucune suggestion disponible
          </p>
          <p className="mt-1 text-sm text-white/30">
            Vérifiez que la transcription de la vidéo est terminée
          </p>
        </div>
      )}
    </div>
  )
}
