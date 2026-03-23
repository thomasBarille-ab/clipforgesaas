import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { fetchPersonaForUser } from '@/lib/persona'
import { hasFeatureAccess } from '@/lib/plans'
import type { TranscriptionSegment, PlanType } from '@/types/database'

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
  minDuration?: number
  maxDuration?: number
  clipCount?: number
}

interface ClipFilters {
  minDuration: number
  maxDuration: number
  clipCount: number
}

function buildPrompt(transcription: string, segments: TranscriptionSegment[], persona: string | null, filters: ClipFilters): string {
  const segmentsJson = JSON.stringify(segments, null, 2)

  const personaBlock = persona
    ? `\nPROFIL DU CRÉATEUR (adapte tes suggestions à son style) :\n${persona}\n\nTiens compte de ce profil pour privilégier ses thèmes, adapter les durées, formuler les titres dans son style, choisir des hashtags cohérents.\n`
    : ''

  return `Tu es un expert en création de contenu viral pour TikTok/Reels/Shorts.
${personaBlock}
Voici la transcription complète d'une vidéo :
${transcription}

Segments avec timestamps (en secondes) :
${segmentsJson}

Ta mission : Identifier les ${filters.clipCount} meilleurs moments à transformer en clips de ${filters.minDuration}-${filters.maxDuration} secondes.

RÈGLES OBLIGATOIRES pour les timestamps :
- Chaque clip DOIT commencer au début d'une phrase (au timestamp "start" d'un segment existant)
- Chaque clip DOIT finir à la fin d'une phrase (au timestamp "end" d'un segment existant)
- Ne coupe JAMAIS une phrase en cours
- Chaque clip DOIT durer au minimum ${filters.minDuration} secondes et au maximum ${filters.maxDuration} secondes

Critères pour un bon clip :
- Hook fort dans les 3 premières secondes
- Contenu autonome (compréhensible sans contexte)
- Valeur claire (enseignement, divertissement, inspiration)
- Potentiel viral (surprise, émotion, insight)

PASSAGES À EXCLURE OBLIGATOIREMENT :
- Les placements de produit et sponsors (ex: "cette vidéo est sponsorisée par...", "merci à ... pour le partenariat")
- Les appels à l'action YouTube (ex: "abonnez-vous", "likez la vidéo", "activez la cloche", "laissez un commentaire", "partagez la vidéo")
- Les intros/outros promotionnelles
- Ne sélectionne JAMAIS un passage contenant ce type de contenu, même partiellement

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

  // 3b. Déterminer les filtres selon le plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan as PlanType) ?? 'free'
  const canUseFilters = hasFeatureAccess(plan, 'clipFilters')

  const defaultFilters: ClipFilters = { minDuration: 60, maxDuration: 180, clipCount: 5 }
  const filters: ClipFilters = canUseFilters
    ? {
        minDuration: (typeof body.minDuration === 'number' && body.minDuration >= 15) ? body.minDuration : defaultFilters.minDuration,
        maxDuration: (typeof body.maxDuration === 'number' && body.maxDuration >= 30) ? body.maxDuration : defaultFilters.maxDuration,
        clipCount: ([3, 5, 8, 10].includes(body.clipCount ?? 0)) ? body.clipCount! : defaultFilters.clipCount,
      }
    : defaultFilters

  // S'assurer que max >= min
  if (filters.maxDuration < filters.minDuration) {
    filters.maxDuration = filters.minDuration
  }

  try {
    // 4. Appeler Claude
    const persona = await fetchPersonaForUser(supabase, user.id)
    const prompt = buildPrompt(fullText, segments, persona, filters)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
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
      .filter((s) => (s.end - s.start) >= filters.minDuration)

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
