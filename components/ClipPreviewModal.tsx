'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, TrendingUp, Download, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/utils'
import { Modal, Button } from '@/components/ui'
import { useClipDownload } from '@/hooks/useClipDownload'
import type { Clip } from '@/types/database'

interface Props {
  clip: Clip | null
  onClose: () => void
  onPublish?: () => void
}

export function ClipPreviewModal({ clip, onClose, onPublish }: Props) {
  const { t } = useTranslation()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const { downloadingId, downloadClip } = useClipDownload()

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

  if (!clip) return null

  const duration = clip.end_time_seconds - clip.start_time_seconds

  return (
    <Modal open={!!clip} onClose={onClose} showCloseButton className="max-w-lg">
      {/* Video player */}
      {loadingUrl ? (
        <div className="flex aspect-[9/16] w-full items-center justify-center bg-black">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      ) : previewUrl ? (
        <video
          src={previewUrl}
          controls
          autoPlay
          className="aspect-[9/16] w-full bg-black"
        >
          {t('clipPreview.videoNotSupported')}
        </video>
      ) : (
        <div className="flex aspect-[9/16] w-full items-center justify-center bg-black">
          <p className="text-sm text-white/40">{t('clipPreview.cannotLoad')}</p>
        </div>
      )}

      {/* Info */}
      <div className="p-5">
        <h3 className="mb-1 text-lg font-bold text-white">{clip.title}</h3>
        {clip.description && (
          <p className="mb-3 text-sm text-white/60">{clip.description}</p>
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

        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => downloadClip(clip)}
            loading={downloadingId === clip.id}
            icon={Download}
            size="lg"
            className="flex-1"
          >
            {t('common.download')}
          </Button>
          {onPublish && (
            <Button
              variant="secondary"
              onClick={onPublish}
              icon={Share2}
              size="lg"
              className="flex-1"
            >
              {t('common.publish')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
