import Link from 'next/link'
import { Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    price: '0',
    description: 'Pour découvrir ClipForge',
    features: [
      '10 clips / mois',
      'Toutes les features',
      'Preview live',
      'Export multi-format',
    ],
    caveats: ['Watermark ClipForge'],
    cta: 'Commencer gratuitement',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '24',
    description: 'Pour les créateurs sérieux',
    badge: 'Populaire',
    features: [
      'Clips illimités',
      'Sans watermark',
      'Tous styles de sous-titres',
      'Templates personnalisés',
      'Support prioritaire',
      'Historique illimité',
    ],
    caveats: [],
    cta: 'Passer Pro',
    href: '/signup',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '49',
    description: 'Pour les équipes',
    features: [
      'Tout Pro +',
      'Équipe (5 membres)',
      'White label',
      'API access',
      'Account manager dédié',
      'Factures personnalisées',
    ],
    caveats: [],
    cta: 'Contactez-nous',
    href: '/signup',
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="bg-slate-900 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-4 text-center text-5xl font-bold text-white">
          Tarifs simples &amp; transparents
        </h2>
        <p className="mb-16 text-center text-xl text-slate-400">
          Commencez gratuitement, upgradez quand vous êtes prêt
        </p>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 backdrop-blur-xl ${
                plan.highlighted
                  ? 'border-2 border-purple-500 bg-white/5'
                  : 'border border-white/10 bg-white/5'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 text-sm font-semibold">
                  &#11088; {plan.badge}
                </div>
              )}

              <h3 className="mb-4 text-2xl font-bold text-white">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white">{plan.price}&euro;</span>
                <span className="text-slate-400">/mois</span>
              </div>
              <p className="mb-6 text-sm text-slate-400">{plan.description}</p>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
                {plan.caveats.map((caveat) => (
                  <li key={caveat} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="mt-0.5 shrink-0 text-xs">&#9888;&#65039;</span>
                    {caveat}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`flex w-full items-center justify-center rounded-xl px-6 py-3 font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:scale-105'
                    : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {plan.cta}
              </Link>

              {plan.highlighted && (
                <p className="mt-4 text-center text-sm text-slate-400">
                  Garantie satisfait ou remboursé 30 jours
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
