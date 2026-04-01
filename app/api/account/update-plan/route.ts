import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { stripe, PLAN_PRICE_IDS } from '@/lib/stripe'
import type { PlanType } from '@/types/database'

// Service role client pour modifier les colonnes protégées par RLS (plan, credits, stripe_*)
function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

  const newPlan = body.plan
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
  // Case 0: Revert pending cancellation (user clicks on their current plan)
  if (profile.plan === body.plan && profile.stripe_subscription_id) {
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)

    if (subscription.cancel_at_period_end) {
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: false,
      })
      return NextResponse.json({ success: true, cancelReverted: true })
    }

    return NextResponse.json(
      { error: 'Vous êtes déjà sur ce plan' },
      { status: 400 }
    )
  }

  if (profile.plan === body.plan) {
    return NextResponse.json(
      { error: 'Vous êtes déjà sur ce plan' },
      { status: 400 }
    )
  }

  // Case 1: Upgrading to a paid plan without existing subscription → Checkout
  if (newPlan !== 'free' && !profile.stripe_subscription_id) {
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email ?? user.email ?? undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id

      const admin = getAdminClient()
      await admin
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

  // Case 2: Changing paid plan (pro ↔ business) → Checkout modal for confirmation
  if (newPlan !== 'free' && profile.stripe_subscription_id) {
    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Compte de facturation introuvable' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id,
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
        previousSubscriptionId: profile.stripe_subscription_id,
      },
      return_url: `${appUrl}/settings?session_id={CHECKOUT_SESSION_ID}`,
    })

    return NextResponse.json({ action: 'checkout', clientSecret: session.client_secret })
  }

  // Case 3: Downgrade to free with active subscription → cancel at period end
  if (newPlan === 'free' && profile.stripe_subscription_id) {
    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Compte de facturation introuvable' },
        { status: 400 }
      )
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const item = subscription.items.data[0]

    if (subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Votre abonnement est déjà programmé pour être annulé' },
        { status: 400 }
      )
    }

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(item.current_period_end * 1000).toISOString(),
    })
  }

  // Case 4: Downgrade to free without subscription (edge case)
  const admin = getAdminClient()
  const { error: updateError } = await admin
    .from('profiles')
    .update({
      plan: 'free',
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
