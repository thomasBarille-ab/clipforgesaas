'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { fadeUp, fadeLeft, fadeRight } from '@/lib/motion'

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
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-16 text-center text-5xl font-bold text-white"
        >
          {t('landing.features.title')}
        </motion.h2>

        <div className="space-y-24">
          {FEATURES.map((feature, i) => {
            const isReversed = i % 2 === 1
            const contentVariants = isReversed ? fadeRight : fadeLeft
            const visualVariants = isReversed ? fadeLeft : fadeRight

            return (
              <div
                key={feature.title}
                className="grid items-center gap-12 lg:grid-cols-2"
              >
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={visualVariants}
                  className={`relative overflow-hidden rounded-2xl border border-white/10 ${isReversed ? 'order-1 lg:order-2' : ''}`}
                >
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                    <span className="text-slate-400">{t('landing.features.demo', { title: feature.title })}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={contentVariants}
                  className={isReversed ? 'order-2 lg:order-1' : ''}
                >
                  <span className="mb-4 inline-block rounded-full bg-purple-500/20 px-4 py-2 text-sm font-semibold text-purple-300">
                    {feature.badge}
                  </span>
                  <h3 className="mb-4 text-3xl font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="mb-6 text-lg text-slate-300">
                    {feature.description}
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-transform hover:scale-[1.02]">
                    <p className="mb-2 text-sm text-slate-400">&#10060; {feature.comparison.bad}</p>
                    <p className="text-sm text-green-400">&#9989; {feature.comparison.good}</p>
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
