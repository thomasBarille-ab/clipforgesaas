'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fadeUp, staggerContainer } from '@/lib/motion'

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-xl border transition-colors ${
        open
          ? 'border-purple-500/20 bg-purple-500/[0.03]'
          : 'border-white/10 bg-white/[0.03] hover:border-white/15'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left font-medium text-white"
      >
        {question}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 shrink-0 text-white/30" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4">
              <p className="text-sm leading-relaxed text-white/50">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQ() {
  const { t } = useTranslation()

  const QUESTIONS = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
    { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
    { q: t('landing.faq.q6'), a: t('landing.faq.a6') },
  ]

  return (
    <section id="faq" className="bg-slate-950 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mb-14 text-center"
        >
          <motion.p variants={fadeUp} className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-400">
            {t('landing.faq.label')}
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold text-white md:text-4xl">
            {t('landing.faq.title')}
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="space-y-3"
        >
          {QUESTIONS.map(({ q, a }) => (
            <FAQItem key={q} question={q} answer={a} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
