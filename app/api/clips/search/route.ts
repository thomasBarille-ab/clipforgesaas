import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { snapAllClipsToSentences } from '@/lib/clipBoundaries'
import type { TranscriptionSegment, ClipSuggestion } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface SearchRequestBody {
  videoId: string
  prompt: string
}

/**
 * Formate les segments en texte avec timestamps, regroupés par phrases.
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

function buildSearchPrompt(
  userPrompt: string,
  segments: TranscriptionSegment[]
): string {
  const formattedSegments = formatSegmentsForPrompt(segments)

  return `Tu es un expert en création de contenu viral pour TikTok/Reels/Shorts.

Voici la transcription complète d'une vidéo, organisée par phrases avec leurs timestamps :

${formattedSegments}

L'utilisateur cherche un clip spécifique. Voici sa demande :
"${userPrompt}"

Ta mission : Trouve dans la transcription les 1 à 3 meilleurs passages qui correspondent à cette demande. Chaque clip doit durer entre 30 et 90 secondes MINIMUM 30 SECONDES.

RÈGLES CRITIQUES POUR LES TIMESTAMPS :
1. Le "start" DOIT correspondre au DÉBUT d'une phrase (le timestamp de gauche d'une ligne ci-dessus)
2. Le "end" DOIT correspondre à la FIN d'une phrase (le timestamp de droite d'une ligne ci-dessus)
3. JAMAIS couper au milieu d'une phrase — chaque clip doit commencer et finir sur des phrases complètes
4. Utilise EXACTEMENT les timestamps fournis dans les segments, ne les invente pas
5. Le clip doit être compréhensible de manière autonome
6. Privilégie les passages avec un hook fort au début
7. La fin doit conclure une idée, pas rester en suspens

Si aucun passage ne correspond vraiment à la demande, retourne un tableau vide.

Réponds UNIQUEMENT en JSON valide :
{
  "suggestions": [
    {
      "start": 45.2,
      "end": 87.5,
      "title": "Titre accrocheur 50-60 caractères",
      "description": "Description 150-200 caractères pour réseaux sociaux",
      "hashtags": ["tag1", "tag2", "tag3"],
      "score": 8.5
    }
  ]
}

Si aucun passage ne correspond, réponds : { "suggestions": [] }

Réponds UNIQUEMENT en JSON valide, rien d'autre.`
}

function parseResponse(responseText: string): ClipSuggestion[] {
  const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('Aucun JSON trouvé dans la réponse')
  }

  const parsed = JSON.parse(jsonMatch[0])
  const suggestions: unknown[] = parsed.suggestions

  if (!Array.isArray(suggestions)) {
    throw new Error('Le champ "suggestions" est absent')
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

  let body: SearchRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de la requête invalide' },
      { status: 400 }
    )
  }

  if (!body.videoId || !body.prompt?.trim()) {
    return NextResponse.json(
      { error: 'Les paramètres videoId et prompt sont requis' },
      { status: 400 }
    )
  }

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

  const { data: transcription } = await supabase
    .from('transcriptions')
    .select('full_text, segments')
    .eq('video_id', body.videoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!transcription?.full_text) {
    return NextResponse.json(
      { error: 'Aucune transcription trouvée. Lancez d\'abord la transcription.' },
      { status: 404 }
    )
  }

  const segments = transcription.segments as TranscriptionSegment[]

  try {
    const prompt = buildSearchPrompt(
      body.prompt.trim(),
      segments
    )

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
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
    const rawSuggestions = parseResponse(responseText)
    const suggestions = snapAllClipsToSentences(rawSuggestions, segments)

    return NextResponse.json({
      success: true,
      data: { suggestions },
    })
  } catch (error) {
    console.error('Clip search error:', error)

    const message = error instanceof Error ? error.message : 'Erreur inconnue'

    if (message.includes('JSON') || message.includes('suggestions') || message.includes('Structure')) {
      return NextResponse.json(
        { error: "Impossible d'analyser la réponse de l'IA. Veuillez reformuler votre demande." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la recherche de clips' },
      { status: 500 }
    )
  }
}
