import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  if (!profile.stripe_subscription_id) {
    return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 404 })
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const item = subscription.items.data[0]

    return NextResponse.json({
      currentPeriodStart: new Date(item.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(item.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      status: subscription.status,
    })
  } catch (err) {
    console.error('Subscription info error:', err)
    return NextResponse.json(
      { error: 'Impossible de récupérer les informations d\'abonnement' },
      { status: 500 }
    )
  }
}
