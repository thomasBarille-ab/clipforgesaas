'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useCountUp } from '@/hooks/useCountUp'
import { fadeUp, staggerContainer } from '@/lib/motion'

function StatItem({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const { count, ref } = useCountUp(value, 2000)

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      custom={delay}
      className="text-center"
    >
      <div className="mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-400 md:text-base">{label}</div>
    </motion.div>
  )
}

export function StatsBar() {
  const { t } = useTranslation()

  const stats = [
    { value: 2500, suffix: '+', label: t('landing.socialProof.stat1Label') },
    { value: 45000, suffix: '+', label: t('landing.socialProof.stat2Label') },
    // { value: 4.9, suffix: '/5', label: t('landing.socialProof.stat3Label') },
    { value: 28, suffix: 'h', label: t('landing.socialProof.stat4Label') },
  ]

  return (
    <section className="bg-slate-950 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-2 gap-8 md:grid-cols-3"
        >
          {stats.map((stat, i) => (
            <StatItem
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={i * 0.2}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
