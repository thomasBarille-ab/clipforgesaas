'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'

export function FinalCTA() {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-900/50 via-slate-950 to-amber-900/50 py-32">
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <h2 className="mb-6 text-5xl font-bold text-white md:text-6xl">
          {t('landing.finalCta.title')}
        </h2>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-105"
          >
            {t('landing.hero.getStarted')}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-white/10"
          >
            {t('nav.signIn')}
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-slate-400">
          <span>&#10003; {t('landing.finalCta.benefit1')}</span>
          <span>&#10003; {t('landing.finalCta.benefit2')}</span>
          <span>&#10003; {t('landing.finalCta.benefit3')}</span>
        </div>
      </div>
    </section>
  )
}
