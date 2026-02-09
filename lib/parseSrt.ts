import type { TranscriptionSegment } from '@/types/database'

/**
 * Parse une chaîne SRT en tableau de segments.
 *
 * Format SRT :
 * 1
 * 00:00:01,000 --> 00:00:04,500
 * Texte du sous-titre
 *
 * 2
 * 00:00:05,000 --> 00:00:08,200
 * Autre ligne
 */
export function parseSrt(srt: string): TranscriptionSegment[] {
  const segments: TranscriptionSegment[] = []
  const blocks = srt.trim().split(/\n\n+/)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue

    const timeLine = lines[1]
    const timeMatch = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    )

    if (!timeMatch) continue

    const start =
      parseInt(timeMatch[1]) * 3600 +
      parseInt(timeMatch[2]) * 60 +
      parseInt(timeMatch[3]) +
      parseInt(timeMatch[4]) / 1000

    const end =
      parseInt(timeMatch[5]) * 3600 +
      parseInt(timeMatch[6]) * 60 +
      parseInt(timeMatch[7]) +
      parseInt(timeMatch[8]) / 1000

    const text = lines.slice(2).join(' ').trim()

    if (text) {
      segments.push({ start, end, text })
    }
  }

  return segments
}
