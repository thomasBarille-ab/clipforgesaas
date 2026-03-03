'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { fadeUp, staggerContainer } from '@/lib/motion'

export function FinalCTA() {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-900/50 via-slate-950 to-pink-900/50 py-32">
      {/* Floating blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-20 top-1/4 h-72 w-72 animate-float rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-72 w-72 animate-float-slow rounded-full bg-pink-600/20 blur-3xl [animation-delay:3s]" />
      </div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="relative z-10 mx-auto max-w-6xl px-6 text-center"
      >
        <motion.h2 variants={fadeUp} className="mb-6 text-5xl font-bold text-white md:text-6xl">
          {t('landing.finalCta.title')}
        </motion.h2>
        <motion.p variants={fadeUp} className="mb-12 text-2xl text-slate-300">
          {t('landing.finalCta.subtitle')}
        </motion.p>

        <motion.div variants={fadeUp}>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-[length:200%_auto] px-12 py-6 text-xl font-bold text-white shadow-2xl transition-transform animate-gradient-shift hover:scale-105 hover:shadow-purple-500/50"
          >
            {t('landing.finalCta.cta')}
            <span className="mt-2 block text-sm font-normal opacity-80">{t('landing.finalCta.ctaSub')}</span>
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-12 flex flex-wrap justify-center gap-8 text-slate-400">
          <span>&#10003; {t('landing.finalCta.benefit1')}</span>
          <span>&#10003; {t('landing.finalCta.benefit2')}</span>
          <span>&#10003; {t('landing.finalCta.benefit3')}</span>
        </motion.div>
      </motion.div>
    </section>
  )
}
