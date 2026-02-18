import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch the creator persona for a Business plan user.
 * Returns null gracefully if user is not on Business plan, has no persona, or on any error.
 */
export async function fetchPersonaForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    if (!profile || profile.plan !== 'business') return null

    const { data: persona } = await supabase
      .from('creator_personas')
      .select('persona_summary')
      .eq('user_id', userId)
      .single()

    if (!persona || !persona.persona_summary) return null

    return persona.persona_summary
  } catch {
    return null
  }
}
