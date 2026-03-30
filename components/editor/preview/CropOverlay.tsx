'use client'

import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { useEditor } from '../EditorProvider'

interface CropOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export function CropOverlay({ videoRef }: CropOverlayProps) {
  const { state, dispatch, segmentOffsets } = useEditor()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, videoWidth: 0, videoHeight: 0 })
  const dragging = useRef(false)

  // Trouver le segment sous le playhead (suit la lecture)
  const currentSegmentId = (() => {
    for (let i = 0; i < state.segments.length; i++) {
      const off = segmentOffsets[i]
      if (!off) continue
      if (state.playheadTime >= off.timelineStart && state.playheadTime <= off.timelineEnd) {
        return state.segments[i].id
      }
    }
    return state.segments[0]?.id ?? null
  })()
  const currentSegment = state.segments.find((s) => s.id === currentSegmentId) ?? state.segments[0]
  const cropX = currentSegment?.cropX ?? 0.5
  const splitScreen = currentSegment?.splitScreen
  const isSplitScreenEnabled = splitScreen?.enabled ?? false

  // Calculer les dimensions quand la vidéo charge
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const video = videoRef.current
      if (!video || !video.videoWidth) return
      const rect = container.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      })
    }

    const obs = new ResizeObserver(() => updateDimensions())
    obs.observe(container)

    const video = videoRef.current
    video?.addEventListener('loadeddata', updateDimensions)

    return () => {
      obs.disconnect()
      video?.removeEventListener('loadeddata', updateDimensions)
    }
  }, [videoRef])

  const { width, height, videoWidth, videoHeight } = dimensions
  const hasValidDimensions = width > 0 && height > 0 && videoWidth > 0 && videoHeight > 0

  // Calculer toutes les valeurs dérivées (même si pas encore valides)
  const layout = useMemo(() => {
    if (!hasValidDimensions) return null

    const videoAspect = videoWidth / videoHeight
    const containerAspect = width / height
    let displayW: number, displayH: number, offsetX: number, offsetY: number
    if (videoAspect > containerAspect) {
      displayW = width
      displayH = width / videoAspect
      offsetX = 0
      offsetY = (height - displayH) / 2
    } else {
      displayH = height
      displayW = height * videoAspect
      offsetX = (width - displayW) / 2
      offsetY = 0
    }

    const cropWidthFraction = Math.min((9 / 16) / videoAspect, 1)
    const cropBoxW = displayW * cropWidthFraction
    const cropBoxH = displayH
    const maxOffset = displayW - cropBoxW

    return { displayW, displayH, offsetX, offsetY, cropBoxW, cropBoxH, maxOffset }
  }, [hasValidDimensions, width, height, videoWidth, videoHeight])

  // Tous les hooks AVANT tout return conditionnel
  const updateCropX = useCallback(
    (clientX: number) => {
      if (!layout) return
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = clientX - rect.left - layout.offsetX
      const newCropX = Math.max(0, Math.min(1, layout.maxOffset > 0 ? (x - layout.cropBoxW / 2) / layout.maxOffset : 0.5))
      const segId = currentSegmentId ?? state.segments[0]?.id
      if (segId) {
        dispatch({ type: 'UPDATE_SEGMENT', id: segId, updates: { cropX: newCropX } })
      }
    },
    [layout, currentSegmentId, state.segments, dispatch]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragging.current = true
      updateCropX(e.clientX)

      const handleMove = (ev: MouseEvent) => {
        if (!dragging.current) return
        updateCropX(ev.clientX)
      }

      const handleUp = () => {
        dragging.current = false
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    },
    [updateCropX]
  )

  const draggingZoom = useRef(false)

  const handleZoomMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      draggingZoom.current = true

      const startX = e.clientX
      const startY = e.clientY
      const startCropX = splitScreen?.cropX ?? 0.5
      const startCropY = splitScreen?.cropY ?? 0.3

      const handleMove = (ev: MouseEvent) => {
        if (!draggingZoom.current || !layout) return
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        const newCropX = Math.max(0, Math.min(1, startCropX + dx / layout.cropBoxW))
        const newCropY = Math.max(0, Math.min(1, startCropY + dy / layout.cropBoxH))
        const segId = currentSegmentId ?? state.segments[0]?.id
        if (segId && splitScreen) {
          dispatch({
            type: 'UPDATE_SEGMENT',
            id: segId,
            updates: { splitScreen: { ...splitScreen, cropX: newCropX, cropY: newCropY } },
          })
        }
      }

      const handleUp = () => {
        draggingZoom.current = false
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    },
    [layout, splitScreen, currentSegmentId, state.segments, dispatch]
  )

  // Return conditionnel APRÈS tous les hooks
  if (!layout) {
    return <div ref={containerRef} className="absolute inset-0" />
  }

  const { displayW, displayH, offsetX, offsetY, cropBoxW, cropBoxH, maxOffset } = layout
  const cropBoxX = offsetX + cropX * maxOffset

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
    >
      {/* Zone sombre gauche */}
      <div
        className="absolute bg-black/60"
        style={{
          left: offsetX,
          top: offsetY,
          width: cropBoxX - offsetX,
          height: displayH,
        }}
      />
      {/* Zone sombre droite */}
      <div
        className="absolute bg-black/60"
        style={{
          left: cropBoxX + cropBoxW,
          top: offsetY,
          width: displayW - (cropBoxX - offsetX) - cropBoxW,
          height: displayH,
        }}
      />
      {/* Crop box outline */}
      <div
        className="absolute border-2 border-orange-500 shadow-lg shadow-orange-500/20"
        style={{
          left: cropBoxX,
          top: offsetY,
          width: cropBoxW,
          height: cropBoxH,
        }}
      >
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-orange-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
          9:16
        </div>

        {/* Zoom rectangle for split-screen */}
        {isSplitScreenEnabled && splitScreen && (() => {
          const zoomSize = splitScreen.cropSize
          const zoomW = cropBoxW * zoomSize
          const zoomH = zoomW * (16 / 9)
          const maxZoomX = cropBoxW - zoomW
          const maxZoomY = cropBoxH - zoomH
          const zoomX = splitScreen.cropX * maxZoomX
          const zoomY = splitScreen.cropY * maxZoomY
          return (
            <div
              className="absolute border-2 border-purple-500 bg-purple-500/10 cursor-move shadow-lg shadow-purple-500/20"
              style={{ left: zoomX, top: zoomY, width: zoomW, height: zoomH }}
              onMouseDown={handleZoomMouseDown}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded bg-purple-500/80 px-1.5 py-0.5 text-[8px] font-bold text-white whitespace-nowrap">
                ZOOM
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
