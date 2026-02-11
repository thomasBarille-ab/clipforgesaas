'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Crop, Plus, Trash2, Loader2, ChevronLeft, AlignCenter, ChevronRight, GripVertical, ChevronDown } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'

export interface CropSegment {
  id: string
  time: number  // secondes depuis le début du clip
  cropX: number // 0=gauche, 0.5=centre, 1=droite
}

export interface CropTimelineConfig {
  enabled: boolean
  segments: CropSegment[]
}

export const DEFAULT_CROP_TIMELINE: CropTimelineConfig = {
  enabled: false,
  segments: [{ id: 'initial', time: 0, cropX: 0.5 }],
}

interface Props {
  config: CropTimelineConfig
  onChange: (config: CropTimelineConfig) => void
  videoUrl: string | null
  startSeconds: number
  clipDuration: number
}

export function CropTimelineEditor({ config, onChange, videoUrl, startSeconds, clipDuration }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoAspect, setVideoAspect] = useState(16 / 9)
  const [selectedId, setSelectedId] = useState<string>('initial')
  const [dragging, setDragging] = useState(false)
  const [open, setOpen] = useState(true)
  const dragStart = useRef({ mouseX: 0, cropX: 0 })

  const sorted = [...config.segments].sort((a, b) => a.time - b.time)
  const selected = sorted.find((s) => s.id === selectedId) ?? sorted[0]

  // Largeur du crop 9:16 en fraction de la largeur vidéo
  const cropWidthFraction = Math.min((9 / 16) / videoAspect, 1)
  // Si la vidéo est déjà en 9:16 ou plus étroit, pas besoin de cadrage
  const canCrop = videoAspect > 9 / 16 + 0.01

  // Charger la vidéo
  useEffect(() => {
    if (!videoUrl || !config.enabled) return
    const video = videoRef.current
    if (!video) return

    setVideoReady(false)

    function onMeta() {
      if (video!.videoWidth && video!.videoHeight) {
        setVideoAspect(video!.videoWidth / video!.videoHeight)
      }
      video!.currentTime = startSeconds + (selected?.time ?? 0)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, config.enabled])

  // Seek quand on change de segment
  useEffect(() => {
    if (!videoReady || !videoRef.current) return
    videoRef.current.currentTime = startSeconds + (selected?.time ?? 0)
  }, [selectedId, videoReady, startSeconds, selected?.time])

  function updateSegment(id: string, updates: Partial<CropSegment>) {
    const newSegments = config.segments.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    )
    onChange({ ...config, segments: newSegments })
  }

  // Drag de la zone de crop sur la preview
  const handleCropMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    dragStart.current = {
      mouseX: e.clientX,
      cropX: selected?.cropX ?? 0.5,
    }
  }, [selected?.cropX])

  useEffect(() => {
    if (!dragging || !selected) return

    function onMouseMove(e: MouseEvent) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = (e.clientX - dragStart.current.mouseX) / rect.width
      // Convert pixel delta to cropX delta: dx / (1 - cropWidthFraction)
      const cropXDelta = dx / (1 - cropWidthFraction)
      const newCropX = Math.max(0, Math.min(1, dragStart.current.cropX + cropXDelta))
      updateSegment(selected.id, { cropX: newCropX })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, selected?.id, cropWidthFraction])

  // Click on preview background to set crop position directly
  const handlePreviewClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !selected || dragging) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = (e.clientX - rect.left) / rect.width
    // Center the crop zone on the click position
    const newCropX = Math.max(0, Math.min(1, (clickX - cropWidthFraction / 2) / (1 - cropWidthFraction)))
    updateSegment(selected.id, { cropX: newCropX })
  }, [selected, cropWidthFraction, dragging])

  function addSegment() {
    const idx = sorted.findIndex((s) => s.id === selectedId)
    const start = selected?.time ?? 0
    const end = idx < sorted.length - 1 ? sorted[idx + 1].time : clipDuration
    const midpoint = Math.round(((start + end) / 2) * 10) / 10

    const newSeg: CropSegment = {
      id: crypto.randomUUID(),
      time: midpoint,
      cropX: 0.5,
    }

    onChange({ ...config, segments: [...config.segments, newSeg] })
    setSelectedId(newSeg.id)
  }

  function removeSegment(id: string) {
    if (config.segments.length <= 1) return
    const newSegments = config.segments.filter((s) => s.id !== id)
    onChange({ ...config, segments: newSegments })
    if (selectedId === id) setSelectedId(newSegments[0].id)
  }

  // Positions visuelles du crop zone dans la preview
  const cropLeft = selected ? selected.cropX * (1 - cropWidthFraction) * 100 : 0
  const cropWidth = cropWidthFraction * 100

  function positionLabel(x: number): string {
    if (x <= 0.2) return 'Gauche'
    if (x >= 0.8) return 'Droite'
    if (x >= 0.4 && x <= 0.6) return 'Centre'
    return `${Math.round(x * 100)}%`
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Header collapsible */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <Crop className="h-4 w-4 text-white/50" />
        <span className="text-sm font-semibold text-white">Cadrage</span>
        {/* Toggle ON/OFF */}
        <span
          onClick={(e) => { e.stopPropagation(); onChange({ ...config, enabled: !config.enabled }) }}
          className={cn(
            'ml-auto mr-2 cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
            config.enabled ? 'bg-purple-500/30 text-purple-200' : 'bg-white/10 text-white/40'
          )}
        >
          {config.enabled ? 'ON' : 'OFF'}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-white/40 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && config.enabled && (
        <div className="space-y-4 px-5 pb-5">
          {!canCrop && (
            <p className="text-xs text-yellow-300/60">
              La vidéo source est déjà en format vertical, le cadrage n&apos;est pas nécessaire.
            </p>
          )}

          {canCrop && (
            <>
              {/* Preview vidéo avec zone de crop */}
              <div
                ref={containerRef}
                onClick={handlePreviewClick}
                className="relative cursor-crosshair overflow-hidden rounded-lg bg-black"
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
                  <>
                    {/* Zone sombre gauche */}
                    <div
                      className="absolute bottom-0 left-0 top-0 bg-black/60"
                      style={{ width: `${cropLeft}%` }}
                    />
                    {/* Zone de crop (claire) avec bordure — draggable */}
                    <div
                      onMouseDown={handleCropMouseDown}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'absolute bottom-0 top-0 z-10 border-x-2 border-purple-400',
                        dragging ? 'cursor-grabbing' : 'cursor-grab hover:border-purple-300'
                      )}
                      style={{ left: `${cropLeft}%`, width: `${cropWidth}%` }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-black/40 p-1.5 backdrop-blur-sm">
                          <GripVertical className="h-4 w-4 rotate-90 text-white/60" />
                        </div>
                      </div>
                    </div>
                    {/* Zone sombre droite */}
                    <div
                      className="absolute bottom-0 right-0 top-0 bg-black/60"
                      style={{ width: `${Math.max(0, 100 - cropLeft - cropWidth)}%` }}
                    />
                  </>
                )}
              </div>

              {/* Timeline visuelle */}
              <div>
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/30">
                  Timeline
                </p>
                <div className="flex h-8 overflow-hidden rounded-lg border border-white/10">
                  {sorted.map((seg, i) => {
                    const start = seg.time
                    const end = i < sorted.length - 1 ? sorted[i + 1].time : clipDuration
                    const widthPct = ((end - start) / clipDuration) * 100
                    const isSelected = seg.id === selectedId

                    // Couleur basée sur la position
                    const hue = seg.cropX * 60 // 0=purple(0°), 1=pink(60°)
                    const bg =
                      seg.cropX <= 0.3
                        ? 'bg-purple-500/40'
                        : seg.cropX >= 0.7
                          ? 'bg-pink-500/40'
                          : 'bg-white/15'

                    return (
                      <button
                        key={seg.id}
                        onClick={() => setSelectedId(seg.id)}
                        className={cn(
                          'relative flex items-center justify-center text-[9px] font-medium transition-all',
                          bg,
                          isSelected
                            ? 'ring-2 ring-inset ring-purple-400 text-white'
                            : 'text-white/50 hover:brightness-125'
                        )}
                        style={{ width: `${widthPct}%` }}
                      >
                        {positionLabel(seg.cropX)}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-white/25">
                  <span>{formatTime(0)}</span>
                  <span>{formatTime(clipDuration)}</span>
                </div>
              </div>

              {/* Contrôles du segment sélectionné */}
              {selected && (
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white/60">
                      {formatTime(selected.time)} →{' '}
                      {formatTime(
                        sorted.findIndex((s) => s.id === selectedId) < sorted.length - 1
                          ? sorted[sorted.findIndex((s) => s.id === selectedId) + 1].time
                          : clipDuration
                      )}
                    </p>
                    {config.segments.length > 1 && selected.time > 0 && (
                      <button
                        onClick={() => removeSegment(selected.id)}
                        className="rounded-md p-1 text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400"
                        title="Supprimer ce segment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Presets */}
                  <div className="flex gap-1.5">
                    {[
                      { label: 'Gauche', icon: ChevronLeft, value: 0 },
                      { label: 'Centre', icon: AlignCenter, value: 0.5 },
                      { label: 'Droite', icon: ChevronRight, value: 1 },
                    ].map(({ label, icon: Icon, value }) => (
                      <button
                        key={label}
                        onClick={() => updateSegment(selected.id, { cropX: value })}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all',
                          Math.abs(selected.cropX - value) < 0.05
                            ? 'bg-purple-500/30 text-purple-200'
                            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Slider fin */}
                  <div>
                    <label className="mb-1 flex items-center justify-between text-[10px] text-white/30">
                      <span>Position horizontale</span>
                      <span>{Math.round(selected.cropX * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(selected.cropX * 100)}
                      onChange={(e) =>
                        updateSegment(selected.id, { cropX: Number(e.target.value) / 100 })
                      }
                      className="w-full accent-purple-500"
                    />
                  </div>

                  {/* Temps de début (sauf premier segment) */}
                  {selected.time > 0 && (
                    <div>
                      <label className="mb-1 block text-[10px] text-white/30">
                        Début du segment (secondes)
                      </label>
                      <input
                        type="number"
                        min={0.1}
                        max={clipDuration - 0.1}
                        step={0.1}
                        value={selected.time}
                        onChange={(e) => {
                          const t = Math.max(0.1, Math.min(clipDuration - 0.1, Number(e.target.value)))
                          updateSegment(selected.id, { time: t })
                        }}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Ajouter un segment */}
              <button
                onClick={addSegment}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-2 text-xs font-medium text-white/40 transition-colors hover:border-purple-500/30 hover:bg-white/5 hover:text-white/60"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter un point de coupe
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
