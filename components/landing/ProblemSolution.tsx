'use client'

import { useTranslation } from 'react-i18next'

export function ProblemSolution() {
  const { t } = useTranslation()

  const problems = [
    { emoji: '&#9200;', title: t('landing.problem.item1Title'), desc: t('landing.problem.item1Desc') },
    { emoji: '&#128176;', title: t('landing.problem.item2Title'), desc: t('landing.problem.item2Desc') },
    { emoji: '&#127919;', title: t('landing.problem.item3Title'), desc: t('landing.problem.item3Desc') },
  ]

  const steps = [
    { num: 1, title: t('landing.solution.step1Title'), desc: t('landing.solution.step1Desc') },
    { num: 2, title: t('landing.solution.step2Title'), desc: t('landing.solution.step2Desc') },
    { num: 3, title: t('landing.solution.step3Title'), desc: t('landing.solution.step3Desc') },
    { num: 4, title: t('landing.solution.step4Title'), desc: t('landing.solution.step4Desc') },
  ]

  return (
    <section id="how-it-works" className="bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Problem */}
        <div className="mb-20">
          <h2 className="mb-12 text-center text-4xl font-bold text-white">
            {t('landing.problem.title')}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {problems.map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl">
                <span className="mb-4 block text-5xl" dangerouslySetInnerHTML={{ __html: emoji }} />
                <h3 className="mb-2 text-2xl font-bold text-white">{title}</h3>
                <p className="text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Solution */}
        <div>
          <h2 className="mb-12 text-center text-4xl font-bold text-white">
            {t('landing.solution.title')}
          </h2>
          <div className="mx-auto max-w-3xl space-y-6">
            {steps.map((step) => (
              <div key={step.num} className="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-2xl font-bold">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}

            <div className="mt-8 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 text-center">
              <strong className="mb-2 block text-2xl text-white">{t('landing.solution.totalTime')}</strong>
              <span className="text-slate-300">{t('landing.solution.totalCompare')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
