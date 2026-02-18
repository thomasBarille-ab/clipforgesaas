import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { SuggestionData } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface ClipForAnalysis {
  title: string
  description: string | null
  hashtags: string[]
  virality_score: number | null
  suggestion_data: SuggestionData
  title_modified: boolean
  description_modified: boolean
  hashtags_modified: boolean
}

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Vérifier plan Business
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile || profile.plan !== 'business') {
    return NextResponse.json(
      { error: 'Fonctionnalité réservée au plan Business' },
      { status: 403 }
    )
  }

  // Fetch les 50 derniers clips ready avec suggestion_data
  const { data: clips, error: clipsError } = await supabase
    .from('clips')
    .select('title, description, hashtags, virality_score, suggestion_data')
    .eq('user_id', user.id)
    .eq('status', 'ready')
    .not('suggestion_data', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (clipsError || !clips) {
    console.error('Persona update - clips fetch error:', clipsError)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clips' },
      { status: 500 }
    )
  }

  // Pas assez de données pour construire un persona
  if (clips.length < 3) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Pas assez de clips pour générer un persona (minimum 3)',
    })
  }

  // Construire le payload d'analyse
  const clipsAnalysis: ClipForAnalysis[] = clips.map((clip) => {
    const sd = clip.suggestion_data as SuggestionData
    return {
      title: clip.title,
      description: clip.description,
      hashtags: clip.hashtags,
      virality_score: clip.virality_score,
      suggestion_data: sd,
      title_modified: clip.title !== sd.title,
      description_modified: clip.description !== sd.description,
      hashtags_modified: JSON.stringify(clip.hashtags) !== JSON.stringify(sd.hashtags),
    }
  })

  const prompt = `Tu es un analyste de contenu. Analyse les ${clipsAnalysis.length} clips de cet utilisateur.

Pour chaque clip tu as :
- La suggestion IA originale (suggestion_data)
- Ce que l'utilisateur a gardé ou modifié (title, description, hashtags)
- Des booléens indiquant si le titre, la description et les hashtags ont été modifiés

Données :
${JSON.stringify(clipsAnalysis, null, 2)}

Génère un profil créateur en 4-6 phrases couvrant :
- Style et ton général du créateur
- Thèmes et sujets récurrents
- Durée préférée des clips
- Style des titres (modifie-t-il souvent ? dans quel sens ?)
- Types de hashtags préférés
- Préférence de viralité (scores élevés ou contenu de niche)

Réponds en texte brut uniquement, pas de JSON, pas de markdown. En français.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    const personaSummary = textBlock?.text?.trim()

    if (!personaSummary) {
      return NextResponse.json(
        { error: "L'IA n'a pas généré de persona" },
        { status: 500 }
      )
    }

    // Upsert dans creator_personas
    const { error: upsertError } = await supabase
      .from('creator_personas')
      .upsert(
        {
          user_id: user.id,
          persona_summary: personaSummary,
          clip_count: clips.length,
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      console.error('Persona upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde du persona' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, clip_count: clips.length })
  } catch (error) {
    console.error('Persona generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du persona' },
      { status: 500 }
    )
  }
}
