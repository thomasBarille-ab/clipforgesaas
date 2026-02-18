'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

interface DownloadableClip {
  id: string
  title: string
  storage_path: string | null
}

export function useClipDownload() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const toast = useToast()

  async function downloadClip(clip: DownloadableClip) {
    if (!clip.storage_path || downloadingId) return
    setDownloadingId(clip.id)

    try {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('videos')
        .createSignedUrl(clip.storage_path, 300)

      if (data?.signedUrl) {
        const res = await fetch(data.signedUrl)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${clip.title}.mp4`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloadingId(null)
    }
  }

  return { downloadingId, downloadClip }
}
