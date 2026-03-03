'use client'

import { motion } from 'framer-motion'
import { Upload, Sparkles, Eye, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fadeUp, staggerContainer, scaleUp } from '@/lib/motion'

const ICONS = [Upload, Sparkles, Eye, Download]

export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    { title: t('landing.solution.step1Title'), desc: t('landing.solution.step1Desc') },
    { title: t('landing.solution.step2Title'), desc: t('landing.solution.step2Desc') },
    { title: t('landing.solution.step3Title'), desc: t('landing.solution.step3Desc') },
    { title: t('landing.solution.step4Title'), desc: t('landing.solution.step4Desc') },
  ]

  return (
    <section id="how-it-works" className="bg-slate-950 py-20">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={fadeUp} className="mb-4 text-4xl font-bold text-white md:text-5xl">
            {t('landing.solution.title')}
          </motion.h2>
          <motion.p variants={fadeUp} className="mb-16 text-lg text-slate-400">
            {t('landing.solution.totalTime')} — {t('landing.solution.totalCompare')}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="relative"
        >
          {/* Timeline line */}
          <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-purple-500 via-pink-500 to-purple-500/0 md:left-1/2 md:block" />

          <div className="space-y-12">
            {steps.map((step, i) => {
              const Icon = ICONS[i]
              const isLeft = i % 2 === 0

              return (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  className="relative flex items-start gap-6 md:items-center"
                >
                  {/* Desktop: alternating layout */}
                  <div className={`hidden w-full items-center gap-8 md:flex ${isLeft ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-5/12 ${isLeft ? 'text-right' : 'text-left'}`}>
                      <h3 className="mb-2 text-xl font-bold text-white">{step.title}</h3>
                      <p className="text-slate-400">{step.desc}</p>
                    </div>

                    <motion.div
                      variants={scaleUp}
                      className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-purple-500 bg-slate-950"
                    >
                      <Icon className="h-6 w-6 text-purple-400" />
                    </motion.div>

                    <div className="w-5/12" />
                  </div>

                  {/* Mobile: simple list */}
                  <div className="flex items-start gap-4 md:hidden">
                    <motion.div
                      variants={scaleUp}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="mb-1 text-lg font-bold text-white">{step.title}</h3>
                      <p className="text-sm text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
