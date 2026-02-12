import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { snapAllClipsToSentences } from '@/lib/clipBoundaries'
import type { TranscriptionSegment, ClipSuggestion } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface SuggestRequestBody {
  videoId?: string
  transcription?: string
  segments?: TranscriptionSegment[]
}

/**
 * Formate les segments en texte lisible avec timestamps pour le prompt Claude.
 * Regroupe par phrases pour que Claude voie les frontières naturelles.
 */
function formatSegmentsForPrompt(segments: TranscriptionSegment[]): string {
  const lines: string[] = []
  let currentSentence = ''
  let sentenceStart = segments[0]?.start ?? 0

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    currentSentence += (currentSentence ? ' ' : '') + seg.text

    const endsWithPunctuation = /[.!?…»"]$/.test(seg.text.trimEnd())
    const isLast = i === segments.length - 1

    if (endsWithPunctuation || isLast) {
      lines.push(`[${sentenceStart.toFixed(1)}s → ${seg.end.toFixed(1)}s] ${currentSentence}`)
      currentSentence = ''
      if (i + 1 < segments.length) {
        sentenceStart = segments[i + 1].start
      }
    }
  }

  return lines.join('\n')
}

function buildPrompt(transcription: string, segments: TranscriptionSegment[]): string {
  const formattedSegments = formatSegmentsForPrompt(segments)

  return `Tu es un expert en création de contenu viral pour TikTok/Reels/Shorts.

Voici la transcription complète d'une vidéo, organisée par phrases avec leurs timestamps :

${formattedSegments}

Ta mission : Identifier les 5-8 meilleurs moments à transformer en clips de 30 à 90 secondes MINIMUM 30 SECONDES.

RÈGLES CRITIQUES POUR LES TIMESTAMPS :
1. Le "start" DOIT correspondre au DÉBUT d'une phrase (le timestamp de gauche d'une ligne ci-dessus)
2. Le "end" DOIT correspondre à la FIN d'une phrase (le timestamp de droite d'une ligne ci-dessus)
3. JAMAIS couper au milieu d'une phrase — chaque clip doit commencer et finir sur des phrases complètes
4. Utilise EXACTEMENT les timestamps fournis dans les segments, ne les invente pas

Critères pour un bon clip :
- Hook fort dans les 3 premières secondes (la première phrase doit accrocher)
- Contenu autonome (compréhensible sans contexte)
- Valeur claire (enseignement, divertissement, inspiration)
- Potentiel viral (surprise, émotion, insight)
- Fin propre : la dernière phrase doit conclure une idée, pas rester en suspens

Pour chaque clip, réponds en JSON :
{
  "suggestions": [
    {
      "start": 45.2,
      "end": 87.5,
      "title": "Titre accrocheur 50-60 caractères",
      "description": "Description 150-200 caractères pour réseaux sociaux",
      "hashtags": ["crypto", "investissement", "finance"],
      "score": 8.5
    }
  ]
}

Réponds UNIQUEMENT en JSON valide, rien d'autre.`
}

function parseClaudeResponse(responseText: string): ClipSuggestion[] {
  const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('Aucun JSON trouvé dans la réponse')
  }

  const parsed = JSON.parse(jsonMatch[0])
  const suggestions: unknown[] = parsed.suggestions

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    throw new Error('Le champ "suggestions" est vide ou absent')
  }

  return suggestions.map((s: unknown) => {
    const suggestion = s as Record<string, unknown>
    if (
      typeof suggestion.start !== 'number' ||
      typeof suggestion.end !== 'number' ||
      typeof suggestion.title !== 'string'
    ) {
      throw new Error('Structure de suggestion invalide')
    }

    return {
      start: suggestion.start,
      end: suggestion.end,
      title: suggestion.title,
      description: (suggestion.description as string) ?? '',
      hashtags: Array.isArray(suggestion.hashtags) ? suggestion.hashtags as string[] : [],
      score: typeof suggestion.score === 'number' ? suggestion.score : 0,
    }
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Vous devez être connecté' },
      { status: 401 }
    )
  }

  let body: SuggestRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de la requête invalide' },
      { status: 400 }
    )
  }

  let fullText: string
  let segments: TranscriptionSegment[]

  if (body.videoId) {
    const { data: video } = await supabase
      .from('videos')
      .select('id')
      .eq('id', body.videoId)
      .eq('user_id', user.id)
      .single()

    if (!video) {
      return NextResponse.json(
        { error: 'Vidéo introuvable ou accès non autorisé' },
        { status: 404 }
      )
    }

    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('full_text, segments')
      .eq('video_id', body.videoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (transcriptionError || !transcription) {
      console.error('Transcription fetch error:', transcriptionError)
      return NextResponse.json(
        { error: 'Aucune transcription trouvée pour cette vidéo. Lancez d\'abord la transcription.' },
        { status: 404 }
      )
    }

    fullText = transcription.full_text
    segments = transcription.segments as TranscriptionSegment[]
  } else if (body.transcription && body.segments) {
    fullText = body.transcription
    segments = body.segments
  } else {
    return NextResponse.json(
      { error: 'Fournissez un videoId ou bien transcription + segments' },
      { status: 400 }
    )
  }

  if (!fullText.trim()) {
    return NextResponse.json(
      { error: 'La transcription est vide. Impossible de générer des suggestions.' },
      { status: 400 }
    )
  }

  try {
    const prompt = buildPrompt(fullText, segments)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    const responseText = textBlock ? textBlock.text : ''

    if (!responseText) {
      return NextResponse.json(
        { error: "L'IA n'a retourné aucune réponse" },
        { status: 500 }
      )
    }

    // Parser puis recaler sur les frontières de phrases
    const rawSuggestions = parseClaudeResponse(responseText)
    const suggestions = snapAllClipsToSentences(rawSuggestions, segments)

    return NextResponse.json({
      success: true,
      data: { suggestions },
    })
  } catch (error) {
    console.error('Claude API error:', error)

    const message = error instanceof Error ? error.message : 'Erreur inconnue'

    if (message.includes('JSON') || message.includes('suggestions') || message.includes('Structure')) {
      return NextResponse.json(
        { error: "Impossible d'analyser la réponse de l'IA. Veuillez réessayer." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la génération des suggestions de clips' },
      { status: 500 }
    )
  }
}
