'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ThumbnailRequest {
  time: number
  key: string // arrondi à 0.5s pour déduplication
}

/**
 * Extrait des thumbnails d'une vidéo à intervalles réguliers via Canvas API.
 * Utilise un élément video caché séparé de la preview.
 */
export function useVideoThumbnails(
  videoUrl: string | null,
  times: number[],
  height: number = 48
) {
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map())
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const queueRef = useRef<ThumbnailRequest[]>([])
  const processingRef = useRef(false)
  const cacheRef = useRef<Map<string, string>>(new Map())
  const videoReadyRef = useRef(false)
  // Flag : relancer processQueue après la fin du batch en cours
  const pendingReprocessRef = useRef(false)

  const processQueue = useCallback(async () => {
    if (processingRef.current) {
      // Marquer qu'on devra relancer après le batch en cours
      pendingReprocessRef.current = true
      return
    }
    if (!videoRef.current || !videoReadyRef.current) return

    processingRef.current = true

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      processingRef.current = false
      return
    }

    while (queueRef.current.length > 0) {
      const request = queueRef.current.shift()!

      if (cacheRef.current.has(request.key)) continue

      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => resolve(), 3000)
          const handleSeeked = () => {
            clearTimeout(timeout)
            video.removeEventListener('seeked', handleSeeked)
            video.removeEventListener('error', handleError)
            resolve()
          }
          const handleError = () => {
            clearTimeout(timeout)
            video.removeEventListener('seeked', handleSeeked)
            video.removeEventListener('error', handleError)
            reject(new Error('Video seek error'))
          }
          video.addEventListener('seeked', handleSeeked)
          video.addEventListener('error', handleError)
          video.currentTime = request.time
        })

        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const aspectRatio = video.videoWidth / video.videoHeight
          canvas.height = height
          canvas.width = Math.round(height * aspectRatio)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
          cacheRef.current.set(request.key, dataUrl)
          setThumbnails(new Map(cacheRef.current))
        }
      } catch {
        // Continuer avec les suivantes
      }
    }

    processingRef.current = false

    // Si de nouvelles requêtes sont arrivées pendant le traitement, relancer
    if (pendingReprocessRef.current) {
      pendingReprocessRef.current = false
      processQueue()
    }
  }, [height])

  // Créer la vidéo cachée et attendre qu'elle soit prête
  useEffect(() => {
    if (!videoUrl) return

    videoReadyRef.current = false
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    video.src = videoUrl

    videoRef.current = video

    const handleReady = () => {
      videoReadyRef.current = true
      video.removeEventListener('loadeddata', handleReady)
      // Si des requêtes sont en attente, les traiter maintenant
      if (queueRef.current.length > 0) {
        processQueue()
      }
    }
    video.addEventListener('loadeddata', handleReady)

    return () => {
      video.removeEventListener('loadeddata', handleReady)
      video.src = ''
      videoRef.current = null
      videoReadyRef.current = false
    }
  }, [videoUrl, processQueue])

  // Mettre à jour la queue quand les temps changent
  useEffect(() => {
    if (!videoUrl) return

    const dedupedTimes = new Map<string, number>()
    for (const t of times) {
      const key = (Math.round(t * 2) / 2).toFixed(1) // arrondi 0.5s
      if (!dedupedTimes.has(key) && !cacheRef.current.has(key)) {
        dedupedTimes.set(key, t)
      }
    }

    const requests: ThumbnailRequest[] = []
    for (const [key, time] of dedupedTimes) {
      requests.push({ time, key })
    }

    if (requests.length > 0) {
      // Ajouter à la queue au lieu de remplacer
      queueRef.current.push(...requests)
      processQueue()
    }
  }, [videoUrl, times, processQueue])

  return thumbnails
}
