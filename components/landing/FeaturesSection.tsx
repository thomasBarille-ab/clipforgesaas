'use client'

import { motion } from 'framer-motion'

const FEATURES = [
  {
    badge: 'Unique',
    title: 'Pré-sélection guidée',
    description:
      'Vous connaissez vos meilleurs moments mieux que l\'IA. Guidez-la, elle génère uniquement là.',
    comparison: {
      bad: 'OpusClip : 90% de clips inutiles',
      good: 'ClipForge : 100% utiles',
    },
  },
  {
    badge: 'Unique',
    title: 'Preview live avec édition',
    description:
      'Validez AVANT de générer. Éditez sous-titres en temps réel. Ne gaspillez plus de crédits.',
    comparison: {
      bad: 'Vizard : Pas de preview',
      good: 'ClipForge : Édition live',
    },
  },
  {
    badge: 'Unique',
    title: 'Export multi-format 1 clic',
    description:
      'TikTok, Instagram, YouTube... Tous les formats en 1 clic. Ne exportez plus 3 fois le même clip.',
    comparison: {
      bad: 'Descript : Export manuel',
      good: 'ClipForge : Auto multi-format',
    },
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-900 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-16 text-center text-5xl font-bold text-white">
          Ce que les autres ne font pas
        </h2>

        <div className="space-y-24">
          {FEATURES.map((feature, i) => {
            const isReversed = i % 2 === 1
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="grid items-center gap-12 lg:grid-cols-2"
              >
                <div className={`relative overflow-hidden rounded-2xl border border-white/10 ${isReversed ? 'order-1 lg:order-2' : ''}`}>
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                    <span className="text-slate-400">Démo {feature.title}</span>
                  </div>
                </div>

                <div className={isReversed ? 'order-2 lg:order-1' : ''}>
                  <span className="mb-4 inline-block rounded-full bg-purple-500/20 px-4 py-2 text-sm font-semibold text-purple-300">
                    {feature.badge}
                  </span>
                  <h3 className="mb-4 text-3xl font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="mb-6 text-lg text-slate-300">
                    {feature.description}
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-2 text-sm text-slate-400">&#10060; {feature.comparison.bad}</p>
                    <p className="text-sm text-green-400">&#9989; {feature.comparison.good}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
