'use client'

import { useState, useEffect, useCallback } from 'react'
import { Film } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface VideoThumbnailProps {
  storagePath: string
  className?: string
}

export function VideoThumbnail({ storagePath, className }: VideoThumbnailProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadThumbnail = useCallback(async () => {
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
  }, [storagePath])

  useEffect(() => {
    loadThumbnail()
  }, [loadThumbnail])

  if (error || (!loading && !url)) {
    return (
      <div className={cn('flex items-center justify-center bg-purple-500/20', className)}>
        <Film className="h-6 w-6 text-purple-400" />
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
