import type { TranscriptionSegment, ClipSuggestion } from '@/types/database'

/**
 * Détecte si un segment termine une phrase (ponctuation finale).
 */
function isSentenceEnd(text: string): boolean {
  const trimmed = text.trimEnd()
  return /[.!?…»"]$/.test(trimmed)
}

/**
 * Détecte si un segment commence une nouvelle phrase
 * (commence par une majuscule ou suit un segment qui se termine par une ponctuation).
 */
function isSentenceStart(text: string): boolean {
  const trimmed = text.trimStart()
  return /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/.test(trimmed)
}

/**
 * Trouve les frontières de phrases à partir des segments de transcription.
 * Retourne un tableau d'objets { start, end } représentant des phrases complètes.
 */
export function findSentenceBoundaries(segments: TranscriptionSegment[]): { start: number; end: number }[] {
  if (segments.length === 0) return []

  const sentences: { start: number; end: number }[] = []
  let sentenceStart = segments[0].start

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]

    if (isSentenceEnd(seg.text)) {
      sentences.push({ start: sentenceStart, end: seg.end })

      // Le prochain segment commence une nouvelle phrase
      if (i + 1 < segments.length) {
        sentenceStart = segments[i + 1].start
      }
    }
  }

  // Si le dernier segment ne termine pas par une ponctuation,
  // inclure les segments restants comme dernière phrase
  const lastSentence = sentences[sentences.length - 1]
  const lastSegment = segments[segments.length - 1]
  if (!lastSentence || lastSentence.end < lastSegment.end) {
    sentences.push({ start: sentenceStart, end: lastSegment.end })
  }

  return sentences
}

/**
 * Recale un timestamp de début sur la frontière de phrase la plus proche.
 * Cherche la phrase qui commence juste avant ou au moment du start suggéré.
 * Si le start tombe au milieu d'une phrase, on recule au début de cette phrase.
 */
function snapStart(
  suggestedStart: number,
  sentences: { start: number; end: number }[],
  segments: TranscriptionSegment[],
  maxDrift: number = 3.0
): number {
  // 1. Essayer de trouver la phrase qui contient le start suggéré
  for (const sentence of sentences) {
    if (suggestedStart >= sentence.start && suggestedStart <= sentence.end) {
      // On est au milieu de cette phrase — reculer au début
      if (suggestedStart - sentence.start <= maxDrift) {
        return sentence.start
      }
      // Si trop loin du début, avancer à la phrase suivante
      const nextSentence = sentences.find((s) => s.start > sentence.start)
      if (nextSentence && nextSentence.start - suggestedStart <= maxDrift) {
        return nextSentence.start
      }
      // Fallback : début de la phrase courante
      return sentence.start
    }
  }

  // 2. Fallback : trouver le segment le plus proche
  let closest = segments[0]
  let minDist = Math.abs(segments[0].start - suggestedStart)
  for (const seg of segments) {
    const dist = Math.abs(seg.start - suggestedStart)
    if (dist < minDist) {
      minDist = dist
      closest = seg
    }
  }
  return closest.start
}

/**
 * Recale un timestamp de fin sur la frontière de phrase la plus proche.
 * Si le end tombe au milieu d'une phrase, on avance à la fin de cette phrase.
 */
function snapEnd(
  suggestedEnd: number,
  sentences: { start: number; end: number }[],
  segments: TranscriptionSegment[],
  maxDrift: number = 3.0
): number {
  // 1. Essayer de trouver la phrase qui contient le end suggéré
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i]
    if (suggestedEnd >= sentence.start && suggestedEnd <= sentence.end) {
      // On est au milieu de cette phrase — avancer à la fin
      if (sentence.end - suggestedEnd <= maxDrift) {
        return sentence.end
      }
      // Si trop loin de la fin, reculer à la phrase précédente
      if (i > 0) {
        const prevSentence = sentences[i - 1]
        if (suggestedEnd - prevSentence.end <= maxDrift) {
          return prevSentence.end
        }
      }
      // Fallback : fin de la phrase courante
      return sentence.end
    }
  }

  // 2. Si le end est après la dernière phrase, trouver la fin de phrase la plus proche avant
  for (let i = sentences.length - 1; i >= 0; i--) {
    if (sentences[i].end <= suggestedEnd + maxDrift) {
      return sentences[i].end
    }
  }

  // 3. Fallback : trouver le segment le plus proche
  let closest = segments[segments.length - 1]
  let minDist = Math.abs(closest.end - suggestedEnd)
  for (const seg of segments) {
    const dist = Math.abs(seg.end - suggestedEnd)
    if (dist < minDist) {
      minDist = dist
      closest = seg
    }
  }
  return closest.end
}

/**
 * Petit buffer pour que la coupe soit naturelle (pas de coupure sèche).
 */
const START_BUFFER = 0.15 // secondes avant le début de la phrase
const END_BUFFER = 0.3   // secondes après la fin de la phrase

/**
 * Recale les timestamps d'une suggestion de clip sur les frontières de phrases.
 * Garantit que le clip ne commence ni ne finit au milieu d'une phrase.
 */
export function snapClipToSentences(
  suggestion: ClipSuggestion,
  segments: TranscriptionSegment[]
): ClipSuggestion {
  if (segments.length === 0) return suggestion

  const sentences = findSentenceBoundaries(segments)
  if (sentences.length === 0) return suggestion

  const snappedStart = snapStart(suggestion.start, sentences, segments)
  const snappedEnd = snapEnd(suggestion.end, sentences, segments)

  // Appliquer le buffer (sans aller en négatif)
  const finalStart = Math.max(0, snappedStart - START_BUFFER)
  const finalEnd = snappedEnd + END_BUFFER

  // S'assurer que le clip fait au minimum 30 secondes
  if (finalEnd - finalStart < 30) {
    return suggestion
  }

  return {
    ...suggestion,
    start: Math.round(finalStart * 100) / 100,
    end: Math.round(finalEnd * 100) / 100,
  }
}

/**
 * Recale un tableau de suggestions sur les frontières de phrases.
 */
export function snapAllClipsToSentences(
  suggestions: ClipSuggestion[],
  segments: TranscriptionSegment[]
): ClipSuggestion[] {
  return suggestions.map((s) => snapClipToSentences(s, segments))
}
