import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PlanType } from '@/types/database'

const VALID_PLANS: PlanType[] = ['free', 'pro', 'business']

const PLAN_CREDITS: Record<PlanType, number> = {
  free: 10,
  pro: -1,      // illimité
  business: -1, // illimité
}

interface UpdatePlanBody {
  plan: PlanType
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: UpdatePlanBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de la requête invalide' },
      { status: 400 }
    )
  }

  if (!body.plan || !VALID_PLANS.includes(body.plan)) {
    return NextResponse.json(
      { error: 'Plan invalide. Plans disponibles : free, pro, business' },
      { status: 400 }
    )
  }

  // Fetch current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'Profil introuvable' },
      { status: 404 }
    )
  }

  if (profile.plan === body.plan) {
    return NextResponse.json(
      { error: 'Vous êtes déjà sur ce plan' },
      { status: 400 }
    )
  }

  // Update plan + credits
  const credits = PLAN_CREDITS[body.plan]
  const updateData: Record<string, unknown> = { plan: body.plan }

  // Reset credits when switching plans
  if (credits === -1) {
    // Pro/Business : set a high number to represent unlimited
    updateData.credits_remaining = 999999
  } else {
    updateData.credits_remaining = credits
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (updateError) {
    console.error('Plan update error:', updateError)
    return NextResponse.json(
      { error: 'Erreur lors du changement de plan' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    plan: body.plan,
  })
}
