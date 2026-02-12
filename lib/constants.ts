import type { VideoStatus } from '@/types/database'

export const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  uploaded: 'En attente',
  processing: 'Transcription...',
  ready: 'Prête',
  failed: 'Erreur',
}

export const VIDEO_STATUS_COLORS: Record<VideoStatus, string> = {
  uploaded: 'bg-yellow-500/20 text-yellow-300',
  processing: 'bg-blue-500/20 text-blue-300',
  ready: 'bg-emerald-500/20 text-emerald-300',
  failed: 'bg-red-500/20 text-red-300',
}
