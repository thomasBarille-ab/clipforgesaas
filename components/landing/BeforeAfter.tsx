'use client'

import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fadeLeft, fadeRight, staggerContainer } from '@/lib/motion'

export function BeforeAfter() {
  const { t } = useTranslation()

  const before = [
    t('landing.beforeAfter.before1'),
    t('landing.beforeAfter.before2'),
    t('landing.beforeAfter.before3'),
  ]

  const after = [
    t('landing.beforeAfter.after1'),
    t('landing.beforeAfter.after2'),
    t('landing.beforeAfter.after3'),
  ]

  return (
    <section className="bg-slate-900 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center text-4xl font-bold text-white md:text-5xl"
        >
          {t('landing.beforeAfter.title')}
        </motion.h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Before */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8"
          >
            <motion.h3 variants={fadeLeft} className="mb-6 text-xl font-bold text-red-400">
              {t('landing.beforeAfter.beforeTitle')}
            </motion.h3>
            <div className="space-y-4">
              {before.map((item) => (
                <motion.div key={item} variants={fadeLeft} className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <p className="text-slate-300">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8"
          >
            <motion.h3 variants={fadeRight} className="mb-6 text-xl font-bold text-emerald-400">
              {t('landing.beforeAfter.afterTitle')}
            </motion.h3>
            <div className="space-y-4">
              {after.map((item) => (
                <motion.div key={item} variants={fadeRight} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <p className="text-slate-300">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
