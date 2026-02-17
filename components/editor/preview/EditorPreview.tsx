'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useEditor } from '../EditorProvider'
import { CropOverlay } from './CropOverlay'
import { PreviewControls } from './PreviewControls'
import { cn } from '@/lib/utils'

interface EditorPreviewProps {
  videoUrl: string
}

export function EditorPreview({ videoUrl }: EditorPreviewProps) {
  const { state, dispatch, totalDuration, segmentOffsets } = useEditor()
  const { segments, playing } = state

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number>(0)
  const seekingRef = useRef(false)
  // Index du segment actif pendant la lecture (résout l'ambiguïté de plages source superposées)
  const activeSegmentIndexRef = useRef(0)

  const [mode, setMode] = useState<'crop' | 'preview'>('crop')

  // Refs miroir pour accès stable dans RAF (pas de stale closures)
  const segmentsRef = useRef(segments)
  const segmentOffsetsRef = useRef(segmentOffsets)
  const totalDurationRef = useRef(totalDuration)
  segmentsRef.current = segments
  segmentOffsetsRef.current = segmentOffsets
  totalDurationRef.current = totalDuration

  // Helper pur : convertit un temps timeline en position source (pas de dépendance state)
  const timelineToSourcePosition = useCallback(
    (time: number) => {
      for (let i = 0; i < segmentsRef.current.length; i++) {
        const off = segmentOffsetsRef.current[i]
        if (!off) continue
        if (time >= off.timelineStart && time <= off.timelineEnd) {
          const relativeTime = time - off.timelineStart
          return { segmentIndex: i, sourceTime: segmentsRef.current[i].sourceStart + relativeTime }
        }
      }
      if (segmentsRef.current.length > 0) {
        const lastSeg = segmentsRef.current[segmentsRef.current.length - 1]
        return { segmentIndex: segmentsRef.current.length - 1, sourceTime: lastSeg.sourceEnd }
      }
      return null
    },
    [] // pas de dépendances — utilise les refs
  )

  // Synchroniser la vidéo quand le playhead change (hors lecture)
  useEffect(() => {
    if (playing || seekingRef.current) return
    const video = videoRef.current
    if (!video) return

    const pos = timelineToSourcePosition(state.playheadTime)
    if (!pos) return

    if (Math.abs(video.currentTime - pos.sourceTime) > 0.1) {
      seekingRef.current = true
      activeSegmentIndexRef.current = pos.segmentIndex

      const handleSeeked = () => {
        seekingRef.current = false
        video.removeEventListener('seeked', handleSeeked)
      }
      video.addEventListener('seeked', handleSeeked)
      video.currentTime = pos.sourceTime
    }
  }, [state.playheadTime, playing, timelineToSourcePosition])

  // Boucle de lecture — PAS de playheadTime dans les dépendances
  useEffect(() => {
    const video = videoRef.current

    if (!playing) {
      cancelAnimationFrame(rafRef.current)
      if (video && !video.paused) video.pause()
      return
    }

    if (!video) return

    // Démarrer la lecture depuis la position courante du playhead
    const pos = timelineToSourcePosition(state.playheadTime)
    if (pos) {
      activeSegmentIndexRef.current = pos.segmentIndex
      if (Math.abs(video.currentTime - pos.sourceTime) > 0.2) {
        video.currentTime = pos.sourceTime
      }
      video.play().catch(() => {
        dispatch({ type: 'SET_PLAYING', playing: false })
      })
    }

    const tick = () => {
      if (!video || video.paused) return

      const currentTime = video.currentTime
      const segs = segmentsRef.current
      const offs = segmentOffsetsRef.current
      const td = totalDurationRef.current
      const activeIdx = activeSegmentIndexRef.current

      // Utiliser l'index segment actif (pas de recherche ambiguë par source time)
      if (activeIdx >= 0 && activeIdx < segs.length) {
        const seg = segs[activeIdx]
        const off = offs[activeIdx]

        if (off) {
          const relTime = Math.max(0, currentTime - seg.sourceStart)
          const newPlayheadTime = Math.min(off.timelineEnd, off.timelineStart + relTime)

          // Fin du segment ?
          if (currentTime >= seg.sourceEnd - 0.05) {
            const nextIdx = activeIdx + 1
            if (nextIdx < segs.length) {
              // Passer au segment suivant
              activeSegmentIndexRef.current = nextIdx
              video.currentTime = segs[nextIdx].sourceStart
            } else {
              // Fin de la timeline
              video.pause()
              dispatch({ type: 'SET_PLAYING', playing: false })
              dispatch({ type: 'SET_PLAYHEAD', time: td })
              return
            }
          }

          dispatch({ type: 'SET_PLAYHEAD', time: newPlayheadTime })
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
    // Volontairement PAS playheadTime dans les deps — sinon le RAF se recrée chaque frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, dispatch, timelineToSourcePosition])

  // Calculer le cropX du segment sous le playhead (suit la lecture)
  const playheadCropX = (() => {
    for (let i = 0; i < segments.length; i++) {
      const off = segmentOffsets[i]
      if (!off) continue
      if (state.playheadTime >= off.timelineStart && state.playheadTime <= off.timelineEnd) {
        return segments[i].cropX
      }
    }
    return segments[0]?.cropX ?? 0.5
  })()

  return (
    <div className="flex h-full flex-col items-center gap-2">
      {/* Mode toggle */}
      <div className="flex-shrink-0 flex rounded-lg bg-white/5 p-0.5">
        <button
          onClick={() => setMode('crop')}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-all',
            mode === 'crop' ? 'bg-purple-500/30 text-purple-200' : 'text-white/40 hover:text-white/60'
          )}
        >
          Cadrage
        </button>
        <button
          onClick={() => setMode('preview')}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-all',
            mode === 'preview' ? 'bg-purple-500/30 text-purple-200' : 'text-white/40 hover:text-white/60'
          )}
        >
          Aperçu
        </button>
      </div>

      {/* Video container — UN SEUL élément video persistant entre les modes */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        {/* Wrapper qui change de style selon le mode */}
        <div
          className={cn(
            'relative',
            mode === 'crop'
              ? 'w-full max-h-full aspect-video'
              : 'overflow-hidden rounded-lg'
          )}
          style={mode === 'preview' ? { aspectRatio: '9/16', maxHeight: '100%', height: '100%' } : undefined}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className={cn(
              'h-full w-full rounded-lg',
              mode === 'crop' ? 'object-contain' : 'object-cover'
            )}
            style={mode === 'preview' ? { objectPosition: `${playheadCropX * 100}% center` } : undefined}
            playsInline
            preload="auto"
          />
          {mode === 'crop' && <CropOverlay videoRef={videoRef} />}
        </div>
      </div>

      <PreviewControls />
    </div>
  )
}
