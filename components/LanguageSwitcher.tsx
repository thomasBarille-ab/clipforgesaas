'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
] as const

interface LanguageSwitcherProps {
  className?: string
  dropUp?: boolean
}

export function LanguageSwitcher({ className, dropUp = true }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function changeLang(code: string) {
    i18n.changeLanguage(code)
    document.documentElement.lang = code
    setOpen(false)
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
      >
        <span className="uppercase font-medium">{current.code}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className={cn(
          'absolute left-0 w-36 overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-xl',
          dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
        )}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLang(lang.code)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                lang.code === current.code
                  ? 'bg-purple-500/15 text-purple-300'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
