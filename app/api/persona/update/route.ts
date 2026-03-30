import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { SuggestionData } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface ClipRow {
  title: string
  description: string | null
  hashtags: string[]
  virality_score: number | null
  suggestion_data: SuggestionData
  source_start: number | null
  source_end: number | null
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
    .select('title, description, hashtags, virality_score, suggestion_data, source_start, source_end')
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

  if (clips.length < 3) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Pas assez de clips pour générer un persona (minimum 3)',
    })
  }

  // ── Staleness check: skip if clip count hasn't changed ──
  const { data: existingPersona } = await supabase
    .from('creator_personas')
    .select('clip_count')
    .eq('user_id', user.id)
    .single()

  if (existingPersona && existingPersona.clip_count === clips.length) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Persona déjà à jour (même nombre de clips)',
    })
  }

  // ── Pre-aggregate data to reduce prompt size ──
  const typedClips = clips as ClipRow[]
  let titleModifiedCount = 0
  let descModifiedCount = 0
  let hashtagsModifiedCount = 0
  let totalViralityScore = 0
  let viralityCount = 0
  const allHashtags: Record<string, number> = {}
  const durations: number[] = []
  const sampleTitles: string[] = []

  for (const clip of typedClips) {
    const sd = clip.suggestion_data as SuggestionData

    if (clip.title !== sd.title) titleModifiedCount++
    if (clip.description !== sd.description) descModifiedCount++
    if (JSON.stringify(clip.hashtags) !== JSON.stringify(sd.hashtags)) hashtagsModifiedCount++

    if (clip.virality_score !== null) {
      totalViralityScore += clip.virality_score
      viralityCount++
    }

    for (const tag of clip.hashtags) {
      allHashtags[tag] = (allHashtags[tag] || 0) + 1
    }

    if (clip.source_start !== null && clip.source_end !== null) {
      durations.push(clip.source_end - clip.source_start)
    }

    if (sampleTitles.length < 8) {
      sampleTitles.push(clip.title)
    }
  }

  const avgVirality = viralityCount > 0 ? (totalViralityScore / viralityCount).toFixed(1) : 'N/A'
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null
  const topHashtags = Object.entries(allHashtags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => `${tag} (${count}x)`)

  const aggregatedData = `Analyse de ${typedClips.length} clips :

Titres exemples : ${sampleTitles.map(t => `"${t}"`).join(', ')}

Modifications par rapport aux suggestions IA :
- Titres modifiés : ${titleModifiedCount}/${typedClips.length} (${Math.round(titleModifiedCount / typedClips.length * 100)}%)
- Descriptions modifiées : ${descModifiedCount}/${typedClips.length} (${Math.round(descModifiedCount / typedClips.length * 100)}%)
- Hashtags modifiés : ${hashtagsModifiedCount}/${typedClips.length} (${Math.round(hashtagsModifiedCount / typedClips.length * 100)}%)

Score de viralité moyen : ${avgVirality}/10
${avgDuration ? `Durée moyenne des clips : ${avgDuration}s` : ''}

Hashtags les plus utilisés : ${topHashtags.join(', ')}`

  const prompt = `Tu es un analyste de contenu. Voici les données agrégées de ${typedClips.length} clips créés par un utilisateur.

${aggregatedData}

Génère un profil créateur en 4-6 phrases couvrant :
- Style et ton général du créateur
- Thèmes et sujets récurrents (déduits des titres et hashtags)
- Durée préférée des clips
- Style des titres (les modifie-t-il souvent ? dans quel sens ?)
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
