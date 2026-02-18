import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { fetchPersonaForUser } from '@/lib/persona'
import type { TranscriptionSegment } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface SearchRequestBody {
  videoId: string
  prompt: string
}

interface ClipSuggestion {
  start: number
  end: number
  title: string
  description: string
  hashtags: string[]
  score: number
}

function buildSearchPrompt(
  userPrompt: string,
  fullText: string,
  segments: TranscriptionSegment[],
  persona: string | null
): string {
  const segmentsJson = JSON.stringify(segments, null, 2)

  const personaBlock = persona
    ? `\nPROFIL DU CRÉATEUR (adapte tes suggestions à son style) :\n${persona}\n\nTiens compte de ce profil pour privilégier ses thèmes, adapter les durées, formuler les titres dans son style, choisir des hashtags cohérents.\n`
    : ''

  return `Tu es un expert en création de contenu viral pour TikTok/Reels/Shorts.
${personaBlock}
Voici la transcription complète d'une vidéo :
${fullText}

Segments avec timestamps (en secondes) :
${segmentsJson}

L'utilisateur cherche un clip spécifique. Voici sa demande :
"${userPrompt}"

Ta mission : Trouve dans la transcription les 1 à 3 meilleurs passages qui correspondent à cette demande. Chaque clip doit durer entre 15 et 90 secondes.

Règles :
- Les timestamps start/end DOIVENT correspondre à des segments existants dans la transcription
- Le clip doit être compréhensible de manière autonome
- Privilégie les passages avec un hook fort au début
- Si aucun passage ne correspond vraiment à la demande, retourne un tableau vide

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

  // Vérifier ownership de la vidéo
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

  // Récupérer la transcription
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

  try {
    const persona = await fetchPersonaForUser(supabase, user.id)
    const prompt = buildSearchPrompt(
      body.prompt.trim(),
      transcription.full_text,
      transcription.segments as TranscriptionSegment[],
      persona
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

    const suggestions = parseResponse(responseText)

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
