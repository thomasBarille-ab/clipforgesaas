'use client'

import { useState, useEffect, useCallback } from 'react'

const DEFAULT_KEY = 'clipforge:onboarding'
const DEFAULT_STEPS = 5

interface OnboardingConfig {
  key?: string
  totalSteps?: number
}

export function useOnboarding(config: OnboardingConfig = {}) {
  const storageKey = config.key ?? DEFAULT_KEY
  const totalSteps = config.totalSteps ?? DEFAULT_STEPS

  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const completed = localStorage.getItem(storageKey)
    if (!completed) {
      setActive(true)
    }
  }, [storageKey])

  const next = useCallback(() => {
    setStep((prev) => {
      const nextStep = prev + 1
      if (nextStep >= totalSteps) {
        localStorage.setItem(storageKey, 'true')
        setActive(false)
        return 0
      }
      return nextStep
    })
  }, [totalSteps, storageKey])

  const skip = useCallback(() => {
    localStorage.setItem(storageKey, 'true')
    setActive(false)
    setStep(0)
  }, [storageKey])

  return { active, step, totalSteps, next, skip }
}
