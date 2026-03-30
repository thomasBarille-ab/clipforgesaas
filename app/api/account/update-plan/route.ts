import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLAN_PRICE_IDS } from '@/lib/stripe'
import type { PlanType } from '@/types/database'

const VALID_PLANS: PlanType[] = ['free', 'pro', 'business']

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
    .select('plan, stripe_customer_id, stripe_subscription_id, email')
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

  const newPlan = body.plan
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
  // Case 1: Upgrading to a paid plan without existing subscription → Checkout
  if (newPlan !== 'free' && !profile.stripe_subscription_id) {
    // Create Stripe customer if needed
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email ?? user.email ?? undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      ui_mode: 'embedded',
      line_items: [
        {
          price: PLAN_PRICE_IDS[newPlan as Exclude<PlanType, 'free'>],
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        plan: newPlan,
      },
      return_url: `${appUrl}/settings?session_id={CHECKOUT_SESSION_ID}`,
    })

    return NextResponse.json({ action: 'checkout', clientSecret: session.client_secret })
  }

  // Case 2: Changing paid plan (upgrade/downgrade between pro/business) → API directe
  if (newPlan !== 'free' && profile.stripe_subscription_id) {
    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Compte de facturation introuvable' },
        { status: 400 }
      )
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const subscriptionItemId = subscription.items.data[0].id

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [{ id: subscriptionItemId, price: PLAN_PRICE_IDS[newPlan as Exclude<PlanType, 'free'>] }],
      proration_behavior: 'create_prorations',
    })

    await supabase
      .from('profiles')
      .update({ plan: newPlan })
      .eq('id', user.id)

    return NextResponse.json({ success: true, plan: newPlan })
  }

  // Case 3: Downgrade to free with active subscription → annulation directe
  if (newPlan === 'free' && profile.stripe_subscription_id) {
    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Compte de facturation introuvable' },
        { status: 400 }
      )
    }

    await stripe.subscriptions.cancel(profile.stripe_subscription_id)

    await supabase
      .from('profiles')
      .update({
        plan: 'free',
        credits_remaining: 3,
        stripe_subscription_id: null,
      })
      .eq('id', user.id)

    return NextResponse.json({ success: true, plan: 'free' })
  }

  // Case 4: Downgrade to free without subscription (edge case) → direct update
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      plan: 'free',
      credits_remaining: 3,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Plan update error:', updateError)
    return NextResponse.json(
      { error: 'Erreur lors du changement de plan' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, plan: 'free' })

  } catch (err) {
    console.error('Stripe API error in update-plan:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la communication avec Stripe' },
      { status: 500 }
    )
  }
}
