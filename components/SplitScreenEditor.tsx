'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { SplitSquareVertical, Move, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export interface SplitScreenConfig {
  enabled: boolean
  cropX: number   // 0-1, left edge as fraction of video width
  cropY: number   // 0-1, top edge as fraction of video height
  cropSize: number // 0-1, crop square side as fraction of video width
}

export const DEFAULT_SPLIT_SCREEN: SplitScreenConfig = {
  enabled: false,
  cropX: 0.25,
  cropY: 0.1,
  cropSize: 0.5,
}

interface Props {
  config: SplitScreenConfig
  onChange: (config: SplitScreenConfig) => void
  videoUrl: string | null
  startSeconds: number
}

export function SplitScreenEditor({ config, onChange, videoUrl, startSeconds }: Props) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoAspect, setVideoAspect] = useState(16 / 9)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, cropX: 0, cropY: 0 })

  // Charger la frame vidéo
  useEffect(() => {
    if (!videoUrl || !config.enabled) return
    const video = videoRef.current
    if (!video) return

    setVideoReady(false)

    function onMeta() {
      if (video!.videoWidth && video!.videoHeight) {
        setVideoAspect(video!.videoWidth / video!.videoHeight)
      }
      video!.currentTime = startSeconds
    }

    function onSeeked() {
      setVideoReady(true)
    }

    video.addEventListener('loadedmetadata', onMeta)
    video.addEventListener('seeked', onSeeked)
    video.src = videoUrl

    return () => {
      video.removeEventListener('loadedmetadata', onMeta)
      video.removeEventListener('seeked', onSeeked)
    }
  }, [videoUrl, startSeconds, config.enabled])

  // Max crop size : le carré doit tenir dans la hauteur vidéo
  const maxCropSize = Math.min(0.8, 1 / videoAspect)

  // Hauteur du crop en fraction de la hauteur du conteneur
  const cropHeightFraction = Math.min(config.cropSize * videoAspect, 1)

  // Drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      cropX: config.cropX,
      cropY: config.cropY,
    }
  }, [config.cropX, config.cropY])

  useEffect(() => {
    if (!dragging) return

    function onMouseMove(e: MouseEvent) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = (e.clientX - dragStart.current.mouseX) / rect.width
      const dy = (e.clientY - dragStart.current.mouseY) / rect.height
      const maxY = Math.max(0, 1 - cropHeightFraction)
      const newX = Math.max(0, Math.min(1 - config.cropSize, dragStart.current.cropX + dx))
      const newY = Math.max(0, Math.min(maxY, dragStart.current.cropY + dy))
      onChange({ ...config, cropX: newX, cropY: newY })
    }

    function onMouseUp() {
      setDragging(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragging, config, onChange, cropHeightFraction])

  function handleSizeChange(newSize: number) {
    const clamped = Math.min(newSize, maxCropSize)
    const newHeightFraction = Math.min(clamped * videoAspect, 1)
    const newX = Math.max(0, Math.min(config.cropX, 1 - clamped))
    const newY = Math.max(0, Math.min(config.cropY, 1 - newHeightFraction))
    onChange({ ...config, cropSize: clamped, cropX: newX, cropY: newY })
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      {/* Toggle */}
      <button
        onClick={() => onChange({ ...config, enabled: !config.enabled })}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all',
          config.enabled
            ? 'bg-purple-500/20 text-purple-300'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
        )}
      >
        <SplitSquareVertical className="h-4 w-4" />
        {t('splitScreen.title')}
        <span
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold',
            config.enabled ? 'bg-purple-500/30 text-purple-200' : 'bg-white/10 text-white/40'
          )}
        >
          {config.enabled ? t('splitScreen.on') : t('splitScreen.off')}
        </span>
      </button>

      {/* Éditeur de crop */}
      {config.enabled && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-white/40">
            {t('splitScreen.hint')}
          </p>

          {/* Vidéo + overlay */}
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg bg-black"
            style={{ aspectRatio: videoAspect }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              preload="metadata"
              className={cn('h-full w-full object-cover', !videoReady && 'opacity-0')}
            />

            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/30" />
              </div>
            )}

            {videoReady && (
              <div
                onMouseDown={handleMouseDown}
                className={cn(
                  'absolute z-10 border-2 border-purple-400',
                  dragging ? 'cursor-grabbing' : 'cursor-grab hover:border-purple-300'
                )}
                style={{
                  left: `${config.cropX * 100}%`,
                  top: `${config.cropY * 100}%`,
                  width: `${config.cropSize * 100}%`,
                  height: `${cropHeightFraction * 100}%`,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Move className="h-5 w-5 text-white/50" />
                </div>
                <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-sm bg-purple-400" />
                <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-sm bg-purple-400" />
                <div className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-sm bg-purple-400" />
                <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-sm bg-purple-400" />
              </div>
            )}
          </div>

          {/* Slider taille */}
          <div>
            <label className="mb-1 flex items-center justify-between text-xs text-white/40">
              <span>{t('splitScreen.zoomSize')}</span>
              <span>{Math.round(config.cropSize * 100)}%</span>
            </label>
            <input
              type="range"
              min={15}
              max={Math.round(maxCropSize * 100)}
              value={Math.round(config.cropSize * 100)}
              onChange={(e) => handleSizeChange(Number(e.target.value) / 100)}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Description visuelle */}
          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] p-3">
            <div className="flex h-10 w-7 flex-col overflow-hidden rounded border border-white/20">
              <div className="flex-1 bg-white/10" />
              <div className="h-px bg-white/20" />
              <div className="flex-1 bg-purple-500/30" />
            </div>
            <div className="text-[10px] leading-relaxed text-white/40">
              <p>{t('splitScreen.topOriginal')}</p>
              <p>{t('splitScreen.bottomZoom')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
