'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Batch-fetch signed URLs for multiple storage paths in a single call.
 * Returns a map of storagePath → signedUrl.
 */
export function useBatchSignedUrls(paths: string[], expiresIn = 600): Record<string, string> {
  const [urlMap, setUrlMap] = useState<Record<string, string>>({})

  // Stabilize the dependency by serializing paths
  const pathsKey = paths.join('|')

  useEffect(() => {
    if (paths.length === 0) return

    const supabase = createClient()
    supabase.storage
      .from('videos')
      .createSignedUrls(paths, expiresIn)
      .then(({ data, error }) => {
        if (error || !data) return
        const map: Record<string, string> = {}
        for (const item of data) {
          if (item.signedUrl && item.path) {
            map[item.path] = item.signedUrl
          }
        }
        setUrlMap(map)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathsKey, expiresIn])

  return urlMap
}
