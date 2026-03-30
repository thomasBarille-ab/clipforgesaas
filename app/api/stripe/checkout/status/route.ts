import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id manquant' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // If payment is complete, update profile immediately (don't wait for webhook)
    if (session.status === 'complete' && session.metadata?.userId === user.id) {
      const plan = session.metadata.plan
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id ?? null
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? null

      await supabase
        .from('profiles')
        .update({
          plan,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          credits_remaining: null,
        })
        .eq('id', user.id)
    }

    return NextResponse.json({
      status: session.status,
      paymentStatus: session.payment_status,
    })
  } catch (error) {
    console.error('Stripe session retrieve error:', error)
    return NextResponse.json(
      { error: 'Session introuvable' },
      { status: 404 }
    )
  }
}
