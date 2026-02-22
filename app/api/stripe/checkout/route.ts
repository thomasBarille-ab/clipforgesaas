import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLAN_PRICE_IDS } from '@/lib/stripe'
import type { PlanType } from '@/types/database'

interface CheckoutBody {
  plan: 'pro' | 'business'
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: CheckoutBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de la requête invalide' }, { status: 400 })
  }

  if (!body.plan || !(body.plan in PLAN_PRICE_IDS)) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_subscription_id, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  // If user already has an active subscription, redirect to portal instead
  if (profile.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'Vous avez déjà un abonnement actif. Utilisez le portail de gestion.' },
      { status: 400 }
    )
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Create Checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: PLAN_PRICE_IDS[body.plan as Exclude<PlanType, 'free'>],
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
      plan: body.plan,
    },
    success_url: `${appUrl}/settings?success=true`,
    cancel_url: `${appUrl}/settings?canceled=true`,
  })

  return NextResponse.json({ url: session.url })
}
