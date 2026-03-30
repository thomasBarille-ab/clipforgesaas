import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import {
  sendSubscriptionStartedEmail,
  sendSubscriptionChangedEmail,
  sendSubscriptionCanceledEmail,
  sendInvoicePaidEmail,
  sendPaymentFailedEmail,
} from '@/lib/email/send'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

// Supabase admin client (service role, no cookies needed for webhooks)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
])

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  // Ignore events we don't handle
  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true })
  }

  const supabase = getAdminClient()

  // ── Idempotency: skip already-processed events ──
  const { error: insertErr } = await supabase
    .from('stripe_events')
    .insert({ event_id: event.id, event_type: event.type })

  if (insertErr) {
    // Duplicate key = already processed → return 200 immediately
    if (insertErr.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    // Other DB error → log but continue (don't block webhook processing)
    console.error('Webhook: stripe_events insert error:', insertErr)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (!userId || !plan) {
          console.error('Webhook: missing metadata on checkout session', session.id)
          break
        }

        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null

        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null

        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            plan,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            credits_remaining: null,
          })
          .eq('id', userId)

        if (updateErr) {
          console.error('Webhook: failed to update profile for checkout', updateErr)
          return NextResponse.json({ error: 'Erreur mise à jour profil' }, { status: 500 })
        }

        // Email de confirmation (non-bloquant)
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single()

        if (profile?.email) {
          await sendSubscriptionStartedEmail(profile.email, plan)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, plan, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('Webhook: no profile for customer', customerId)
          break
        }

        // Handle subscription status changes (past_due, unpaid, canceled)
        const status = subscription.status
        if (status === 'past_due' || status === 'unpaid') {
          console.warn(`Webhook: subscription ${subscription.id} is ${status} for user ${profile.id}`)
          // Don't downgrade yet — Stripe will retry. But if unpaid after retries, handle it.
          if (status === 'unpaid') {
            await supabase
              .from('profiles')
              .update({ plan: 'free', stripe_subscription_id: null, credits_remaining: 3 })
              .eq('id', profile.id)

            if (profile.email) {
              await sendSubscriptionCanceledEmail(profile.email)
            }
          }
          break
        }

        // Detect plan change from price (only if subscription is active)
        if (status === 'active') {
          const priceId = subscription.items.data[0]?.price?.id
          if (priceId) {
            const newPlan = getPlanFromPriceId(priceId)
            if (newPlan && newPlan !== profile.plan) {
              const { error: updateErr } = await supabase
                .from('profiles')
                .update({
                  plan: newPlan,
                  credits_remaining: null,
                })
                .eq('id', profile.id)

              if (updateErr) {
                console.error('Webhook: failed to update plan', updateErr)
                return NextResponse.json({ error: 'Erreur mise à jour plan' }, { status: 500 })
              }

              if (profile.email) {
                await sendSubscriptionChangedEmail(profile.email, profile.plan, newPlan)
              }
            }
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('Webhook: no profile for customer', customerId)
          break
        }

        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            credits_remaining: 3,
          })
          .eq('id', profile.id)

        if (updateErr) {
          console.error('Webhook: failed to downgrade profile', updateErr)
          return NextResponse.json({ error: 'Erreur downgrade profil' }, { status: 500 })
        }

        if (profile.email) {
          await sendSubscriptionCanceledEmail(profile.email)
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, plan')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile?.email) break

        const amount = invoice.amount_paid
          ? `${(invoice.amount_paid / 100).toFixed(2)}€`
          : '0€'
        const invoiceUrl = invoice.hosted_invoice_url || ''

        await sendInvoicePaidEmail(profile.email, amount, invoiceUrl, profile.plan)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        console.error('Payment failed for invoice:', invoice.id, 'customer:', customerId)

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile?.email) break

        // Create a billing portal session for the user to update payment
        try {
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.creaclip.com'}/settings`,
          })
          await sendPaymentFailedEmail(profile.email, portalSession.url)
        } catch (portalErr) {
          console.error('Webhook: failed to create portal session for payment_failed email', portalErr)
          // Fallback: send email with settings URL
          await sendPaymentFailedEmail(
            profile.email,
            `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.creaclip.com'}/settings`
          )
        }

        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error for event', event.type, ':', err instanceof Error ? err.message : err)
    // Return 500 only for unexpected errors — Stripe will retry
    return NextResponse.json({ error: 'Erreur de traitement du webhook' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
