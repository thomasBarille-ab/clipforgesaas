'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Sparkles,
  Clock,
  Loader2,
  Film,
  Search,
  MessageSquare,
  Send,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTime, formatFileSize } from '@/lib/utils'
import { AlertBanner, Button, Input } from '@/components/ui'
import { SuggestionCard } from '@/components/SuggestionCard'
import { VideoEditor } from '@/components/editor/VideoEditor'
import type { Video, TranscriptionSegment, ClipSuggestion } from '@/types/database'

export default function CreateClipsPage() {
  const params = useParams<{ videoId: string }>()
  const videoId = params.videoId

  const [video, setVideo] = useState<Video | null>(null)
  const [suggestions, setSuggestions] = useState<ClipSuggestion[]>([])
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [videoSignedUrl, setVideoSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createdIndices, setCreatedIndices] = useState<Set<number>>(new Set())

  // Recherche par prompt
  const [searchPrompt, setSearchPrompt] = useState('')
  const [searchResults, setSearchResults] = useState<ClipSuggestion[]>([])
  const [searching, setSearching] = useState(false)

  // Personnalisation
  const [customizing, setCustomizing] = useState<{
    suggestion: ClipSuggestion
    index: number
  } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

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

  function openCustomizer(suggestion: ClipSuggestion, index: number) {
    setCustomizing({ suggestion, index })
    setError(null)
  }

  function closeCustomizer() {
    setCustomizing(null)
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

  // ──────────────────────────────────────────────
  // VUE : Éditeur vidéo plein écran
  // ──────────────────────────────────────────────
  if (customizing && videoSignedUrl) {
    const { suggestion, index } = customizing

    return (
      <VideoEditor
        videoUrl={videoSignedUrl}
        suggestion={suggestion}
        segments={segments}
        videoId={videoId}
        onClose={closeCustomizer}
        onGenerated={() => {
          setCreatedIndices((prev) => new Set(prev).add(index))
        }}
      />
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

      {error && <AlertBanner message={error} className="mb-6" />}

      {/* Recherche par prompt */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
          <MessageSquare className="h-4 w-4 text-pink-400" />
          Décrivez le clip que vous voulez
        </div>
        <div className="flex gap-2">
          <Input
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ex: le moment où il parle de marketing, la blague sur les chats, un passage motivant..."
            disabled={searching || loading}
            className="flex-1 rounded-xl px-4 py-3 text-sm border-white/10"
          />
          <Button
            onClick={handleSearch}
            disabled={!searchPrompt.trim() || loading}
            loading={searching}
            icon={Send}
            size="md"
            className="rounded-xl bg-gradient-to-r from-pink-600 to-purple-600"
          >
            <span className="hidden sm:inline">Chercher</span>
          </Button>
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
              return (
                <SuggestionCard
                  key={`search-${i}`}
                  suggestion={suggestion}
                  isCreated={createdIndices.has(globalIndex)}
                  onSelect={() => openCustomizer(suggestion, globalIndex)}
                  variant="search"
                />
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
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={index}
              suggestion={suggestion}
              isCreated={createdIndices.has(index)}
              onSelect={() => openCustomizer(suggestion, index)}
            />
          ))}
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
