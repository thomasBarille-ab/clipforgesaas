import type { TranscriptionSegment } from '@/types/database'
import type { TimelineSegment, SegmentOffset } from '@/components/editor/types'

function pad(n: number, length: number = 2): string {
  return n.toString().padStart(length, '0')
}

function formatSrtTime(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const hours = Math.floor(clamped / 3600)
  const minutes = Math.floor((clamped % 3600) / 60)
  const secs = Math.floor(clamped % 60)
  const ms = Math.floor((clamped % 1) * 1000)

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`
}

/**
 * Filtre les segments qui chevauchent la plage [clipStart, clipEnd]
 * et ajuste les timestamps pour que le clip commence à 0.
 */
export function filterSegmentsForClip(
  segments: TranscriptionSegment[],
  clipStart: number,
  clipEnd: number
): TranscriptionSegment[] {
  return segments
    .filter((seg) => seg.end > clipStart && seg.start < clipEnd)
    .map((seg) => ({
      start: Math.max(0, seg.start - clipStart),
      end: Math.min(clipEnd - clipStart, seg.end - clipStart),
      text: seg.text,
    }))
}

/**
 * Génère une chaîne SRT à partir de segments.
 * Les timestamps sont relatifs au début du clip (offset appliqué).
 */
export function generateSrt(
  segments: TranscriptionSegment[],
  clipStart: number,
  clipEnd: number
): string {
  const clipped = filterSegmentsForClip(segments, clipStart, clipEnd)
  let srt = ''
  let index = 1

  for (const seg of clipped) {
    const start = formatSrtTime(seg.start)
    const end = formatSrtTime(seg.end)

    srt += `${index}\n${start} --> ${end}\n${seg.text}\n\n`
    index++
  }

  return srt
}

/**
 * Génère un SRT multi-segments avec timestamps ajustés pour la timeline concaténée.
 * Pour chaque segment de timeline, on filtre les mots de transcription correspondants
 * et on ajuste les timestamps pour qu'ils soient relatifs à la position du segment
 * sur la timeline finale.
 */
export function generateSrtForSegments(
  allSegments: TranscriptionSegment[],
  timelineSegments: TimelineSegment[],
  segmentOffsets: SegmentOffset[]
): string {
  let srt = ''
  let index = 1

  for (let i = 0; i < timelineSegments.length; i++) {
    const tSeg = timelineSegments[i]
    const offset = segmentOffsets[i]
    if (!offset) continue

    // Filtrer les segments de transcription qui chevauchent ce segment de timeline
    const clipped = allSegments
      .filter((seg) => seg.end > tSeg.sourceStart && seg.start < tSeg.sourceEnd)
      .map((seg) => {
        // Rebaser : temps source → temps timeline
        const relStart = Math.max(0, seg.start - tSeg.sourceStart)
        const relEnd = Math.min(tSeg.sourceEnd - tSeg.sourceStart, seg.end - tSeg.sourceStart)
        return {
          start: offset.timelineStart + relStart,
          end: offset.timelineStart + relEnd,
          text: seg.text,
        }
      })

    for (const seg of clipped) {
      const start = formatSrtTime(seg.start)
      const end = formatSrtTime(seg.end)
      srt += `${index}\n${start} --> ${end}\n${seg.text}\n\n`
      index++
    }
  }

  return srt
}
