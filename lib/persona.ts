import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch the creator persona for a Business plan user.
 * Returns null gracefully if user is not on Business plan, has no persona, or on any error.
 * Pass `plan` to avoid an extra DB query when the caller already knows the user's plan.
 */
export async function fetchPersonaForUser(
  supabase: SupabaseClient,
  userId: string,
  plan?: string
): Promise<string | null> {
  try {
    // Use provided plan or fetch it
    const userPlan = plan ?? (
      await supabase.from('profiles').select('plan').eq('id', userId).single()
    ).data?.plan

    if (userPlan !== 'business') return null

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
