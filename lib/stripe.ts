import Stripe from 'stripe'
import type { PlanType } from '@/types/database'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
})

export const PLAN_PRICE_IDS: Record<Exclude<PlanType, 'free'>, string> = {
  pro: process.env.STRIPE_PRICE_PRO!,
  business: process.env.STRIPE_PRICE_BUSINESS!,
}

// Reverse map: price ID → plan name (used in webhooks)
export function getPlanFromPriceId(priceId: string): PlanType | null {
  for (const [plan, id] of Object.entries(PLAN_PRICE_IDS)) {
    if (id === priceId) return plan as PlanType
  }
  return null
}
