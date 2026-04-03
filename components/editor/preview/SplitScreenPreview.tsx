'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { SplitScreenConfig } from '../types'

interface SplitScreenPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  cropX: number
  splitScreen: SplitScreenConfig
  containerDims: { width: number; height: number }
}

export function SplitScreenPreview({ videoRef, cropX, splitScreen, containerDims }: SplitScreenPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const lastDrawRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video || !video.videoWidth) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const vw = video.videoWidth
    const vh = video.videoHeight

    // Canvas is 1080x1920 internally
    const cw = 1080
    const ch = 1920
    const halfH = ch / 2 // 960

    // Top half: normal 9:16 crop
    const topCropW = vh * (9 / 16)
    const topCropH = vh
    const topMaxX = vw - topCropW
    const topSrcX = cropX * topMaxX

    ctx.drawImage(video, topSrcX, 0, topCropW, topCropH, 0, 0, cw, halfH)

    // Bottom half: zoomed crop
    const zoomCropW = vw * splitScreen.cropSize
    const zoomCropH = zoomCropW * (16 / 9)
    const maxZoomX = vw - zoomCropW
    const maxZoomY = vh - zoomCropH
    const zoomSrcX = splitScreen.cropX * Math.max(0, maxZoomX)
    const zoomSrcY = splitScreen.cropY * Math.max(0, maxZoomY)

    ctx.drawImage(video, zoomSrcX, zoomSrcY, zoomCropW, zoomCropH, 0, halfH, cw, halfH)

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, halfH)
    ctx.lineTo(cw, halfH)
    ctx.stroke()
  }, [videoRef, cropX, splitScreen])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let running = true

    const tick = () => {
      if (!running) return

      // Throttle to ~30fps
      const now = performance.now()
      if (now - lastDrawRef.current >= 33) {
        draw()
        lastDrawRef.current = now
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [videoRef, draw])

  // Also draw on config changes (when paused)
  useEffect(() => {
    draw()
  }, [draw, cropX, splitScreen.cropX, splitScreen.cropY, splitScreen.cropSize])

  return (
    <canvas
      ref={canvasRef}
      width={1080}
      height={1920}
      className="absolute inset-0 h-full w-full rounded-lg"
      style={{ objectFit: 'contain' }}
    />
  )
}
