'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Sparkles, Upload } from 'lucide-react'
import { useOnboarding } from '@/hooks/useOnboarding'

interface Step {
  id: string
  target: string | null
  titleKey: string
  descriptionKey: string
}

const STEPS: Step[] = [
  { id: 'welcome', target: null, titleKey: 'onboarding.welcome.title', descriptionKey: 'onboarding.welcome.description' },
  { id: 'stats', target: 'stats', titleKey: 'onboarding.stats.title', descriptionKey: 'onboarding.stats.description' },
  { id: 'upload-btn', target: 'upload-btn', titleKey: 'onboarding.uploadBtn.title', descriptionKey: 'onboarding.uploadBtn.description' },
  { id: 'quick-actions', target: 'quick-actions', titleKey: 'onboarding.quickActions.title', descriptionKey: 'onboarding.quickActions.description' },
  { id: 'done', target: null, titleKey: 'onboarding.done.title', descriptionKey: 'onboarding.done.description' },
]

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

export function OnboardingOverlay() {
  const { t } = useTranslation()
  const { active, step, totalSteps, next, skip } = useOnboarding()
  const router = useRouter()
  const [rect, setRect] = useState<SpotlightRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const currentStep = STEPS[step]
  const isModal = !currentStep?.target
  const isLastStep = step === totalSteps - 1

  const measure = useCallback(() => {
    if (!currentStep?.target) {
      setRect(null)
      return
    }
    const el = document.querySelector(`[data-onboarding="${currentStep.target}"]`)
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
    const margin = 16
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    let top = rect.top + rect.height + margin
    let left = rect.left + rect.width / 2 - tooltipWidth / 2

    // Clamp horizontally
    if (left < margin) left = margin
    if (left + tooltipWidth > viewportW - margin) left = viewportW - margin - tooltipWidth

    // If tooltip would go below viewport, place it above the element
    if (top + 200 > viewportH) {
      top = rect.top - margin - 200
    }

    return { position: 'fixed', top, left, width: tooltipWidth }
  }

  const handleNext = () => {
    if (isLastStep) {
      next()
      router.push('/upload')
    } else {
      next()
    }
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
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
                  <Upload className="h-7 w-7 text-white" />
                ) : (
                  <Sparkles className="h-7 w-7 text-white" />
                )}
              </div>
            </div>
          )}

          <h3 className={`text-lg font-bold text-white ${isModal ? 'text-center' : ''}`}>
            {t(currentStep.titleKey)}
          </h3>
          <p className={`mt-2 text-sm leading-relaxed text-white/70 ${isModal ? 'text-center' : ''}`}>
            {t(currentStep.descriptionKey)}
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
              {t('common.skip')}
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              {isLastStep ? (
                <>
                  <Upload className="h-4 w-4" />
                  {t('onboarding.importFirst')}
                </>
              ) : (
                t('common.next')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
