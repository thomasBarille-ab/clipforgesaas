'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Clock, TrendingUp, Download, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/utils'
import type { Clip } from '@/types/database'

interface ClipPreviewModalProps {
  clip: Clip | null
  onClose: () => void
}

export function ClipPreviewModal({ clip, onClose }: ClipPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const loadPreviewUrl = useCallback(async (storagePath: string) => {
    setLoadingUrl(true)
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('videos')
      .createSignedUrl(storagePath, 300)

    if (!error && data?.signedUrl) {
      setPreviewUrl(data.signedUrl)
    }
    setLoadingUrl(false)
  }, [])

  useEffect(() => {
    if (clip?.storage_path) {
      loadPreviewUrl(clip.storage_path)
    } else {
      setPreviewUrl(null)
    }

    return () => setPreviewUrl(null)
  }, [clip, loadPreviewUrl])

  async function handleDownload() {
    if (!clip?.storage_path || downloading) return
    setDownloading(true)

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
      setDownloading(false)
    }
  }

  if (!clip) return null

  const duration = clip.end_time_seconds - clip.start_time_seconds

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white/70 transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Video player */}
        {loadingUrl ? (
          <div className="flex aspect-[9/16] w-full items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-white/40" />
          </div>
        ) : previewUrl ? (
          <video
            src={previewUrl}
            controls
            autoPlay
            className="aspect-[9/16] w-full bg-black"
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        ) : (
          <div className="flex aspect-[9/16] w-full items-center justify-center bg-black">
            <p className="text-sm text-white/40">Impossible de charger la vidéo</p>
          </div>
        )}

        {/* Info */}
        <div className="p-5">
          <h3 className="mb-1 text-lg font-bold text-white">
            {clip.title}
          </h3>
          {clip.description && (
            <p className="mb-3 text-sm text-white/60">
              {clip.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(duration)}
            </span>
            {clip.virality_score && (
              <span className="flex items-center gap-1 font-bold text-purple-400">
                <TrendingUp className="h-3.5 w-3.5" />
                {clip.virality_score.toFixed(1)}/10
              </span>
            )}
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
          >
            {downloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            Télécharger ce clip
          </button>
        </div>
      </div>
    </div>
  )
}
