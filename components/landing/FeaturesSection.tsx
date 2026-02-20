'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export function FeaturesSection() {
  const { t } = useTranslation()

  const FEATURES = [
    {
      badge: t('landing.features.badge'),
      title: t('landing.features.feature1Title'),
      description: t('landing.features.feature1Desc'),
      comparison: {
        bad: t('landing.features.feature1Bad'),
        good: t('landing.features.feature1Good'),
      },
    },
    {
      badge: t('landing.features.badge'),
      title: t('landing.features.feature2Title'),
      description: t('landing.features.feature2Desc'),
      comparison: {
        bad: t('landing.features.feature2Bad'),
        good: t('landing.features.feature2Good'),
      },
    },
    {
      badge: t('landing.features.badge'),
      title: t('landing.features.feature3Title'),
      description: t('landing.features.feature3Desc'),
      comparison: {
        bad: t('landing.features.feature3Bad'),
        good: t('landing.features.feature3Good'),
      },
    },
  ]

  return (
    <section id="features" className="bg-slate-900 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-16 text-center text-5xl font-bold text-white">
          {t('landing.features.title')}
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
                    <span className="text-slate-400">{t('landing.features.demo', { title: feature.title })}</span>
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
