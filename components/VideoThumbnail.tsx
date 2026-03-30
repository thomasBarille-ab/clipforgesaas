'use client'

import { useState, useEffect, useCallback } from 'react'
import { Film } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface VideoThumbnailProps {
  storagePath: string
  /** Pre-fetched signed URL (from useBatchSignedUrls). Skips individual fetch when provided. */
  signedUrl?: string
  className?: string
}

export function VideoThumbnail({ storagePath, signedUrl: preSignedUrl, className }: VideoThumbnailProps) {
  const [url, setUrl] = useState<string | null>(preSignedUrl ?? null)
  const [loading, setLoading] = useState(!preSignedUrl)
  const [error, setError] = useState(false)

  // Sync when preSignedUrl arrives asynchronously
  useEffect(() => {
    if (preSignedUrl) {
      setUrl(preSignedUrl)
      setLoading(false)
      setError(false)
    }
  }, [preSignedUrl])

  const loadThumbnail = useCallback(async () => {
    if (preSignedUrl) return // Skip if pre-fetched
    try {
      const supabase = createClient()
      const { data, error: urlError } = await supabase.storage
        .from('videos')
        .createSignedUrl(storagePath, 600)

      if (urlError || !data?.signedUrl) {
        setError(true)
        setLoading(false)
        return
      }

      setUrl(data.signedUrl)
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [storagePath, preSignedUrl])

  useEffect(() => {
    if (!preSignedUrl) {
      loadThumbnail()
    }
  }, [loadThumbnail, preSignedUrl])

  if (error || (!loading && !url)) {
    return (
      <div className={cn('flex items-center justify-center bg-orange-500/20', className)}>
        <Film className="h-6 w-6 text-orange-400" />
      </div>
    )
  }

  if (loading) {
    return <div className={cn('animate-pulse bg-white/10', className)} />
  }

  return (
    <img
      src={url!}
      alt=""
      className={cn('object-cover', className)}
      onError={() => setError(true)}
    />
  )
}
