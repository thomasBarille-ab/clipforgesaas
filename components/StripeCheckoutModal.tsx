'use client'

import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { X } from 'lucide-react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface Props {
  clientSecret: string
  onClose: () => void
}

export function StripeCheckoutModal({ clientSecret, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-1">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 rounded-full bg-white/10 p-1.5 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret }}
        >
          <EmbeddedCheckout className="rounded-xl" />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  )
}
