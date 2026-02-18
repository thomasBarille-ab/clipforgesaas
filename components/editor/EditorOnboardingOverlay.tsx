'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Wand2 } from 'lucide-react'
import { useOnboarding } from '@/hooks/useOnboarding'

interface Step {
  id: string
  target: string | null
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    target: null,
    title: 'Bienvenue dans l\'éditeur !',
    description:
      'Personnalisez votre clip avant de le générer : cadrage, sous-titres, découpe sur la timeline...',
  },
  {
    id: 'left-panel',
    target: 'editor-left-panel',
    title: 'Informations & Cadrage',
    description:
      'Modifiez le titre, la description et les hashtags. Ajustez le cadrage horizontal pour le format 9:16.',
  },
  {
    id: 'preview',
    target: 'editor-preview',
    title: 'Prévisualisation',
    description:
      'Visualisez votre clip en temps réel. Basculez entre le mode Cadrage et Aperçu pour voir le rendu final.',
  },
  {
    id: 'subtitles',
    target: 'editor-subtitles',
    title: 'Sous-titres',
    description:
      'Activez et personnalisez les sous-titres : police, taille, couleur, position...',
  },
  {
    id: 'timeline',
    target: 'editor-timeline',
    title: 'La timeline',
    description:
      'Découpez et ajustez vos segments. Utilisez les poignées latérales pour modifier les points d\'entrée et de sortie.',
  },
  {
    id: 'done',
    target: null,
    title: 'Prêt à générer !',
    description:
      'Quand votre clip est parfait, cliquez sur "Générer le clip" dans la barre d\'outils en haut à droite.',
  },
]

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

export function EditorOnboardingOverlay() {
  const { active, step, totalSteps, next, skip } = useOnboarding({
    key: 'clipforge:editor-onboarding',
    totalSteps: STEPS.length,
  })
  const [rect, setRect] = useState<SpotlightRect | null>(null)

  const currentStep = STEPS[step]
  const isModal = !currentStep?.target
  const isLastStep = step === totalSteps - 1

  const measure = useCallback(() => {
    if (!currentStep?.target) {
      setRect(null)
      return
    }
    const el = document.querySelector(
      `[data-onboarding-editor="${currentStep.target}"]`
    )
    if (!el) {
      setRect(null)
      return
    }
    const r = el.getBoundingClientRect()
    const padding = 8
    setRect({
      top: r.top - padding,
      left: r.left - padding,
      width: r.width + padding * 2,
      height: r.height + padding * 2,
    })
  }, [currentStep])

  useEffect(() => {
    if (!active) return
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [active, measure])

  if (!active) return null

  const tooltipStyle = (): React.CSSProperties => {
    if (isModal || !rect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const tooltipWidth = 360
    const tooltipEstimatedHeight = 200
    const margin = 16
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    // Try placing below the element
    let top = rect.top + rect.height + margin
    let left = rect.left + rect.width / 2 - tooltipWidth / 2

    // Clamp horizontally
    if (left < margin) left = margin
    if (left + tooltipWidth > viewportW - margin)
      left = viewportW - margin - tooltipWidth

    // If tooltip would go below viewport, try above
    if (top + tooltipEstimatedHeight > viewportH) {
      top = rect.top - margin - tooltipEstimatedHeight
    }

    // If still off-screen (element is very tall), place to the right
    if (top < 0) {
      top = rect.top + rect.height / 2 - tooltipEstimatedHeight / 2
      left = rect.left + rect.width + margin
      if (left + tooltipWidth > viewportW - margin) {
        // Place to the left instead
        left = rect.left - margin - tooltipWidth
      }
    }

    return { position: 'fixed', top, left, width: tooltipWidth }
  }

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
      {/* Spotlight or full overlay */}
      {rect && !isModal ? (
        <div
          className="fixed transition-all duration-300 ease-in-out"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/75" />
      )}

      {/* Tooltip card */}
      <div style={tooltipStyle()} className="z-[10000]">
        <div className="rounded-2xl border border-white/20 bg-slate-900 p-5 shadow-2xl">
          {/* Icon for modal steps */}
          {isModal && (
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
                {isLastStep ? (
                  <Wand2 className="h-7 w-7 text-white" />
                ) : (
                  <Sparkles className="h-7 w-7 text-white" />
                )}
              </div>
            </div>
          )}

          <h3
            className={`text-lg font-bold text-white ${isModal ? 'text-center' : ''}`}
          >
            {currentStep.title}
          </h3>
          <p
            className={`mt-2 text-sm leading-relaxed text-white/70 ${isModal ? 'text-center' : ''}`}
          >
            {currentStep.description}
          </p>

          {/* Progress dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-purple-500' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={skip}
              className="rounded-lg px-4 py-2 text-sm text-white/50 transition-colors hover:text-white/80"
            >
              Passer
            </button>

            <button
              onClick={next}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              {isLastStep ? 'C\'est compris !' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
