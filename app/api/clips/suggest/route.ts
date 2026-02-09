import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { TranscriptionSegment } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface ClipSuggestion {
  start: number
  end: number
  title: string
  description: string
  hashtags: string[]
  score: number
}

interface SuggestRequestBody {
  videoId?: string
  transcription?: string
  segments?: TranscriptionSegment[]
}

function buildPrompt(transcription: string, segments: TranscriptionSegment[]): string {
  const segmentsPreview = JSON.stringify(segments.slice(0, 50), null, 2)

  return `Tu es un expert en création de contenu viral pour TikTok/Reels/Shorts.

Voici la transcription complète d'une vidéo :
${transcription}

Segments avec timestamps :
${segmentsPreview}

Ta mission : Identifier les 5-8 meilleurs moments à transformer en clips de 30-60s.

Critères pour un bon clip :
- Hook fort dans les 3 premières secondes
- Contenu autonome (compréhensible sans contexte)
- Valeur claire (enseignement, divertissement, inspiration)
- Potentiel viral (surprise, émotion, insight)

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
  // Extraire le JSON de la réponse (gère les cas avec backticks markdown)
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

  // Valider chaque suggestion
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

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Vous devez être connecté' },
      { status: 401 }
    )
  }

  // 2. Parse body
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

  // 3. Récupérer la transcription
  if (body.videoId) {
    // Via videoId → fetch depuis la DB
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
    // Données fournies directement
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
    // 4. Appeler Claude
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

    // 5. Parser et valider la réponse
    const suggestions = parseClaudeResponse(responseText)

    return NextResponse.json({
      success: true,
      data: { suggestions },
    })
  } catch (error) {
    console.error('Claude API error:', error)

    const message = error instanceof Error ? error.message : 'Erreur inconnue'

    // Distinguer erreur de parsing vs erreur API
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
