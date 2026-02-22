import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { canCreateClip } from '@/lib/plans'
import type { PlanType } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté' },
        { status: 401 }
      )
    }

    // Vérifier la limite de clips par mois
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan = (profile?.plan as PlanType) ?? 'free'
    const clipCheck = await canCreateClip(supabase, user.id, plan)

    if (!clipCheck.allowed) {
      return NextResponse.json(
        { error: `Limite atteinte : ${clipCheck.used}/${clipCheck.limit} clips ce mois-ci. Passez au plan Pro pour des clips illimités.` },
        { status: 403 }
      )
    }

    const { videoId, transcription } = await request.json()

    if (!videoId || !transcription) {
      return NextResponse.json(
        { error: 'Paramètres manquants : videoId et transcription requis' },
        { status: 400 }
      )
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Tu es un expert en création de clips viraux pour les réseaux sociaux.

Voici la transcription d'une vidéo avec les timestamps :

${transcription}

Identifie les 3 à 5 meilleurs moments pour créer des clips courts (30s à 90s).
Pour chaque clip, donne :
- Un titre accrocheur
- Le timestamp de début (en secondes)
- Le timestamp de fin (en secondes)
- Une courte explication de pourquoi ce moment est percutant

Réponds uniquement en JSON avec ce format :
{
  "clips": [
    {
      "title": "...",
      "start_time": 0,
      "end_time": 60,
      "reason": "..."
    }
  ]
}`,
        },
      ],
    })

    const textContent = message.content.find((block) => block.type === 'text')
    const responseText = textContent ? textContent.text : ''

    // Parse the JSON from Claude's response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Impossible d'analyser la réponse de l'IA" },
        { status: 500 }
      )
    }

    const suggestions = JSON.parse(jsonMatch[0])

    return NextResponse.json({ success: true, data: suggestions })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération des suggestions de clips' },
      { status: 500 }
    )
  }
}
