'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Copy, Download, Check, ExternalLink, Smartphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Modal, Button, AlertBanner, useToast } from '@/components/ui'
import { PlatformIcon } from '@/components/PlatformIcon'
import { useClipDownload } from '@/hooks/useClipDownload'
import type { ClipWithVideo } from '@/types/database'

interface Props {
  clip: ClipWithVideo | null
  onClose: () => void
}

interface Platform {
  id: 'tiktok' | 'youtube' | 'instagram' | 'x'
  label: string
  url?: string | null
  hint?: string
  urlBuilder?: (text: string) => string
}

const PLATFORMS: Platform[] = [
  {
    id: 'tiktok',
    label: 'TikTok',
    url: 'https://www.tiktok.com/upload',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    url: 'https://www.youtube.com/upload',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    url: null,
    hint: 'publishModal.useApp',
  },
  {
    id: 'x',
    label: 'X',
    urlBuilder: (text: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  },
]

export function PublishModal({ clip, onClose }: Props) {
  const { t } = useTranslation()
  const [caption, setCaption] = useState('')
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { downloadingId, downloadClip } = useClipDownload()
  const toast = useToast()

  const canShare = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return !!navigator.share && !!navigator.canShare
  }, [])

  useEffect(() => {
    if (clip) {
      const parts = [clip.title]
      if (clip.description) parts.push(clip.description)
      if (clip.hashtags.length > 0) {
        parts.push(clip.hashtags.map((h) => `#${h}`).join(' '))
      }
      setCaption(parts.join('\n\n'))
      setCopied(false)
      setError(null)
    }
  }, [clip])

  async function handleShare() {
    if (!clip?.storage_path) return
    setSharing(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('videos')
        .createSignedUrl(clip.storage_path, 300)

      if (!data?.signedUrl) {
        setError(t('publishModal.clipNotFound'))
        return
      }

      const response = await fetch(data.signedUrl)
      const blob = await response.blob()
      const file = new File([blob], `${clip.title}.mp4`, { type: 'video/mp4' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: clip.title,
          text: caption,
        })
      } else {
        setError(t('publishModal.shareNotSupported'))
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : t('publishModal.shareError')
      toast.error(msg)
      setError(t('publishModal.shareError'))
    } finally {
      setSharing(false)
    }
  }

  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      toast.success(t('common.copiedToClipboard'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('common.cannotCopy'))
      setError(t('common.cannotCopy'))
    }
  }

  if (!clip) return null

  return (
    <Modal open={!!clip} onClose={onClose} showCloseButton className="max-w-md">
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-2">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('publishModal.title')}</h3>
            <p className="text-sm text-white/40">{clip.title}</p>
          </div>
        </div>

        {error && <AlertBanner message={error} className="mb-4" />}

        {/* Caption editable */}
        <label className="mb-2 block text-sm font-medium text-white/70">
          {t('publishModal.caption')}
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          className="mb-4 w-full resize-none rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none transition-colors"
        />

        {/* Actions */}
        <div className="mb-5 flex gap-2">
          {canShare ? (
            <Button
              onClick={handleShare}
              loading={sharing}
              icon={Smartphone}
              className="flex-1"
            >
              {t('publishModal.share')}
            </Button>
          ) : null}

          <Button
            variant="secondary"
            onClick={handleCopyCaption}
            icon={copied ? Check : Copy}
            className="flex-1"
          >
            {copied ? t('publishModal.copied') : t('publishModal.copyCaption')}
          </Button>

          <Button
            variant="secondary"
            onClick={() => downloadClip(clip)}
            loading={downloadingId === clip.id}
            icon={Download}
            className="flex-1"
          >
            {t('common.download')}
          </Button>
        </div>

        {/* Platform links */}
        <div className="border-t border-white/10 pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
            {t('publishModal.publishOn')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PLATFORMS.map((platform) => {
              const url = platform.urlBuilder
                ? platform.urlBuilder(caption)
                : platform.url

              if (!url) {
                return (
                  <div
                    key={platform.id}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white/30"
                    title={platform.hint ? t(platform.hint) : undefined}
                  >
                    <PlatformIcon platform={platform.id} className="h-6 w-6" />
                    <span className="text-[10px]">{platform.label}</span>
                    <span className="text-[8px] text-white/20">{t('publishModal.mobileApp')}</span>
                  </div>
                )
              }

              return (
                <a
                  key={platform.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white/50 transition-all hover:border-purple-500/50 hover:bg-white/10 hover:text-white"
                >
                  <PlatformIcon platform={platform.id} className="h-6 w-6" />
                  <span className="text-[10px]">{platform.label}</span>
                  <ExternalLink className="h-2.5 w-2.5 text-white/20" />
                </a>
              )
            })}
          </div>
        </div>

        {!canShare && (
          <p className="mt-4 text-center text-xs text-white/30">
            {t('publishModal.mobileHint')}
          </p>
        )}
      </div>
    </Modal>
  )
}
