'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export function FinalCTA() {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-900/50 via-slate-950 to-pink-900/50 py-32">
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <h2 className="mb-6 text-5xl font-bold text-white md:text-6xl">
          {t('landing.finalCta.title')}
        </h2>
        <p className="mb-12 text-2xl text-slate-300">
          {t('landing.finalCta.subtitle')}
        </p>

        <Link
          href="/signup"
          className="inline-block rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-12 py-6 text-xl font-bold text-white shadow-2xl transition-transform hover:scale-105 hover:shadow-purple-500/50"
        >
          {t('landing.finalCta.cta')}
          <span className="mt-2 block text-sm font-normal opacity-80">{t('landing.finalCta.ctaSub')}</span>
        </Link>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-slate-400">
          <span>&#10003; {t('landing.finalCta.benefit1')}</span>
          <span>&#10003; {t('landing.finalCta.benefit2')}</span>
          <span>&#10003; {t('landing.finalCta.benefit3')}</span>
        </div>
      </div>
    </section>
  )
}
