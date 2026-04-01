import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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
      const previousSubscriptionId = session.metadata.previousSubscriptionId
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id ?? null
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? null

      const admin = getAdminClient()
      await admin
        .from('profiles')
        .update({
          plan,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
        })
        .eq('id', user.id)

      // Cancel previous subscription if this was a plan switch
      if (previousSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(previousSubscriptionId)
        } catch (cancelErr) {
          console.error('Checkout status: failed to cancel previous sub', cancelErr)
        }
      }
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
